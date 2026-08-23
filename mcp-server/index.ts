import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import tool handlers
import { registerAnalyticsTools } from "./tools/analytics.js";
import { registerCommentsTools } from "./tools/comments.js";
import { registerReplyTools } from "./tools/reply.js";
import { registerAutomationsTools } from "./tools/automations.js";
import { registerQuotaTools } from "./tools/quota.js";

async function main() {
  const server = new McpServer({
    name: "openreply",
    version: "1.0.0",
  });

  // Register all tool groups
  registerAnalyticsTools(server);
  registerCommentsTools(server);
  registerReplyTools(server);
  registerAutomationsTools(server);
  registerQuotaTools(server);

  // Start with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("OpenReply MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
