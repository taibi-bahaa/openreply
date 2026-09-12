import { Worker, type Job } from "bullmq";
import { getRedisConnection, type ProcessYouTubeCommentJob } from "./client";
import { prisma } from "@/lib/db/client";
import { matchKeywords } from "@/lib/utils/keyword-matcher";
import { postCommentReply, checkSubscription } from "@/lib/youtube/client";
import { consumeQuota, QUOTA_COSTS } from "@/lib/youtube/quota";
import { generateReply } from "@/lib/ai/reply-generator";
import { renderMessageWithTracking, type MessageTrackedLink } from "@/lib/tracking/message";

export function createYTWorker() {
  return new Worker<ProcessYouTubeCommentJob>(
    "yt-comment-processing",
    async (job) => {
      await processYouTubeComment(job);
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    }
  );
}

async function processYouTubeComment(job: Job<ProcessYouTubeCommentJob>): Promise<void> {
  const {
    youtubeAccountId,
    videoId,
    commentId,
    commentText,
    authorName,
    authorChannelId,
  } = job.data;

  const account = await prisma.youTubeAccount.findUnique({
    where: { channelId: youtubeAccountId },
  });

  if (!account) {
    console.error(`[YT Worker] YouTube account ${youtubeAccountId} not found`);
    return;
  }

  const automations = await prisma.youTubeAutomation.findMany({
    where: {
      youtubeAccountId: account.id,
      isActive: true,
      OR: [{ videoId: videoId }, { matchAnyVideo: true }],
    },
    include: {
      trackedLinks: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const automation of automations) {
    const matchResult = automation.matchAnyWord
      ? { matched: true, matchedKeyword: null }
      : matchKeywords(commentText, automation.keywords, automation.wholeWordMatch);

    if (!matchResult.matched) {
      continue;
    }

    const existingLog = await prisma.youTubeCommentLog.findUnique({
      where: {
        youtubeAccountId_parentCommentId: {
          youtubeAccountId: account.id,
          parentCommentId: commentId,
        },
      },
    });

    if (existingLog) {
      continue;
    }

    const quota = await consumeQuota(QUOTA_COSTS.COMMENT_INSERT);
    if (!quota.allowed) {
      await prisma.youTubeCommentLog.create({
        data: {
          workspaceId: automation.workspaceId,
          youtubeAccountId: account.id,
          automationId: automation.id,
          videoId,
          parentCommentId: commentId,
          authorName,
          authorChannelId,
          commentText,
          matchedKeyword: matchResult.matchedKeyword,
          status: "SKIPPED_QUOTA",
          errorMessage: "Daily YouTube API quota limit reached",
        },
      });
      continue;
    }

    let replyText = "";
    const isSubscribed = automation.requireSubscribe
      ? await checkSubscription(account.accessToken, account.channelId, authorChannelId)
      : true;

    if (automation.requireSubscribe && isSubscribed === false && automation.notSubscribedReply) {
      replyText = renderMessageWithTracking({
        message: automation.notSubscribedReply,
        commenterName: authorName,
        trackedLinks: automation.trackedLinks,
      });
    } else {
      if (automation.replyMode === "TEMPLATE" && automation.replyTemplates.length > 0) {
        const template =
          automation.replyTemplates[Math.floor(Math.random() * automation.replyTemplates.length)];
        replyText = renderMessageWithTracking({
          message: template,
          commenterName: authorName,
          trackedLinks: automation.trackedLinks,
        });
      } else if (automation.replyMode === "AI_GENERATED") {
        try {
          const aiResult = await generateReply({
            platform: "youtube",
            videoOrPostTitle: "",
            commentText,
            commenterName: authorName,
            customInstructions: automation.aiPrompt ?? undefined,
          });
          replyText = renderMessageWithTracking({
            message: aiResult.reply,
            commenterName: authorName,
            trackedLinks: automation.trackedLinks,
          });
        } catch (error) {
          await prisma.youTubeCommentLog.create({
            data: {
              workspaceId: automation.workspaceId,
              youtubeAccountId: account.id,
              automationId: automation.id,
              videoId,
              parentCommentId: commentId,
              authorName,
              authorChannelId,
              commentText,
              matchedKeyword: matchResult.matchedKeyword,
              status: "FAILED",
              errorMessage: `AI generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          });
          continue;
        }
      } else {
        continue;
      }
    }

    if (!replyText) continue;

    try {
      const replyRes = await postCommentReply(account.accessToken, commentId, replyText);
      await prisma.youTubeCommentLog.create({
        data: {
          workspaceId: automation.workspaceId,
          youtubeAccountId: account.id,
          automationId: automation.id,
          videoId,
          parentCommentId: commentId,
          replyCommentId: replyRes.id,
          authorName,
          authorChannelId,
          commentText,
          matchedKeyword: matchResult.matchedKeyword,
          replyText,
          replyMode: automation.replyMode,
          status: "SENT",
        },
      });
      // Break to avoid multiple automations replying to the same comment
      break;
    } catch (error) {
      await prisma.youTubeCommentLog.create({
        data: {
          workspaceId: automation.workspaceId,
          youtubeAccountId: account.id,
          automationId: automation.id,
          videoId,
          parentCommentId: commentId,
          authorName,
          authorChannelId,
          commentText,
          matchedKeyword: matchResult.matchedKeyword,
          replyText,
          replyMode: automation.replyMode,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}
