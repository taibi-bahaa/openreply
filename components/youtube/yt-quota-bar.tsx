"use client";

interface YTQuotaBarProps {
  used: number;
  limit: number;
}

export default function YTQuotaBar({ used, limit }: YTQuotaBarProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  
  let colorClass = "bg-success";
  if (percentage >= 80) {
    colorClass = "bg-error";
  } else if (percentage >= 50) {
    colorClass = "bg-warning";
  }

  return (
    <div className="panel rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-foreground">YouTube API Quota</h3>
        <span className="text-xs text-muted">
          {used.toLocaleString()} / {limit.toLocaleString()} units used
        </span>
      </div>
      <div className="w-full bg-zinc-200 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
