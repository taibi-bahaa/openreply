# YouTube Setup Guide

Step-by-step instructions to connect your YouTube channel to OpenReply.

## Prerequisites
- A YouTube channel (must be a Brand Account or have a channel linked to your Google account)
- A Google Cloud Console account

## Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" and give it a name (e.g., "OpenReply")
3. Note the Project ID

## Step 2: Enable YouTube Data API v3
1. Go to APIs & Services > Library
2. Search for "YouTube Data API v3"
3. Click Enable

## Step 3: Configure OAuth Consent Screen
1. Go to APIs & Services > OAuth consent screen
2. Choose "External" user type
3. Fill in:
   - App name: OpenReply
   - User support email: your email
   - Developer contact email: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/youtube.force-ssl`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add your email as a test user (while in testing mode)

## Step 4: Create OAuth Credentials
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Application type: Web application
4. Name: OpenReply
5. Authorized redirect URIs:
   - `http://localhost:3000/api/youtube/callback` (for local dev)
   - `https://your-domain.com/api/youtube/callback` (for production)
6. Copy the Client ID and Client Secret

## Step 5: Configure Environment Variables
Add to your `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Step 6: Connect Your Channel
1. Start the app and log in
2. Go to Settings or the YouTube section
3. Click "Connect YouTube Channel"
4. Authorize the app in the Google consent screen
5. Your channel will appear in the YouTube dashboard

## Quota Management
- YouTube Data API v3 has a default quota of 10,000 units/day
- Posting a comment reply costs 50 units (~200 replies/day)
- Listing comments costs 1 unit
- You can request a quota increase in the Google Cloud Console under APIs & Services > YouTube Data API v3 > Quotas
- OpenReply tracks quota usage in real-time and will skip replies when budget is exceeded

## Troubleshooting
- **"Access blocked"**: Make sure you added your email as a test user in the OAuth consent screen
- **"Quota exceeded"**: Wait until midnight Pacific Time for the quota to reset, or request an increase
- **"insufficient permissions"**: Re-connect your channel to re-grant the required scopes
