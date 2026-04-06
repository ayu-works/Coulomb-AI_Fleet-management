"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine } from "recharts";
import { useDashboard } from "@/lib/dashboard-context";
import { useTheme } from "@/lib/theme-context";
import { generatePnlTrend, formatInrAxis } from "@/lib/chart-data";
import { getChartColors } from "@/lib/chart-theme";

export function PnlBarChart() {
  const { filteredBuses, period } = useDashboard();
  const { theme } = useTheme();
  const c = getChartColors();
  const data = useMemo(() => generatePnlTrend(filteredBuses, period), [filteredBuses, period]);

  if (data.length === 0) return <div className="flex h-[250px] items-center justify-center" style={{ color: c.tickText }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="month" tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={{ stroke: c.axisLine }} tickLine={false} interval={period === "daily" ? 4 : 0} />
        <YAxis tickFormatter={formatInrAxis} tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} width={62} />
        <ReferenceLine y={0} stroke={c.refLine} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: c.tooltipLabel }}
          formatter={(value, name) => [formatInrAxis(Number(value)), String(name) === "revenue" ? "Revenue" : String(name) === "totalCost" ? "Cost + Depreciation" : "Net P&L"]}
        />
        <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11, color: c.legendText }}
          formatter={(v: string) => v === "revenue" ? "Revenue" : v === "totalCost" ? "Cost + Depr." : "Net P&L"}
        />
        <Bar dataKey="revenue" fill="#5bb8f5" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="totalCost" fill="#f07a6e" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="netPnl" maxBarSize={18} radius={[3, 3, 0, 0]}>
          {data.map((entry, idx) => <Cell key={idx} fill={entry.netPnl >= 0 ? "#3ddba0" : "#f07a6e"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
