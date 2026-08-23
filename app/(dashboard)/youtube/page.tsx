"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/stat-card";
import YTSubscriberChart from "@/components/youtube/yt-subscriber-chart";
import YTVideoAnalytics from "@/components/youtube/yt-video-analytics";

export default function YouTubeOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from /api/youtube/channels
    // Mocking for now to show the UI
    setTimeout(() => {
      setData({
        channel: {
          title: "My Awesome Channel",
          subscriberCount: 15420,
          videoCount: 42,
          views: 1250000,
        },
        stats: {
          repliesSentToday: 152,
          linkClicksToday: 48,
          ctr: "31.5%",
        },
        subscriberHistory: [
          { date: "2023-10-01", subscriberCount: 15000 },
          { date: "2023-10-02", subscriberCount: 15100 },
          { date: "2023-10-03", subscriberCount: 15250 },
          { date: "2023-10-04", subscriberCount: 15300 },
          { date: "2023-10-05", subscriberCount: 15420 },
        ],
        videos: [
          {
            id: "vid1",
            title: "How to build an AI agent",
            thumbnail: "https://via.placeholder.com/120x90",
            views: 45000,
            likes: 3200,
            comments: 450,
            linkClicks: 120,
            ctr: "26.6%",
            publishedAt: "2023-10-01T12:00:00Z",
          },
          {
            id: "vid2",
            title: "OpenReply Tutorial",
            thumbnail: "https://via.placeholder.com/120x90",
            views: 12000,
            likes: 800,
            comments: 120,
            linkClicks: 45,
            ctr: "37.5%",
            publishedAt: "2023-09-25T12:00:00Z",
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="panel rounded p-4 h-24 sm:p-5">
            <div className="h-4 w-16 bg-zinc-200 rounded" />
            <div className="mt-3 h-6 w-20 bg-zinc-200/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel rounded p-8 text-center">
        <p className="text-sm text-error">{error}</p>
        <a
          href="/api/youtube/connect"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Connect YouTube Channel
        </a>
      </div>
    );
  }

  if (!data || !data.channel) {
    return (
      <div className="panel rounded p-8 text-center border border-border">
        <h2 className="text-lg font-semibold text-foreground">No YouTube Channel Connected</h2>
        <p className="text-sm text-muted mt-2">Connect your channel to start automating replies.</p>
        <a
          href="/api/youtube/connect"
          className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          Connect YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground">YouTube Overview</h1>
          <p className="text-sm text-muted mt-1">
            {data.channel.title} — {data.channel.videoCount} videos
          </p>
        </div>
      </div>

      {/* Aggregate totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label="Subscribers" value={data.channel.subscriberCount.toLocaleString()} />
        <StatCard label="Total Views" value={data.channel.views.toLocaleString()} />
        <StatCard label="Videos" value={data.channel.videoCount} />
        <StatCard label="Replies Today" value={data.stats.repliesSentToday} />
        <StatCard label="Link Clicks" value={data.stats.linkClicksToday} />
        <StatCard label="Avg CTR" value={data.stats.ctr} />
      </div>

      <YTSubscriberChart data={data.subscriberHistory} />
      <YTVideoAnalytics videos={data.videos} />
    </div>
  );
}
