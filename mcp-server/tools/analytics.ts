import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client/index.js";

const { Pool } = pg;

export function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

export function registerAnalyticsTools(server: McpServer) {
  const prisma = getPrismaClient();

  server.tool(
    "get_channel_overview",
    {
      platform: z.enum(["all", "instagram", "youtube"]).default("all"),
    },
    async ({ platform }) => {
      try {
        const result: any = {};

        if (platform === "all" || platform === "instagram") {
          const igAccounts = await prisma.instagramAccount.findMany();
          const igAutomationsCount = await prisma.automation.count();
          // Assuming DmLog exists
          const igDMsToday = await prisma.$queryRaw`
            SELECT COUNT(*) FROM "DmLog" WHERE "createdAt" >= CURRENT_DATE
          `.catch(() => [{ count: 0 }]);
          const igLinkClicksToday = await prisma.$queryRaw`
            SELECT COUNT(*) FROM "LinkClick" WHERE "createdAt" >= CURRENT_DATE
          `.catch(() => [{ count: 0 }]);

          result.instagram = {
            accounts: igAccounts.length,
            totalFollowers: igAccounts.reduce((sum: number, acc: any) => sum + (acc.followersCount || 0), 0),
            automationsCount: igAutomationsCount,
            dmsSentToday: Number(igDMsToday[0]?.count || 0),
            linkClicksToday: Number(igLinkClicksToday[0]?.count || 0),
          };
        }

        if (platform === "all" || platform === "youtube") {
          const ytAccounts = await prisma.youTubeAccount.findMany();
          const ytAutomationsCount = await prisma.youTubeAutomation.count();
          const ytRepliesToday = await prisma.$queryRaw`
            SELECT COUNT(*) FROM "YouTubeCommentLog" WHERE "createdAt" >= CURRENT_DATE
          `.catch(() => [{ count: 0 }]);

          result.youtube = {
            accounts: ytAccounts.length,
            totalSubscribers: ytAccounts.reduce((sum: number, acc: any) => sum + (acc.subscriberCount || 0), 0),
            automationsCount: ytAutomationsCount,
            repliesSentToday: Number(ytRepliesToday[0]?.count || 0),
            // YouTube doesn't typically have link clicks in DMs natively in the same way, but keeping placeholder if needed.
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error fetching channel overview: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_video_analytics",
    {
      platform: z.enum(["youtube", "instagram"]).optional(),
      limit: z.number().optional().default(10),
    },
    async ({ platform, limit }) => {
      try {
        const result: any = {};

        if (!platform || platform === "youtube") {
          const ytStats = await prisma.youTubeVideoAnalytics.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
          });
          result.youtube = ytStats.map((stat: any) => ({
            title: stat.videoId, // Assuming videoId is used as placeholder for title here
            views: stat.viewCount?.toLocaleString() || "0",
            likes: stat.likeCount?.toLocaleString() || "0",
            comments: stat.commentCount?.toLocaleString() || "0",
          }));
        }

        if (!platform || platform === "instagram") {
          // Placeholder query for IG media analytics, assuming a Media table exists
          result.instagram = [];
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error fetching video analytics: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_growth_history",
    {
      platform: z.enum(["youtube", "instagram"]),
      days: z.number().optional().default(30),
    },
    async ({ platform, days }) => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let data: any[] = [];
        
        if (platform === "youtube") {
          // Snapshot tables
          data = await prisma.youTubeSubscriberSnapshot.findMany({
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: 'asc' },
          }).catch(() => []);
        } else if (platform === "instagram") {
          data = await prisma.followerSnapshot.findMany({
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: 'asc' },
          }).catch(() => []);
        }

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error fetching growth history: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
