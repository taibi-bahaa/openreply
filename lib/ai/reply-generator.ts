import { buildSystemPrompt, buildUserPrompt, type ReplyPromptContext } from "./prompts";

export interface AIReplyResult {
  reply: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

export interface AIConfig {
  provider: "openai" | "gemini" | "claude";
  apiKey: string;
  model: string;
}

export function getAIConfig(): AIConfig | null {
  const provider = (process.env.AI_PROVIDER as AIConfig["provider"]) || "openai";
  const apiKey = process.env.AI_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  let defaultModel = "gpt-4o-mini";
  if (provider === "gemini") defaultModel = "gemini-1.5-flash";
  if (provider === "claude") defaultModel = "claude-3-haiku-20240307";

  const model = process.env.AI_MODEL || defaultModel;

  return { provider, apiKey, model };
}

function cleanReply(text: string, maxLength?: number): string {
  let cleaned = text.trim();
  
  // Strip wrapping quotes if LLM added them
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  
  // Strip markdown formatting (bold, italic)
  cleaned = cleaned.replace(/(\*\*|\*|__|`)/g, '');

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

async function generateOpenAIReply(systemPrompt: string, userPrompt: string, config: AIConfig): Promise<AIReplyResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return {
    reply: data.choices[0]?.message?.content || "",
    model: config.model,
    provider: "openai",
    tokensUsed: data.usage?.total_tokens
  };
}

async function generateGeminiReply(systemPrompt: string, userPrompt: string, config: AIConfig): Promise<AIReplyResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return {
    reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    model: config.model,
    provider: "gemini"
  };
}

async function generateClaudeReply(systemPrompt: string, userPrompt: string, config: AIConfig): Promise<AIReplyResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  
  return {
    reply: data.content?.[0]?.text || "",
    model: config.model,
    provider: "claude",
    tokensUsed: inputTokens + outputTokens
  };
}

export async function generateReply(context: ReplyPromptContext, config?: AIConfig): Promise<AIReplyResult> {
  const activeConfig = config || getAIConfig();
  if (!activeConfig) {
    throw new Error("AI provider is not configured. Please set the AI_API_KEY environment variable.");
  }

  const systemPrompt = buildSystemPrompt(context.platform);
  const userPrompt = buildUserPrompt(context);

  let result: AIReplyResult;

  try {
    switch (activeConfig.provider) {
      case "openai":
        result = await generateOpenAIReply(systemPrompt, userPrompt, activeConfig);
        break;
      case "gemini":
        result = await generateGeminiReply(systemPrompt, userPrompt, activeConfig);
        break;
      case "claude":
        result = await generateClaudeReply(systemPrompt, userPrompt, activeConfig);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${activeConfig.provider}`);
    }

    result.reply = cleanReply(result.reply, context.maxLength);
    console.log(`[AI Reply] Successfully generated reply using ${result.provider} (${result.model})`);
    
    return result;
  } catch (error) {
    console.error(`[AI Reply] Failed to generate reply via ${activeConfig.provider}:`, error);
    throw error;
  }
}

export async function generateBatchReplies(contexts: ReplyPromptContext[], config?: AIConfig): Promise<AIReplyResult[]> {
  const results: AIReplyResult[] = [];
  
  // Process sequentially to avoid rate limits
  for (const context of contexts) {
    const result = await generateReply(context, config);
    results.push(result);
  }
  
  return results;
}
