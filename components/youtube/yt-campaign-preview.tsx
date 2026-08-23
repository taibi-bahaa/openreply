"use client";

interface YTCampaignPreviewProps {
  replyText: string;
  trackedLink?: string;
}

export default function YTCampaignPreview({ replyText, trackedLink }: YTCampaignPreviewProps) {
  const finalReply = replyText
    .replace(/{username}/g, "JohnDoe")
    .replace(/{video_title}/g, "How to build an AI agent")
    .replace(/{link}/g, trackedLink || "https://yourwebsite.com/offer");

  return (
    <div className="panel rounded-lg overflow-hidden border border-border sticky top-6">
      <div className="bg-surface border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">YouTube Preview</h3>
      </div>
      <div className="p-4 bg-white space-y-6">
        
        {/* Original Comment */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-sm font-bold text-zinc-500">
            J
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-foreground">@JohnDoe</span>
              <span className="text-[12px] text-zinc-500">1 day ago</span>
            </div>
            <p className="text-[14px] text-foreground mt-1">This is an amazing video! Can I get the link to the tool?</p>
            <div className="flex items-center gap-4 mt-2">
              <button className="text-zinc-500 hover:text-foreground text-xs">👍</button>
              <button className="text-zinc-500 hover:text-foreground text-xs">👎</button>
              <button className="text-xs font-semibold text-zinc-500">Reply</button>
            </div>
          </div>
        </div>

        {/* Reply */}
        <div className="flex gap-3 pl-12">
          <div className="w-8 h-8 rounded-full bg-accent shrink-0 flex items-center justify-center text-xs font-bold text-white">
            Y
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-foreground bg-zinc-100 px-2 py-0.5 rounded-full">Your Channel</span>
              <span className="text-[12px] text-zinc-500">Just now</span>
            </div>
            <p className="text-[14px] text-foreground mt-1 whitespace-pre-wrap">{finalReply || "Write a reply to see it previewed here..."}</p>
            <div className="flex items-center gap-4 mt-2">
              <button className="text-zinc-500 hover:text-foreground text-xs">👍</button>
              <button className="text-zinc-500 hover:text-foreground text-xs">👎</button>
              <button className="text-xs font-semibold text-zinc-500">Reply</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
