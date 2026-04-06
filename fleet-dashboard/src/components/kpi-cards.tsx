"use client";

import { Card, Row, Col, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import { formatInr } from "@/lib/format";

const { Text } = Typography;

const CARDS = [
  { label: "TOTAL NET P&L", key: "pnl", getValue: (k: any) => k.totalNetPnl, format: formatInr, color: "#2ecc8a", borderColor: "#2ecc8a", showPeriod: true },
  { label: "TOTAL REVENUE", key: "rev", getValue: (k: any) => k.totalRevenue, format: formatInr, color: "#4a9de0", borderColor: "#4a9de0", showPeriod: true },
  { label: "OPERATING COST", key: "cost", getValue: (k: any) => k.totalOperatingCost, format: formatInr, color: "#f0a832", borderColor: "#f0a832", showPeriod: true },
  { label: "TOTAL ASSET VALUE", key: "asset", getValue: (k: any) => k.totalAssetValue, format: formatInr, color: "#e05555", borderColor: "#e05555", showPeriod: false },
  { label: "FLEET AVG SOH", key: "soh", getValue: (k: any) => k.fleetAvgSoh, format: (v: number) => `${v.toFixed(1)}%`, color: "#a78bfa", borderColor: "#a78bfa", showPeriod: false },
];

export function KpiCards() {
  const { kpis, period, filteredBuses } = useDashboard();
  const periodLabel = period === "daily" ? "/ day" : period === "weekly" ? "/ week" : period === "monthly" ? "/ month" : "/ year";
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <ClockCircleOutlined style={{ fontSize: 11, color: "var(--text4)" }} />
        <Text style={{ fontSize: 11, color: "var(--text4)" }}>Last updated: {today}</Text>
      </div>
      <Row gutter={[12, 12]}>
        {CARDS.map((c) => {
          const value = c.getValue(kpis);
          const displayColor = c.key === "pnl" && value < 0 ? "#e05555" : c.color;
          return (
            <Col key={c.key} xs={12} lg={Math.floor(24 / CARDS.length)}>
              <Card size="small" style={{ borderColor: "var(--border)", borderTop: `2px solid ${c.borderColor}`, background: "var(--bg3)" }} styles={{ body: { padding: "16px 18px" } }}>
                <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--text4)", marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-geist-mono)", color: displayColor, lineHeight: 1 }}>{c.format(value)}</div>
                <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>{c.showPeriod ? `${periodLabel} · ` : ""}{filteredBuses.length} buses</div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
