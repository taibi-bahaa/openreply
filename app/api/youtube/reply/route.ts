import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { decryptToken } from "@/lib/youtube/oauth";
import { postCommentReply } from "@/lib/youtube/client";

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youtubeAccountId, commentId, replyText, videoId } = body;

    if (!youtubeAccountId || !commentId || !replyText || !videoId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const account = await prisma.youTubeAccount.findFirst({
      where: { id: youtubeAccountId, workspaceId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    const decryptedToken = decryptToken(account.accessToken);

    const { id: replyId } = await postCommentReply(decryptedToken, commentId, replyText);

    await prisma.youTubeCommentLog.create({
      data: {
        workspaceId,
        youtubeAccountId,
        videoId,
        parentCommentId: commentId,
        replyCommentId: replyId,
        authorName: "API User", // In a real scenario, this would come from the original comment
        authorChannelId: "", // Same as above
        commentText: "", // Same as above
        replyText,
        status: "SENT",
      },
    });

    return NextResponse.json({ success: true, replyId });
  } catch (err) {
    console.error("YouTube reply error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
