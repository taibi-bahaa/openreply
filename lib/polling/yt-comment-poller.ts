import { prisma } from "@/lib/db/client";
import { getYTQueue } from "@/lib/queue/client";
import { getVideoComments, YouTubeApiError } from "@/lib/youtube/client";
import { consumeQuota, QUOTA_COSTS } from "@/lib/youtube/quota";

const YT_POLL_MAX_PER_SWEEP = Number(process.env.YT_POLL_MAX_PER_SWEEP ?? 50);
const YT_POLL_INTERVAL_MS = Number(process.env.YT_POLL_INTERVAL_MS ?? 3 * 60_000);

export async function pollYouTubeComments(): Promise<void> {
  const automations = await prisma.youTubeAutomation.findMany({
    where: { isActive: true },
    include: { youtubeAccount: true },
  });

  const accountAutomationsMap = new Map<string, typeof automations>();
  for (const automation of automations) {
    const arr = accountAutomationsMap.get(automation.youtubeAccountId) || [];
    arr.push(automation);
    accountAutomationsMap.set(automation.youtubeAccountId, arr);
  }

  for (const [accountId, accountAutomations] of accountAutomationsMap.entries()) {
    const account = accountAutomations[0].youtubeAccount;
    
    // Collect all video IDs to check
    const videoIds = new Set<string>();
    for (const automation of accountAutomations) {
      if (automation.videoId) {
        videoIds.add(automation.videoId);
      } else if (automation.matchAnyVideo) {
        // Find recent videos for this account
        const recentVideos = await prisma.youTubeVideoAnalytics.findMany({
          where: { youtubeAccountId: account.id },
          orderBy: { publishedAt: 'desc' },
          take: 5
        });
        recentVideos.forEach(v => videoIds.add(v.videoId));
      }
    }

    if (videoIds.size === 0) continue;

    for (const videoId of videoIds) {
      try {
        const quota = await consumeQuota(QUOTA_COSTS.COMMENT_LIST);
        if (!quota.allowed) {
          console.warn(`[YT Poller] Skipping video ${videoId} for account ${account.channelId}: Quota exceeded`);
          continue; // Skip remaining videos for this account
        }

        const { comments } = await getVideoComments(account.accessToken, videoId, YT_POLL_MAX_PER_SWEEP);

        for (const comment of comments) {
          // Check if already processed
          const existing = await prisma.youTubeProcessedComment.findUnique({
            where: { commentId: comment.id }
          });

          if (!existing) {
            await prisma.youTubeProcessedComment.create({
              data: {
                youtubeAccountId: account.id,
                commentId: comment.id,
                source: "POLLING"
              }
            });

            await getYTQueue().add("process-yt-comment", {
              youtubeAccountId: account.channelId,
              videoId: comment.videoId,
              commentId: comment.id,
              commentText: comment.textDisplay,
              authorName: comment.authorDisplayName,
              authorChannelId: comment.authorChannelId,
              source: "POLLING"
            });
          }
        }
      } catch (error) {
        console.error(`[YT Poller] Failed to poll comments for video ${videoId}:`, error);
      }
    }
  }
}
