# MCP Server Setup — Connect Claude Desktop to OpenReply

OpenReply includes a built-in Model Context Protocol (MCP) server that lets Claude Desktop (or any MCP-compatible AI agent) query your Instagram & YouTube analytics, manage automations, and reply to comments interactively.

## Prerequisites
- OpenReply deployed (locally or on VPS)
- Claude Desktop installed
- Node.js 18+ and npm

## Step 1: Install MCP Server Dependencies
```bash
cd mcp-server
npm install
```

## Step 2: Configure Claude Desktop

Edit your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the OpenReply MCP server:
```json
{
  "mcpServers": {
    "openreply": {
      "command": "npx",
      "args": ["tsx", "index.ts"],
      "cwd": "/path/to/openreply/mcp-server",
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/openreply",
        "REDIS_URL": "redis://localhost:6379",
        "ENCRYPTION_KEY": "your-64-char-hex-encryption-key",
        "AI_PROVIDER": "openai",
        "AI_API_KEY": "sk-...",
        "AI_MODEL": "gpt-4o-mini"
      }
    }
  }
}
```

> **Important**: Use the SAME `DATABASE_URL`, `REDIS_URL`, and `ENCRYPTION_KEY` as your main OpenReply instance.

## Step 3: Restart Claude Desktop
Close and reopen Claude Desktop. You should see the OpenReply tools available.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_channel_overview` | Get follower/subscriber counts, active campaigns, today's stats |
| `get_video_analytics` | View video performance (views, likes, comments, CTR) |
| `get_growth_history` | Follower/subscriber growth over time |
| `get_recent_comments` | Fetch recent or unanswered comments |
| `reply_to_comment` | Post a reply to a specific comment |
| `generate_ai_reply` | Generate a suggested reply without posting |
| `list_automations` | View all automation campaigns |
| `toggle_automation` | Enable/disable an automation |
| `get_api_quota_status` | Check YouTube quota and Meta rate limits |

## Example Conversations

### Check analytics
> "Show me my YouTube channel stats and how my latest videos are performing"

### Reply to comments
> "Find unanswered comments on my latest YouTube video and suggest friendly replies that include the guide link https://example.com/guide"

### Manage automations
> "List all my active automations and pause the one for the old tutorial video"

### Monitor health
> "How much YouTube API quota have I used today? Are there any failed replies?"
