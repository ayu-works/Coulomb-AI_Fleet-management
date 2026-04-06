"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useDashboard } from "@/lib/dashboard-context";
import { useTheme } from "@/lib/theme-context";
import { computeSohDistribution } from "@/lib/chart-data";
import { getChartColors } from "@/lib/chart-theme";

export function SohDistributionChart() {
  const { filteredBuses } = useDashboard();
  const { theme } = useTheme();
  const c = getChartColors();
  const data = useMemo(() => computeSohDistribution(filteredBuses), [filteredBuses]);

  if (filteredBuses.length === 0) return <div className="flex h-[250px] items-center justify-center" style={{ color: c.tickText }}>No buses</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="band" tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} width={68} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: c.tooltipLabel }}
          formatter={(value) => [`${value} buses`, "Count"]} cursor={{ fill: c.cursor }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
          {data.map((entry, idx) => <Cell key={idx} fill={entry.fill} style={{ cursor: "pointer" }} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
