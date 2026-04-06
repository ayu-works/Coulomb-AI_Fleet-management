"use client";

import { useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useDashboard } from "@/lib/dashboard-context";
import { useTheme } from "@/lib/theme-context";
import { generatePnlTrend, formatInrAxis } from "@/lib/chart-data";
import { getChartColors } from "@/lib/chart-theme";

export function PnlTrendChart() {
  const { filteredBuses, period } = useDashboard();
  const { theme } = useTheme();
  const c = getChartColors();
  const rawData = useMemo(() => generatePnlTrend(filteredBuses, period), [filteredBuses, period]);

  const isGrowing = rawData.length >= 2 && rawData[rawData.length - 1].cumulativePnl >= rawData[0].cumulativePnl;
  const pnlColor = isGrowing ? "#2ecc8a" : "#e05555";
  const pnlFill = isGrowing ? "rgba(46,204,138,0.12)" : "rgba(224,85,85,0.1)";

  const data = useMemo(() => {
    let cumRev = 0, cumCost = 0;
    return rawData.map((d) => { cumRev += d.revenue; cumCost += d.totalCost; return { ...d, cumulativeRevenue: cumRev, cumulativeCost: cumCost }; });
  }, [rawData]);

  if (data.length === 0) return <div className="flex h-[220px] items-center justify-center" style={{ color: c.tickText }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="month" tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={{ stroke: c.axisLine }} tickLine={false} interval={period === "daily" ? 4 : 0} />
        <YAxis tickFormatter={formatInrAxis} tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} width={62} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: c.tooltipLabel }}
          itemSorter={(item) => ({ cumulativeRevenue: 0, cumulativeCost: 1, cumulativePnl: 2 }[String(item.dataKey)] ?? 9)}
          formatter={(value, name) => [formatInrAxis(Number(value)), String(name) === "cumulativeRevenue" ? "Cumulative Revenue" : String(name) === "cumulativeCost" ? "Cumulative Cost + Depr." : "Cumulative P&L"]}
        />
        <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 11, color: c.legendText }}
          formatter={(v: string) => v === "cumulativeRevenue" ? "Revenue" : v === "cumulativeCost" ? "Cost + Depr." : "Cumulative P&L"}
        />
        <Line type="monotone" dataKey="cumulativeRevenue" stroke={c.trendLine1} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: c.activeDot }} />
        <Line type="monotone" dataKey="cumulativeCost" stroke={c.trendLine2} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 3, fill: c.activeDot }} />
        <Area type="monotone" dataKey="cumulativePnl" stroke={pnlColor} strokeWidth={2.5} fill={pnlFill} dot={false} activeDot={{ r: 4, fill: pnlColor }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
