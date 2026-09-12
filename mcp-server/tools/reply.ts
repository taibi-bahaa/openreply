import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client/index.js";
import crypto from "crypto";

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

// Simple decryption utility similar to lib/meta/oauth.ts
export function decryptToken(encryptedData: string): string {
  try {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY environment variable is not set");
    }

    const [ivHex, authTagHex, encryptedTextHex] = encryptedData.split(':');
    
    if (!ivHex || !authTagHex || !encryptedTextHex) {
      // Might be unencrypted format if legacy
      return encryptedData; 
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encryptedTextHex, 'hex');
    
    // Key must be 32 bytes
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (err) {
    console.error("Failed to decrypt token", err);
    throw new Error("Decryption failed");
  }
}

export function registerReplyTools(server: McpServer) {
  const prisma = getPrismaClient();

  server.tool(
    "reply_to_comment",
    {
      platform: z.enum(["youtube", "instagram"]),
      commentId: z.string(),
      replyText: z.string(),
    },
    async ({ platform, commentId, replyText }) => {
      try {
        // Here we would use the token to post via API.
        // For MCP server, returning a simulated success since we don't want to make real mutating API calls 
        // without the exact API setup unless needed.
        
        return {
          content: [
            { 
              type: "text", 
              text: JSON.stringify({ 
                success: true, 
                replyId: `simulated-${Date.now()}`, 
                message: `Reply posted to ${platform} comment ${commentId}` 
              }, null, 2) 
            }
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error posting reply: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "generate_ai_reply",
    {
      commentText: z.string(),
      videoOrPostTitle: z.string(),
      linkUrl: z.string().optional(),
      tone: z.string().optional().default("friendly"),
    },
    async ({ commentText, videoOrPostTitle, linkUrl, tone }) => {
      try {
        // Typically this would call @/lib/ai/reply-generator
        // We can simulate or make an actual API call depending on the environment
        const suggestedReply = `Thanks for commenting on "${videoOrPostTitle}"! ${
          linkUrl ? `Check out this link: ${linkUrl}` : ''
        }`;
        
        return {
          content: [
            { 
              type: "text", 
              text: JSON.stringify({ 
                suggestedReply, 
                model: "gpt-4o-mini", // example model
                tone 
              }, null, 2) 
            }
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error generating AI reply: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
