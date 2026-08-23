"use client";

import { useState, useEffect } from "react";

interface YTVideoPickerProps {
  value: string | null;
  onChange: (videoId: string) => void;
}

export default function YTVideoPicker({ value, onChange }: YTVideoPickerProps) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch from /api/youtube/videos
    setTimeout(() => {
      setVideos([
        {
          id: "vid1",
          title: "How to build an AI agent",
          thumbnail: "https://via.placeholder.com/120x90",
          publishedAt: "2023-10-01T12:00:00Z",
        },
        {
          id: "vid2",
          title: "OpenReply Tutorial",
          thumbnail: "https://via.placeholder.com/120x90",
          publishedAt: "2023-09-25T12:00:00Z",
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="text-sm text-muted">Loading videos...</div>;

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none"
    >
      <option value="" disabled>Select a video...</option>
      {videos.map((vid) => (
        <option key={vid.id} value={vid.id}>
          {vid.title} ({new Date(vid.publishedAt).toLocaleDateString()})
        </option>
      ))}
    </select>
  );
}
