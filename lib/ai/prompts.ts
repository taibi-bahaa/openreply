export interface ReplyPromptContext {
  platform: "youtube" | "instagram";
  videoOrPostTitle: string;
  videoOrPostDescription?: string;
  commentText: string;
  commenterName: string;
  linkUrl?: string;
  linkDescription?: string;
  tone?: "friendly" | "professional" | "enthusiastic" | "casual" | "helpful";
  maxLength?: number;
  customInstructions?: string;
}

export function buildSystemPrompt(platform: "youtube" | "instagram"): string {
  return `You are an expert social media manager for a popular ${platform} account.
Your task is to generate natural, non-spammy replies to user comments.

Strict guidelines to follow:
- Keep replies concise (under 250 characters by default, unless told otherwise).
- If a link is provided, integrate it naturally into the conversation as a helpful resource. Do not sound like a sales pitch.
- Match the requested tone exactly.
- NEVER use hashtags in your replies.
- Be helpful, genuine, and authentic.
- Always respond in the SAME language as the original comment.
- Output ONLY the reply text. Do not wrap your response in quotes, markdown, or explain your reasoning.`;
}

export function buildUserPrompt(context: ReplyPromptContext): string {
  const {
    videoOrPostTitle,
    videoOrPostDescription,
    commentText,
    commenterName,
    linkUrl,
    linkDescription,
    tone = "friendly",
    maxLength = 250,
    customInstructions
  } = context;

  let prompt = `Video/Post: ${videoOrPostTitle}\n`;
  if (videoOrPostDescription) {
    const snippet = videoOrPostDescription.slice(0, 400).trim();
    prompt += `Description: ${snippet}${videoOrPostDescription.length > 400 ? '...' : ''}\n`;
  }
  
  prompt += `Commenter: @${commenterName}\n`;
  prompt += `Comment: "${commentText}"\n`;
  
  if (linkUrl) {
    prompt += `Link to include: ${linkUrl}`;
    if (linkDescription) {
      prompt += ` (${linkDescription})`;
    }
    prompt += `\n`;
  }
  
  prompt += `Tone: ${tone}\n`;
  
  if (customInstructions) {
    prompt += `Custom instructions: ${customInstructions}\n`;
  }
  
  prompt += `Max length: ${maxLength} characters\n\n`;
  prompt += `Generate a reply to this comment.`;

  return prompt;
}
