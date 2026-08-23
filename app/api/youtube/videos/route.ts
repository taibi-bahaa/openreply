import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { decryptToken } from "@/lib/youtube/oauth";
import { getChannelVideos } from "@/lib/youtube/client";

export async function GET(request: NextRequest) {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const pageToken = searchParams.get("pageToken") || undefined;

    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId parameter" }, { status: 400 });
    }

    const account = await prisma.youTubeAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    const decryptedToken = decryptToken(account.accessToken);
    const { videos, nextPageToken } = await getChannelVideos(decryptedToken, account.channelId, 25, pageToken);

    // Upsert video stats
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

    return NextResponse.json({ videos, nextPageToken });
  } catch (err) {
    console.error("YouTube videos error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
