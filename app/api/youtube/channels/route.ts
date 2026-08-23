import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentWorkspaceId } from "@/lib/auth";

export async function GET() {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channels = await prisma.youTubeAccount.findMany({
      where: { workspaceId },
      select: {
        id: true,
        channelId: true,
        title: true,
        customUrl: true,
        thumbnailUrl: true,
        subscriberCount: true,
        videoCount: true,
      },
    });

    return NextResponse.json(channels);
  } catch (err) {
    console.error("YouTube channels error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
