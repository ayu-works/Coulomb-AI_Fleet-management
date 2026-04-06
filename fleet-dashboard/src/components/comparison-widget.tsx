"use client";

import { useState, useMemo } from "react";
import { Card, Select, Tag, Row, Col, Typography, Divider, Empty } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import { formatInr } from "@/lib/format";
import type { Bus } from "@/lib/types";

const { Text } = Typography;

type MetricKey = "soh_pct" | "km_per_day" | "revenueDaily" | "operatingCostDaily" | "netPnlDaily" | "pnlPerKm" | "currentAssetValueInr" | "sohDropRatePerMonth";

const METRICS: { key: MetricKey; label: string; format: (v: number) => string; higherIsBetter: boolean }[] = [
  { key: "soh_pct", label: "SOH %", format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true },
  { key: "km_per_day", label: "km/day", format: (v) => `${v}`, higherIsBetter: true },
  { key: "revenueDaily", label: "Revenue", format: formatInr, higherIsBetter: true },
  { key: "operatingCostDaily", label: "Op. Cost", format: formatInr, higherIsBetter: false },
  { key: "netPnlDaily", label: "Net P&L", format: formatInr, higherIsBetter: true },
  { key: "pnlPerKm", label: "P&L/km", format: (v) => `₹${v.toFixed(2)}`, higherIsBetter: true },
  { key: "currentAssetValueInr", label: "Asset Value", format: formatInr, higherIsBetter: true },
  { key: "sohDropRatePerMonth", label: "SOH Drop Rate", format: (v) => `${v.toFixed(3)}%/mo`, higherIsBetter: false },
];

export function ComparisonWidget() {
  const { filteredBuses } = useDashboard();
  const [busAId, setBusAId] = useState<string | null>(null);
  const [busBId, setBusBId] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["soh_pct", "pnlPerKm", "km_per_day"]);

  const busOptions = useMemo(() => filteredBuses.map((b) => ({ value: b.bus_id, label: `${b.bus_id} (${b.depot})` })), [filteredBuses]);
  const busA = filteredBuses.find((b) => b.bus_id === busAId) ?? null;
  const busB = filteredBuses.find((b) => b.bus_id === busBId) ?? null;

  function toggleMetric(key: MetricKey) {
    setSelectedMetrics((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  return (
    <Card size="small" style={{ borderColor: "var(--border)", background: "var(--bg3)" }} styles={{ body: { padding: "18px" } }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <SwapOutlined style={{ color: "#4a9de0" }} /> Compare Assets
        </Text>
        <Text style={{ fontSize: 11, color: "var(--text3)" }}>Side-by-side metric comparison</Text>
      </div>
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Text style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 4 }}>Bus A</Text>
          <Select value={busAId} onChange={setBusAId} options={busOptions} placeholder="Select bus..." showSearch
            filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())} size="small" style={{ width: "100%" }} allowClear />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 4 }}>Bus B</Text>
          <Select value={busBId} onChange={setBusBId} options={busOptions} placeholder="Select bus..." showSearch
            filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())} size="small" style={{ width: "100%" }} allowClear />
        </Col>
      </Row>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {METRICS.map((m) => (
          <Tag key={m.key} color={selectedMetrics.includes(m.key) ? "blue" : undefined} onClick={() => toggleMetric(m.key)} style={{ cursor: "pointer", fontSize: 11, margin: 0 }}>{m.label}</Tag>
        ))}
      </div>
      <Divider style={{ margin: "8px 0" }} />
      {busA && busB ? (
        <Row gutter={[12, 12]}>
          {selectedMetrics.map((key) => {
            const metric = METRICS.find((m) => m.key === key)!;
            const valA = busA[key] as number, valB = busB[key] as number;
            const aWins = metric.higherIsBetter ? valA >= valB : valA <= valB;
            return (
              <Col span={24} key={key}>
                <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--bg4)" }}>
                  <div style={{ width: "40%" }}>
                    <Text style={{ fontSize: 11, color: aWins ? "#2ecc8a" : "#e05555", fontWeight: 600 }}>{metric.format(valA)}</Text>
                    <Text style={{ fontSize: 10, color: "var(--text4)", display: "block" }}>{busA.bus_id}</Text>
                  </div>
                  <Text style={{ fontSize: 10, color: "var(--text3)" }}>{metric.label}</Text>
                  <div style={{ width: "40%", textAlign: "right" }}>
                    <Text style={{ fontSize: 11, color: !aWins ? "#2ecc8a" : "#e05555", fontWeight: 600 }}>{metric.format(valB)}</Text>
                    <Text style={{ fontSize: 10, color: "var(--text4)", display: "block" }}>{busB.bus_id}</Text>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty description="Select two buses to compare" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: "8px 0" }} />
      )}
    </Card>
  );
}
