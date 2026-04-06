"use client";

import { useMemo } from "react";
import { Card, Tag, Typography, Space } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import { generateAlerts } from "@/lib/calculations";
import { depotStats as allDepotStats } from "@/data/fleet-data";
import type { Bus, Alert } from "@/lib/types";

const { Text } = Typography;

export function TopAttention() {
  const { filteredBuses, setSelectedBusId } = useDashboard();
  const top5 = useMemo(() => {
    const scored: { bus: Bus; alert: Alert; score: number }[] = [];
    for (const bus of filteredBuses) {
      if (bus.maintenanceStatus === "maintenance") continue;
      const ds = allDepotStats.get(bus.depot);
      if (!ds) continue;
      for (const a of generateAlerts(bus, ds)) scored.push({ bus, alert: a, score: a.severity === "high" ? 2 : 1 });
    }
    const byBus = new Map<string, (typeof scored)[0]>();
    for (const s of scored) { const e = byBus.get(s.bus.bus_id); if (!e || s.score > e.score) byBus.set(s.bus.bus_id, s); }
    return [...byBus.values()].sort((a, b) => b.score - a.score).slice(0, 5);
  }, [filteredBuses]);

  return (
    <Card size="small" style={{ borderColor: "var(--border)", background: "var(--bg3)", height: "100%" }} styles={{ body: { padding: "18px" } }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <WarningOutlined style={{ color: "#e05555" }} /> Top 5 Need Attention
        </Text>
        <Text style={{ fontSize: 11, color: "var(--text3)" }}>Buses requiring immediate review</Text>
      </div>
      {top5.length === 0 ? <Text style={{ fontSize: 12, color: "var(--text4)" }}>No buses need attention</Text> : (
        <div className="flex flex-col">
          {top5.map(({ bus, alert }) => (
            <div key={bus.bus_id} onClick={() => setSelectedBusId(bus.bus_id)} style={{ padding: "6px 0", cursor: "pointer", borderBottom: "1px solid var(--border)" }}>
              <Space size={8} wrap>
                <Text strong style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>{bus.bus_id}</Text>
                <Text style={{ fontSize: 11, color: "var(--text3)" }}>{bus.depot}</Text>
                <Tag color={alert.severity === "high" ? "error" : "warning"} style={{ fontSize: 10, margin: 0 }}>
                  {alert.type === "fast_degrader" ? "Fast Degrader" : alert.type === "approaching_eol" ? "Near EOL" : alert.type === "pnl_negative" ? "Negative P&L" : alert.type === "underutilised" ? "Underutilised" : "Cost Spike"}
                </Tag>
              </Space>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
