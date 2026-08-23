const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeApiError extends Error {
  constructor(
    public code: number,
    message: string
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

export class QuotaExceededError extends YouTubeApiError {
  constructor(message: string) {
    super(403, message);
    this.name = "QuotaExceededError";
  }
}

export class TokenExpiredError extends YouTubeApiError {
  constructor(message: string) {
    super(401, message);
    this.name = "TokenExpiredError";
  }
}

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface YouTubeComment {
  id: string;
  videoId: string;
  textDisplay: string;
  authorDisplayName: string;
  authorChannelId: string;
  publishedAt: string;
  parentId?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok || data.error) {
    const err = data.error;
    const code = err?.code ?? response.status;
    const message = err?.message ?? "Unknown YouTube API error";
    const reason = err?.errors?.[0]?.reason;

    if (code === 403 && reason === "quotaExceeded") {
      throw new QuotaExceededError(message);
    } else if (code === 401) {
      throw new TokenExpiredError(message);
    } else {
      throw new YouTubeApiError(code, message);
    }
  }

  return data as T;
}

export async function getChannelInfo(accessToken: string): Promise<YouTubeChannel> {
  const url = new URL(`${YOUTUBE_API_BASE}/channels`);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("mine", "true");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<any>(response);
  const item = data.items?.[0];

  if (!item) {
    throw new YouTubeApiError(404, "Channel not found");
  }

  return {
    id: item.id,
    title: item.snippet?.title || "",
    customUrl: item.snippet?.customUrl,
    thumbnailUrl: item.snippet?.thumbnails?.default?.url,
    subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
    videoCount: parseInt(item.statistics?.videoCount || "0", 10),
    viewCount: item.statistics?.viewCount || "0",
  };
}

export async function getChannelVideos(
  accessToken: string,
  channelId: string,
  maxResults = 25,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("maxResults", maxResults.toString());
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");
  if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const searchData = await handleResponse<any>(searchRes);
  const items = searchData.items || [];
  if (items.length === 0) {
    return { videos: [], nextPageToken: searchData.nextPageToken };
  }

  const videoIds = items.map((item: any) => item.id.videoId).join(",");
  
  const videosUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  videosUrl.searchParams.set("part", "snippet,statistics");
  videosUrl.searchParams.set("id", videoIds);

  const videosRes = await fetch(videosUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const videosData = await handleResponse<any>(videosRes);
  
  const videos: YouTubeVideo[] = (videosData.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet?.title || "",
    description: item.snippet?.description,
    thumbnailUrl: item.snippet?.thumbnails?.default?.url,
    publishedAt: item.snippet?.publishedAt || "",
    viewCount: parseInt(item.statistics?.viewCount || "0", 10),
    likeCount: parseInt(item.statistics?.likeCount || "0", 10),
    commentCount: parseInt(item.statistics?.commentCount || "0", 10),
  }));

  return {
    videos,
    nextPageToken: searchData.nextPageToken,
  };
}

export async function getVideoDetails(accessToken: string, videoId: string): Promise<YouTubeVideo> {
  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", videoId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<any>(response);
  const item = data.items?.[0];

  if (!item) {
    throw new YouTubeApiError(404, "Video not found");
  }

  return {
    id: item.id,
    title: item.snippet?.title || "",
    description: item.snippet?.description,
    thumbnailUrl: item.snippet?.thumbnails?.default?.url,
    publishedAt: item.snippet?.publishedAt || "",
    viewCount: parseInt(item.statistics?.viewCount || "0", 10),
    likeCount: parseInt(item.statistics?.likeCount || "0", 10),
    commentCount: parseInt(item.statistics?.commentCount || "0", 10),
  };
}

export async function getVideoComments(
  accessToken: string,
  videoId: string,
  maxResults = 100,
  pageToken?: string
): Promise<{ comments: YouTubeComment[]; nextPageToken?: string }> {
  const url = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", maxResults.toString());
  url.searchParams.set("order", "time");
  url.searchParams.set("textFormat", "plainText");
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<any>(response);

  const comments: YouTubeComment[] = (data.items || []).map((item: any) => {
    const commentSnippet = item.snippet?.topLevelComment?.snippet;
    return {
      id: item.id,
      videoId,
      textDisplay: commentSnippet?.textDisplay || "",
      authorDisplayName: commentSnippet?.authorDisplayName || "",
      authorChannelId: commentSnippet?.authorChannelId?.value || "",
      publishedAt: commentSnippet?.publishedAt || "",
    };
  });

  return {
    comments,
    nextPageToken: data.nextPageToken,
  };
}

export async function postCommentReply(
  accessToken: string,
  parentCommentId: string,
  text: string
): Promise<{ id: string }> {
  const url = new URL(`${YOUTUBE_API_BASE}/comments`);
  url.searchParams.set("part", "snippet");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        parentId: parentCommentId,
        textOriginal: text,
      },
    }),
  });

  const data = await handleResponse<any>(response);
  return { id: data.id };
}

export async function checkSubscription(
  accessToken: string,
  channelId: string,
  subscriberChannelId: string
): Promise<boolean | null> {
  const url = new URL(`${YOUTUBE_API_BASE}/subscriptions`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("forChannelId", channelId);

  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const err = await response.json();
      const code = err?.error?.code;
      if (code === 403 || code === 401) {
        return null;
      }
    }

    const data = await handleResponse<any>(response);
    return (data.items && data.items.length > 0) ? true : false;
  } catch (err) {
    return null;
  }
}

export async function getChannelSubscriberCount(accessToken: string): Promise<number> {
  const url = new URL(`${YOUTUBE_API_BASE}/channels`);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("mine", "true");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<any>(response);
  const item = data.items?.[0];

  if (!item) {
    throw new YouTubeApiError(404, "Channel not found");
  }

  return parseInt(item.statistics?.subscriberCount || "0", 10);
}
