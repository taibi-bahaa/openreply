"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface YTSubscriberChartProps {
  data: { date: string; subscriberCount: number }[];
}

const SERIES_COLOR = "#f97316";
const GRID_COLOR = "#e4e4e7";
const AXIS_TEXT = "#71717a";

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function YTSubscriberChart({ data }: YTSubscriberChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="panel rounded p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Subscriber Growth</h2>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDay} 
              tick={{ fill: AXIS_TEXT, fontSize: 12 }} 
              stroke={GRID_COLOR} 
              tickLine={false} 
              minTickGap={24} 
            />
            <YAxis 
              tickFormatter={formatCompact} 
              tick={{ fill: AXIS_TEXT, fontSize: 12 }} 
              stroke={GRID_COLOR} 
              tickLine={false} 
              width={52} 
              domain={["dataMin - 10", "dataMax + 10"]} 
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload;
                return (
                  <div className="rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg">
                    <p className="text-muted">{formatDay(point.date)}</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {point.subscriberCount.toLocaleString()} subscribers
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }} 
            />
            <Line
              type="monotone"
              dataKey="subscriberCount"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
