"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { useDashboard } from "@/lib/dashboard-context";
import { useTheme } from "@/lib/theme-context";
import { computeDepotComparison, formatInrAxis } from "@/lib/chart-data";
import { getChartColors } from "@/lib/chart-theme";
import { buses as allBuses } from "@/data/fleet-data";

export function DepotComparisonChart() {
  const { period, depot, setDepot } = useDashboard();
  const { theme } = useTheme();
  const c = getChartColors();
  const periodDays = { daily: 1, weekly: 7, monthly: 30, all: 365 }[period];
  const data = useMemo(() => computeDepotComparison(allBuses, periodDays), [periodDays]);

  function handleBarClick(_data: unknown, idx: number) {
    const depotCode = data[idx]?.depot;
    if (depotCode) setDepot(depot === depotCode ? "ALL" : depotCode);
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="depot" tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={{ stroke: c.axisLine }} tickLine={false} />
        <YAxis tickFormatter={formatInrAxis} tick={{ fill: c.tickTextAlt, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} width={68} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: c.tooltipLabel }}
          formatter={(value, name) => [formatInrAxis(Number(value)), String(name) === "revenue" ? "Revenue" : String(name) === "operatingCost" ? "Op. Cost" : "Net P&L"]}
          cursor={{ fill: c.cursor }}
        />
        <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11, color: c.legendText }}
          formatter={(v: string) => v === "revenue" ? "Revenue" : v === "operatingCost" ? "Op. Cost" : "Net P&L"}
        />
        <Bar dataKey="revenue" fill="#4a9de0" radius={[3, 3, 0, 0]} maxBarSize={28} onClick={handleBarClick} className="cursor-pointer">
          {data.map((e) => <Cell key={e.depot} fill="#4a9de0" opacity={depot === "ALL" || depot === e.depot ? 1 : 0.2} />)}
        </Bar>
        <Bar dataKey="operatingCost" fill="#e05555" radius={[3, 3, 0, 0]} maxBarSize={28} onClick={handleBarClick} className="cursor-pointer">
          {data.map((e) => <Cell key={e.depot} fill="#e05555" opacity={depot === "ALL" || depot === e.depot ? 1 : 0.2} />)}
        </Bar>
        <Bar dataKey="netPnl" fill="#2ecc8a" radius={[3, 3, 0, 0]} maxBarSize={28} onClick={handleBarClick} className="cursor-pointer">
          {data.map((e) => <Cell key={e.depot} fill="#2ecc8a" opacity={depot === "ALL" || depot === e.depot ? 1 : 0.2} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
