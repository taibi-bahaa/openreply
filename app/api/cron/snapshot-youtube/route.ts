import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/youtube/oauth";
import { getChannelInfo, getChannelVideos } from "@/lib/youtube/client";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await prisma.youTubeAccount.findMany({
      where: { accessToken: { not: "" } },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const account of accounts) {
      try {
        const token = decryptToken(account.accessToken);
        const channelInfo = await getChannelInfo(token);

        await prisma.youTubeSubscriberSnapshot.upsert({
          where: {
            youtubeAccountId_date: {
              youtubeAccountId: account.id,
              date: today,
            },
          },
          create: {
            youtubeAccountId: account.id,
            date: today,
            subscriberCount: channelInfo.subscriberCount,
            videoCount: channelInfo.videoCount,
            viewCount: BigInt(channelInfo.viewCount),
          },
          update: {
            subscriberCount: channelInfo.subscriberCount,
            videoCount: channelInfo.videoCount,
            viewCount: BigInt(channelInfo.viewCount),
          },
        });

        const { videos } = await getChannelVideos(token, account.channelId, 10);
        
        for (const video of videos) {
          await prisma.youTubeVideoAnalytics.upsert({
            where: {
              youtubeAccountId_videoId: {
                youtubeAccountId: account.id,
                videoId: video.id,
              },
            },
            create: {
              youtubeAccountId: account.id,
              videoId: video.id,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              publishedAt: new Date(video.publishedAt),
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
            },
            update: {
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
            },
          });
        }
      } catch (err) {
        console.error(`Failed to snapshot youtube account ${account.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, processed: accounts.length });
  } catch (err) {
    console.error("YouTube snapshot cron error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
