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

export function registerAutomationsTools(server: McpServer) {
  const prisma = getPrismaClient();

  server.tool(
    "list_automations",
    {
      platform: z.enum(["all", "instagram", "youtube"]).optional().default("all"),
    },
    async ({ platform }) => {
      try {
        let results: any[] = [];

        if (platform === "all" || platform === "instagram") {
          const igAutos = await prisma.automation.findMany({
            include: { account: true },
          }).catch(() => []);
          
          results.push(...igAutos.map((a: any) => ({
            id: a.id,
            name: a.name || \`Automation \${a.id}\`,
            platform: "instagram",
            targetPost: a.mediaId || "All posts",
            keywords: a.triggerKeywords || [],
            isActive: a.isActive,
            repliesSent: 0, // Would query logs if needed
          })));
        }

        if (platform === "all" || platform === "youtube") {
          const ytAutos = await prisma.youTubeAutomation.findMany({
            include: { account: true },
          }).catch(() => []);
          
          results.push(...ytAutos.map((a: any) => ({
            id: a.id,
            name: a.name || \`YT Auto \${a.id}\`,
            platform: "youtube",
            targetVideo: a.videoId || "All videos",
            keywords: a.keywords || [],
            isActive: a.isActive,
            repliesSent: a.repliesSent || 0,
          })));
        }

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: \`Error listing automations: \${error.message}\` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "toggle_automation",
    {
      automationId: z.string(),
      platform: z.enum(["instagram", "youtube"]),
      active: z.boolean(),
    },
    async ({ automationId, platform, active }) => {
      try {
        let updated: any;

        if (platform === "instagram") {
          updated = await prisma.automation.update({
            where: { id: automationId },
            data: { isActive: active },
          });
        } else if (platform === "youtube") {
          updated = await prisma.youTubeAutomation.update({
            where: { id: automationId },
            data: { isActive: active },
          });
        }

        return {
          content: [
            { 
              type: "text", 
              text: JSON.stringify({ 
                success: true, 
                automationId: updated.id, 
                isActive: updated.isActive 
              }, null, 2) 
            }
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: \`Error toggling automation: \${error.message}\` }],
          isError: true,
        };
      }
    }
  );
}
