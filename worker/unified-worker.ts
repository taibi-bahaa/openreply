import { createDMWorker } from "@/lib/queue/dm-worker";
import { createYTWorker } from "@/lib/queue/yt-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import { reconcileComments } from "@/lib/polling/comment-reconciler";
import { pollYouTubeComments } from "@/lib/polling/yt-comment-poller";
import os from "node:os";

const dmWorker = createDMWorker();
const ytWorker = createYTWorker();
const startedAt = new Date().toISOString();

const HEARTBEAT_INTERVAL_MS = 30_000;
const IG_POLL_INTERVAL_MS = Number(process.env.COMMENT_POLL_INTERVAL_MS ?? 5 * 60_000);
const YT_POLL_INTERVAL_MS = Number(process.env.YT_POLL_INTERVAL_MS ?? 3 * 60_000);

console.log("[Unified Worker] Started");

async function heartbeat() {
  try {
    await recordWorkerHeartbeat({
      pid: process.pid,
      hostname: os.hostname(),
      startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Unified Worker] Heartbeat failed:", message);
  }
}

void heartbeat();
const heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);

async function pollIG() {
  try {
    await reconcileComments();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Unified Worker] IG Comment reconciliation failed:", message);
  }
}

async function pollYT() {
  try {
    await pollYouTubeComments();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Unified Worker] YT Comment reconciliation failed:", message);
  }
}

// Kick off sweeps shortly after boot, then on fixed intervals.
setTimeout(() => void pollIG(), 10_000);
setTimeout(() => void pollYT(), 15_000);

const igPollTimer = setInterval(() => void pollIG(), IG_POLL_INTERVAL_MS);
const ytPollTimer = setInterval(() => void pollYT(), YT_POLL_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[Unified Worker] ${signal} received, closing workers`);
  clearInterval(heartbeatTimer);
  clearInterval(igPollTimer);
  clearInterval(ytPollTimer);
  await Promise.all([dmWorker.close(), ytWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
