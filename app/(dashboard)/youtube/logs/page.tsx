"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/status-badge";

export default function YouTubeLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch from /api/youtube/logs
    setTimeout(() => {
      setLogs([
        {
          id: "log1",
          videoTitle: "How to build an AI agent",
          authorName: "JohnDoe",
          commentText: "Great video! What tool is that?",
          replyText: "Thanks JohnDoe! You can check it out here: https://link.com",
          mode: "Template",
          status: "SENT",
          timestamp: new Date().toISOString(),
        },
        {
          id: "log2",
          videoTitle: "OpenReply Tutorial",
          authorName: "JaneSmith",
          commentText: "Can I use this for IG?",
          replyText: "Yes, you can use it for Instagram as well!",
          mode: "AI",
          status: "SENT",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "log3",
          videoTitle: "How to build an AI agent",
          authorName: "SpamBot",
          commentText: "Buy cheap followers here!!!",
          replyText: "-",
          mode: "System",
          status: "SKIPPED_SPAM",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <div className="panel h-64 rounded p-8">Loading logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">YouTube Reply Logs</h1>
          <p className="text-sm text-muted mt-1">History of automated comments.</p>
        </div>
      </div>

      <div className="panel rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-3 px-4 font-medium">Timestamp</th>
              <th className="py-3 px-4 font-medium">Video</th>
              <th className="py-3 px-4 font-medium">Author</th>
              <th className="py-3 px-4 font-medium">Comment</th>
              <th className="py-3 px-4 font-medium">Reply</th>
              <th className="py-3 px-4 font-medium">Mode</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                <td className="py-3 px-4 text-muted whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-muted truncate max-w-[150px]">{log.videoTitle}</td>
                <td className="py-3 px-4 text-foreground font-medium">@{log.authorName}</td>
                <td className="py-3 px-4 text-muted max-w-[200px] truncate">{log.commentText}</td>
                <td className="py-3 px-4 text-muted max-w-[200px] truncate">{log.replyText}</td>
                <td className="py-3 px-4 text-muted">{log.mode}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.status === "SENT" ? "bg-success/15 text-success" : 
                    log.status.startsWith("SKIPPED") ? "bg-warning/15 text-warning" : 
                    "bg-error/15 text-error"
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
