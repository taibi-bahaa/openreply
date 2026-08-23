"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import YTVideoPicker from "@/components/youtube/yt-video-picker";
import KeywordInput from "@/components/keyword-input";
import YTCampaignPreview from "@/components/youtube/yt-campaign-preview";

export default function NewYouTubeAutomationPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [targetVideo, setTargetVideo] = useState<string | null>(null);
  const [matchAnyVideo, setMatchAnyVideo] = useState(false);
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<"whole" | "substring" | "any">("whole");
  
  const [replyMode, setReplyMode] = useState<"Template" | "AI">("Template");
  const [templates, setTemplates] = useState<string[]>([""]);
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  
  const [trackedLink, setTrackedLink] = useState("");
  
  const [subscriberGate, setSubscriberGate] = useState(false);
  const [notSubscribedMessage, setNotSubscribedMessage] = useState("Please subscribe to get the link!");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name) return setError("Please enter a name");
    if (!matchAnyVideo && !targetVideo) return setError("Please select a target video");
    if (matchMode !== "any" && keywords.length === 0) return setError("Please enter keywords");
    
    setSaving(true);
    // Mock POST /api/youtube/automations
    setTimeout(() => {
      setSaving(false);
      router.push("/youtube/automations");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">New YouTube Automation</h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Automation"}
        </button>
      </div>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Builder Form */}
        <div className="space-y-6 min-w-0">
          <div className="panel rounded p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Automation Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lead Gen - Tutorial Video"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Target Video</label>
              <div className="flex items-center gap-2 mb-3">
                <input 
                  type="checkbox" 
                  checked={matchAnyVideo} 
                  onChange={(e) => setMatchAnyVideo(e.target.checked)} 
                />
                <span className="text-sm text-muted">Match any video</span>
              </div>
              {!matchAnyVideo && (
                <YTVideoPicker value={targetVideo} onChange={setTargetVideo} />
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Keywords</label>
              <select 
                value={matchMode} 
                onChange={(e) => setMatchMode(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground mb-2"
              >
                <option value="whole">Exact word match</option>
                <option value="substring">Partial match</option>
                <option value="any">Any comment</option>
              </select>
              {matchMode !== "any" && (
                <KeywordInput keywords={keywords} onChange={setKeywords} />
              )}
            </div>

            <div className="border-t border-border pt-4">
              <label className="text-sm font-semibold text-foreground block mb-2">Reply Configuration</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={replyMode === "Template"} onChange={() => setReplyMode("Template")} />
                  Template Mode
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={replyMode === "AI"} onChange={() => setReplyMode("AI")} />
                  AI Mode
                </label>
              </div>

              {replyMode === "Template" ? (
                <div className="space-y-2">
                  {templates.map((tpl, idx) => (
                    <textarea
                      key={idx}
                      value={tpl}
                      onChange={(e) => {
                        const newTpls = [...templates];
                        newTpls[idx] = e.target.value;
                        setTemplates(newTpls);
                      }}
                      placeholder="Thanks! Here is the link: {link}"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground h-20"
                    />
                  ))}
                  <button 
                    onClick={() => setTemplates([...templates, ""])}
                    className="text-xs text-accent hover:underline"
                  >
                    + Add variant
                  </button>
                  <p className="text-xs text-muted">Tokens: {'{username}, {link}, {video_title}'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <select 
                    value={aiModel} 
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                  <textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="Instructions for the AI to generate a reply..."
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground h-32"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Tracked Link</label>
              <input
                value={trackedLink}
                onChange={(e) => setTrackedLink(e.target.value)}
                placeholder="https://yourwebsite.com/offer"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>

            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <input type="checkbox" checked={subscriberGate} onChange={(e) => setSubscriberGate(e.target.checked)} />
                Subscriber Gate
              </label>
              {subscriberGate && (
                <textarea
                  value={notSubscribedMessage}
                  onChange={(e) => setNotSubscribedMessage(e.target.value)}
                  placeholder="Message for non-subscribers"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground h-20"
                />
              )}
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        <div>
          <YTCampaignPreview 
            replyText={replyMode === "Template" ? templates[0] : "AI Generated Reply based on instructions..."} 
            trackedLink={trackedLink}
          />
        </div>
      </div>
    </div>
  );
}
