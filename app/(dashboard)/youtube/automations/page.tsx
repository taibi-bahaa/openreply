"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";

export default function YouTubeAutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch from /api/youtube/automations
    setTimeout(() => {
      setAutomations([
        {
          id: "1",
          name: "Lead Gen - AI Tutorial",
          videoTarget: "How to build an AI agent",
          keywords: ["link", "tool", "software"],
          replyMode: "Template",
          isActive: true,
          repliesSent: 42,
        },
        {
          id: "2",
          name: "General Support",
          videoTarget: "Any Video",
          keywords: ["help", "support", "broken"],
          replyMode: "AI",
          isActive: false,
          repliesSent: 12,
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  async function toggleStatus(id: string, current: boolean) {
    // Mock PATCH /api/youtube/automations/[id]
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !current } : a));
  }

  if (loading) {
    return <div className="panel h-64 rounded p-8">Loading automations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">YouTube Automations</h1>
          <p className="text-sm text-muted mt-1">Manage your automated comment replies.</p>
        </div>
        <Link
          href="/youtube/automations/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          New Automation
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="panel rounded p-8 text-center border border-border">
          <p className="text-sm text-muted">No automations yet</p>
          <Link
            href="/youtube/automations/new"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Create your first automation
          </Link>
        </div>
      ) : (
        <div className="panel rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Video Target</th>
                <th className="py-3 px-4 font-medium">Keywords</th>
                <th className="py-3 px-4 font-medium">Mode</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Replies Sent</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {automations.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                  <td className="py-3 px-4 text-foreground font-medium">{a.name}</td>
                  <td className="py-3 px-4 text-muted">{a.videoTarget}</td>
                  <td className="py-3 px-4 text-muted">{a.keywords.join(", ")}</td>
                  <td className="py-3 px-4 text-muted">{a.replyMode}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="py-3 px-4 text-right text-muted">{a.repliesSent}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(a.id, a.isActive)}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      {a.isActive ? "Pause" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
