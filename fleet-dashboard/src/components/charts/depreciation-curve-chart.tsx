"use client";

import { useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTheme } from "@/lib/theme-context";
import { generateDepreciationCurve } from "@/lib/chart-data";
import { getChartColors } from "@/lib/chart-theme";

export function DepreciationCurveChart() {
  const { theme } = useTheme();
  const c = getChartColors();
  const data = useMemo(() => generateDepreciationCurve(), []);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="sohLabel" tick={{ fill: c.tickText, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={{ stroke: c.axisLine }} tickLine={false}
          label={{ value: "SOH", position: "insideBottomRight", offset: -4, fill: c.tickText, fontSize: 9 }}
        />
        <YAxis yAxisId="left" tick={{ fill: c.tickTextAlt, fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `₹${v}L`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#e05555", fontSize: 10, fontFamily: "var(--font-geist-mono)" }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `₹${v}L`} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: c.tooltipLabel }}
          formatter={(value, name) => [`₹${Number(value).toFixed(1)}L`, String(name) === "assetValueL" ? "Asset Value" : "Depr. Rate"]}
        />
        <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11, color: c.legendText }}
          formatter={(v: string) => v === "assetValueL" ? "Asset value" : "Depr. rate"}
        />
        <Area yAxisId="left" type="monotone" dataKey="assetValueL" stroke="#9a9790" strokeWidth={2} fill={theme === "dark" ? "rgba(154,151,144,0.07)" : "rgba(154,151,144,0.15)"} dot={{ r: 3, fill: "#9a9790" }} activeDot={{ r: 4, fill: "#9a9790" }} />
        <Line yAxisId="right" type="monotone" dataKey="deprRateL" stroke="#e05555" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 3, fill: "#e05555" }} activeDot={{ r: 4, fill: "#e05555" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
