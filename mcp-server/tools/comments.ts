import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client/index.js";

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

export function registerCommentsTools(server: McpServer) {
  const prisma = getPrismaClient();

  server.tool(
    "get_recent_comments",
    {
      platform: z.enum(["youtube", "instagram"]),
      videoOrPostId: z.string().optional(),
      limit: z.number().optional().default(10),
      unansweredOnly: z.boolean().optional().default(false),
    },
    async ({ platform, videoOrPostId, limit, unansweredOnly }) => {
      try {
        let comments: any[] = [];

        if (platform === "youtube") {
          const where: any = {};
          if (videoOrPostId) where.videoId = videoOrPostId;
          if (unansweredOnly) where.repliedAt = null; // Assuming repliedAt or status is used

          const logs = await prisma.youTubeCommentLog.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }).catch(() => []);

          comments = logs.map((log: any) => ({
            commentId: log.commentId,
            authorName: log.authorName || "Unknown",
            text: log.textDisplay || log.textOriginal || "",
            repliedAt: log.createdAt, // Or actual repliedAt
            status: log.status || "replied",
          }));
        } else if (platform === "instagram") {
          // Assume DmLog is used for comments/DMs
          const where: any = {};
          if (videoOrPostId) where.mediaId = videoOrPostId; // Or threadId
          
          const logs = await prisma.dmLog.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }).catch(() => []);

          comments = logs.map((log: any) => ({
            commentId: log.id,
            authorName: log.username || "Unknown",
            text: log.messageText || "",
            repliedAt: log.createdAt,
            status: log.status || "sent",
          }));
        }

        return {
          content: [{ type: "text", text: JSON.stringify(comments, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: \`Error fetching recent comments: \${error.message}\` }],
          isError: true,
        };
      }
    }
  );
}
