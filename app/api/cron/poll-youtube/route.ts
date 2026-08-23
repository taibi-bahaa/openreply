import { NextRequest, NextResponse } from "next/server";
import { pollYouTubeComments } from "@/lib/polling/yt-comment-poller";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await pollYouTubeComments();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    console.error("YouTube poll cron error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
