"use client";

import { useMemo } from "react";
import { Card, Tag, Typography, Space } from "antd";
import { StarFilled } from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import { detectOutliers } from "@/lib/calculations";
import { depotStats as allDepotStats } from "@/data/fleet-data";
import type { Bus, OutlierFlag } from "@/lib/types";

const { Text } = Typography;

export function StarPerformers() {
  const { filteredBuses, setSelectedBusId } = useDashboard();
  const top5 = useMemo(() => {
    const performers: { bus: Bus; flag: OutlierFlag }[] = [];
    for (const bus of filteredBuses) {
      if (bus.maintenanceStatus === "maintenance") continue;
      const ds = allDepotStats.get(bus.depot);
      if (!ds) continue;
      const flags = detectOutliers(bus, ds).filter((f) => f.direction === "good");
      if (flags.length > 0) performers.push({ bus, flag: flags[0] });
    }
    performers.sort((a, b) => b.bus.pnlPerKm - a.bus.pnlPerKm);
    return performers.slice(0, 5);
  }, [filteredBuses]);

  return (
    <Card size="small" style={{ borderColor: "var(--border)", background: "var(--bg3)", height: "100%" }} styles={{ body: { padding: "18px" } }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <StarFilled style={{ color: "#f0a832" }} /> Star Performers
        </Text>
        <Text style={{ fontSize: 11, color: "var(--text3)" }}>Top fleet assets by P&L per km</Text>
      </div>
      {top5.length === 0 ? <Text style={{ fontSize: 12, color: "var(--text4)" }}>No star performers</Text> : (
        <div className="flex flex-col">
          {top5.map(({ bus, flag }) => (
            <div key={bus.bus_id} onClick={() => setSelectedBusId(bus.bus_id)} style={{ padding: "6px 0", cursor: "pointer", borderBottom: "1px solid var(--border)" }}>
              <Space size={8} wrap>
                <Text strong style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>{bus.bus_id}</Text>
                <Text style={{ fontSize: 11, color: "var(--text3)" }}>{bus.depot}</Text>
                <Text style={{ fontSize: 11, color: "#2ecc8a" }}>₹{bus.pnlPerKm.toFixed(2)}/km</Text>
                <Tag color="success" style={{ fontSize: 10, margin: 0 }}>
                  {flag.type === "star_performer" ? "Star" : flag.type === "efficient_mover" ? "Efficient" : "Revenue Efficient"}
                </Tag>
              </Space>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
