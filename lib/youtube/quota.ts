export const QUOTA_COSTS = {
  LIST: 1,
  SEARCH: 100,
  COMMENT_INSERT: 50,
  COMMENT_LIST: 1,
  VIDEO_LIST: 1,
  CHANNEL_LIST: 1,
} as const;

const DAILY_QUOTA_LIMIT = 10_000;
const QUOTA_REDIS_KEY_PREFIX = "yt:quota:";

import { getRedisConnection } from "@/lib/queue/client";

function getQuotaResetKey(): string {
  // Google resets quota at midnight Pacific Time
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const yyyy = pstDate.getFullYear();
  const mm = String(pstDate.getMonth() + 1).padStart(2, '0');
  const dd = String(pstDate.getDate()).padStart(2, '0');
  return `${QUOTA_REDIS_KEY_PREFIX}${yyyy}-${mm}-${dd}`;
}

export async function getQuotaUsed(): Promise<number> {
  const redis = getRedisConnection();
  const key = getQuotaResetKey();
  const used = await redis.get(key);
  return used ? parseInt(used, 10) : 0;
}

export async function getQuotaRemaining(): Promise<number> {
  const budget = await getQuotaBudget();
  const used = await getQuotaUsed();
  return Math.max(0, budget - used);
}

export async function consumeQuota(cost: number): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisConnection();
  const key = getQuotaResetKey();
  const budget = await getQuotaBudget();
  
  // Lua script to atomically check and increment quota
  const script = `
    local current = redis.call("GET", KEYS[1])
    if not current then
      current = 0
    else
      current = tonumber(current)
    end
    
    local cost = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    
    if current + cost > limit then
      return {0, limit - current}
    else
      redis.call("INCRBY", KEYS[1], cost)
      redis.call("EXPIRE", KEYS[1], 172800) -- 48 hours
      return {1, limit - (current + cost)}
    end
  `;

  const result = await redis.eval(script, 1, key, cost, budget) as [number, number];
  return {
    allowed: result[0] === 1,
    remaining: result[1],
  };
}

export async function getQuotaBudget(): Promise<number> {
  return parseInt(process.env.YOUTUBE_QUOTA_BUDGET || "") || DAILY_QUOTA_LIMIT;
}

export async function canAfford(cost: number): Promise<boolean> {
  const remaining = await getQuotaRemaining();
  return remaining >= cost;
}
