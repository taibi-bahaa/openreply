import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { getBaseUrl } from "@/lib/env";
import { createOAuthState } from "@/lib/meta/oauth";
import { getGoogleAuthorizationUrl } from "@/lib/youtube/oauth";

export async function GET() {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.redirect(`${getBaseUrl()}/login`);
  }
  if (!canManageWorkspace(context.role)) {
    return NextResponse.redirect(`${getBaseUrl()}/settings?youtube=forbidden`);
  }

  const redirectUri = `${getBaseUrl()}/api/youtube/callback`;
  const state = createOAuthState(context.workspaceId);

  return NextResponse.redirect(getGoogleAuthorizationUrl(redirectUri, state));
}
