import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { canManageWorkspace, getCurrentWorkspaceContext } from "@/lib/workspace-access";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const automation = await prisma.youTubeAutomation.findFirst({
      where: { id: params.id, workspaceId },
      include: {
        _count: {
          select: { commentLogs: true },
        },
        trackedLinks: true,
      },
    });

    if (!automation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(automation);
  } catch (err) {
    console.error("YouTube automation GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentWorkspaceContext();
    if (!context || !canManageWorkspace(context.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const automation = await prisma.youTubeAutomation.findFirst({
      where: { id: params.id, workspaceId: context.workspaceId },
    });

    if (!automation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.youTubeAutomation.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("YouTube automation PATCH error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentWorkspaceContext();
    if (!context || !canManageWorkspace(context.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const automation = await prisma.youTubeAutomation.findFirst({
      where: { id: params.id, workspaceId: context.workspaceId },
    });

    if (!automation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.youTubeAutomation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("YouTube automation DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
