import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { generateTrackedLinkSlug } from "@/lib/tracking/server";

export async function GET(request: NextRequest) {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const automations = await prisma.youTubeAutomation.findMany({
      where: { workspaceId },
      include: {
        youtubeAccount: {
          select: { title: true },
        },
        _count: {
          select: { commentLogs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(automations);
  } catch (err) {
    console.error("YouTube automations GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      youtubeAccountId,
      name,
      goal,
      videoId,
      videoTitle,
      videoThumbnail,
      matchAnyVideo,
      keywords,
      matchAnyWord,
      wholeWordMatch,
      replyMode,
      replyTemplates,
      aiPrompt,
      aiModel,
      requireSubscribe,
      notSubscribedReply,
      isActive,
      destinationUrl,
    } = body;

    const automation = await prisma.youTubeAutomation.create({
      data: {
        workspaceId,
        youtubeAccountId,
        name,
        goal,
        videoId,
        videoTitle,
        videoThumbnail,
        matchAnyVideo: matchAnyVideo || false,
        keywords: keywords || [],
        matchAnyWord: matchAnyWord || false,
        wholeWordMatch: wholeWordMatch ?? true,
        replyMode: replyMode || "TEMPLATE",
        replyTemplates: replyTemplates || [],
        aiPrompt,
        aiModel: aiModel || "gemini-2.0-flash",
        requireSubscribe: requireSubscribe || false,
        notSubscribedReply,
        isActive: isActive ?? true,
      },
    });

    if (destinationUrl) {
      await prisma.trackedLink.create({
        data: {
          workspaceId,
          youtubeAutomationId: automation.id,
          slug: generateTrackedLinkSlug(),
          destinationUrl,
        },
      });
    }

    return NextResponse.json(automation, { status: 201 });
  } catch (err) {
    console.error("YouTube automations POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
