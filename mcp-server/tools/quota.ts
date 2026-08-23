import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Redis from "ioredis";

export function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is not set in environment");
  }
  return new Redis(redisUrl);
}

export function registerQuotaTools(server: McpServer) {
  let redis: Redis | null = null;
  
  try {
    redis = getRedisClient();
  } catch (e) {
    console.warn("Could not initialize Redis for quota tool:", e);
  }

  server.tool(
    "get_api_quota_status",
    "Get YouTube daily quota and Meta rate limit status",
    {},
    async () => {
      try {
        let youtubeQuota = 0;
        let metaReplies = 0;

        if (redis) {
          const ytVal = await redis.get("youtube:quota:today");
          youtubeQuota = ytVal ? parseInt(ytVal, 10) : 0;
          
          const metaVal = await redis.get("meta:replies:hour");
          metaReplies = metaVal ? parseInt(metaVal, 10) : 0;
        }

        const result = {
          youtube: {
            used: youtubeQuota,
            remaining: Math.max(0, 10000 - youtubeQuota),
            limit: 10000,
          },
          meta: {
            repliesThisHour: metaReplies,
            limit: 750,
          }
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: \`Error fetching API quota status: \${error.message}\` }],
          isError: true,
        };
      }
    }
  );
}
