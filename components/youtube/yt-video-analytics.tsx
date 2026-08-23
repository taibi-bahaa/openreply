"use client";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  linkClicks: number;
  ctr: string;
  publishedAt: string;
}

interface YTVideoAnalyticsProps {
  videos: Video[];
}

export default function YTVideoAnalytics({ videos }: YTVideoAnalyticsProps) {
  return (
    <div className="panel rounded p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Video Analytics</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">No videos found</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-border">
                <th className="py-2 pr-4 font-medium w-16"></th>
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 px-3 font-medium text-right">Views</th>
                <th className="py-2 px-3 font-medium text-right">Likes</th>
                <th className="py-2 px-3 font-medium text-right">Comments</th>
                <th className="py-2 px-3 font-medium text-right">Link Clicks</th>
                <th className="py-2 px-3 font-medium text-right">CTR</th>
                <th className="py-2 pl-3 font-medium text-right">Published</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                  <td className="py-3 pr-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail} alt="" className="w-16 h-10 object-cover rounded bg-zinc-200" />
                  </td>
                  <td className="py-3 pr-4 text-foreground font-medium truncate max-w-[200px]">{v.title}</td>
                  <td className="py-3 px-3 text-right text-muted">{v.views.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-muted">{v.likes.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-muted">{v.comments.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-muted">{v.linkClicks.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-muted">{v.ctr}</td>
                  <td className="py-3 pl-3 text-right text-zinc-500">
                    {new Date(v.publishedAt).toLocaleDateString()}
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
