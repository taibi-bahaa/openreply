import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/env";
import { verifyOAuthState } from "@/lib/meta/oauth";
import { exchangeGoogleCode, encryptToken } from "@/lib/youtube/oauth";
import { getChannelInfo } from "@/lib/youtube/client";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${getBaseUrl()}/settings?youtube=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${getBaseUrl()}/settings?youtube=missing_params`);
  }

  try {
    const payload = verifyOAuthState(state);
    if (!payload || !payload.workspaceId) {
      return NextResponse.redirect(`${getBaseUrl()}/settings?youtube=invalid_state`);
    }
    const workspaceId = payload.workspaceId;
    const redirectUri = `${getBaseUrl()}/api/youtube/callback`;
    
    const { accessToken, refreshToken, expiresIn } = await exchangeGoogleCode(code, redirectUri);
    const channelInfo = await getChannelInfo(accessToken);
    
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = encryptToken(refreshToken);
    const newExpiry = new Date(Date.now() + expiresIn * 1000);

    await prisma.youTubeAccount.upsert({
      where: { channelId: channelInfo.id },
      create: {
        workspaceId,
        channelId: channelInfo.id,
        title: channelInfo.title,
        customUrl: channelInfo.customUrl,
        thumbnailUrl: channelInfo.thumbnailUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: newExpiry,
      },
      update: {
        workspaceId,
        title: channelInfo.title,
        customUrl: channelInfo.customUrl,
        thumbnailUrl: channelInfo.thumbnailUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: newExpiry,
      }
    });

    return NextResponse.redirect(`${getBaseUrl()}/youtube`);
  } catch (err) {
    console.error("YouTube callback error:", err);
    return NextResponse.redirect(`${getBaseUrl()}/settings?youtube=failed`);
  }
}
