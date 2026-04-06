"use client";

import { useMemo } from "react";
import { Drawer, Typography, Tag, Descriptions, Progress, Statistic, Row, Col, Alert, Button, Divider, Tooltip, App } from "antd";
import {
  EnvironmentOutlined,
  CalendarOutlined,
  ToolOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import { formatInr } from "@/lib/format";
import {
  healthTier,
  detectOutliers,
  computeBenchmarks,
  type BenchmarkMetric,
} from "@/lib/calculations";
import { buses as allBuses, depotStats as allDepotStats } from "@/data/fleet-data";
import type { HealthTier } from "@/lib/types";

const { Text, Title } = Typography;

const STATUS_COLORS: Record<HealthTier | "Maintenance", string> = {
  Healthy: "success",
  Moderate: "warning",
  Critical: "error",
  Maintenance: "processing",
};

const SOH_STROKE: Record<HealthTier, string> = {
  Healthy: "#2ecc8a",
  Moderate: "#f0a832",
  Critical: "#e05555",
};

function pctDiff(bus: number, avg: number): string {
  if (avg === 0) return "—";
  const diff = ((bus - avg) / avg) * 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
}

export function BusDetailPanel() {
  const { selectedBusId, setSelectedBusId, period } = useDashboard();
  const { message } = App.useApp();

  const bus = useMemo(
    () => (selectedBusId ? allBuses.find((b) => b.bus_id === selectedBusId) ?? null : null),
    [selectedBusId]
  );

  const allDepotPeers = useMemo(() => {
    if (!bus) return [];
    return allBuses.filter((b) => b.depot === bus.depot);
  }, [bus]);

  const ds = bus ? allDepotStats.get(bus.depot) : null;
  const outlierFlags = useMemo(() => (bus && ds ? detectOutliers(bus, ds) : []), [bus, ds]);
  const benchmarks = useMemo(() => (bus ? computeBenchmarks(bus, allDepotPeers) : []), [bus, allDepotPeers]);

  const isMaint = bus?.maintenanceStatus === "maintenance";
  const tier = bus ? healthTier(bus.soh_pct) : "Healthy";
  const displayStatus = isMaint ? "Maintenance" : tier;

  const mult = { daily: 1, weekly: 7, monthly: 30, all: 365 }[period];
  const periodLabel = period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : period === "monthly" ? "Monthly" : "All Time";

  return (
    <Drawer
      open={!!selectedBusId}
      onClose={() => setSelectedBusId(null)}
      placement="right"
      size="default"
      styles={{ wrapper: { width: 420 }, body: { padding: 0 } }}
      title={null}
      closable
    >
      {bus && (
        <div className="flex flex-col">
          {/* Maintenance banner */}
          {isMaint && (
            <Alert
              message="Under maintenance — financials from last active period"
              type="info"
              icon={<ToolOutlined />}
              showIcon
              banner
              style={{ borderRadius: 0 }}
            />
          )}

          {/* 1. Header */}
          <div className="px-5 pt-5 pb-3">
            <Title level={4} style={{ fontFamily: "var(--font-geist-mono)", marginBottom: 4 }}>
              {bus.bus_id}
            </Title>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
              <Text type="secondary" style={{ fontSize: 12 }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {bus.depot} — {bus.route_zone}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {bus.age_months} months in service
              </Text>
            </div>
            <Tag color={STATUS_COLORS[displayStatus]} icon={isMaint ? <ToolOutlined /> : undefined}>
              {displayStatus}
            </Tag>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 2. Battery Health */}
          <SectionTitle>Battery Health</SectionTitle>
          <div className="px-5 pb-4 flex items-center gap-5">
            <Progress
              type="circle"
              percent={bus.soh_pct}
              size={80}
              strokeColor={SOH_STROKE[tier]}
              trailColor="var(--soh-track)"
              format={() => (
                <div className="flex flex-col items-center">
                  <Text strong style={{ fontSize: 16 }}>{bus.soh_pct.toFixed(1)}</Text>
                  <Text type="secondary" style={{ fontSize: 9 }}>SOH %</Text>
                </div>
              )}
            />
            <Descriptions column={1} size="small" colon={false} labelStyle={{ color: "var(--text4)", fontSize: 11, width: 110 }} contentStyle={{ fontSize: 12 }}>
              <Descriptions.Item label="Effective Capacity">{bus.effectiveBatteryCapacityKwh.toFixed(0)} kWh</Descriptions.Item>
              <Descriptions.Item label="Months to EOL">
                <Text style={{ color: bus.projectedMonthsToEol !== null && bus.projectedMonthsToEol < 6 ? "#e05555" : undefined }}>
                  {bus.projectedMonthsToEol !== null ? `${bus.projectedMonthsToEol.toFixed(0)} mo` : "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Depreciation">{formatInr(bus.depreciationInr)} <Text type="secondary" style={{ fontSize: 10 }}>of {formatInr(bus.initial_asset_value_inr)}</Text></Descriptions.Item>
              <Descriptions.Item label="SOH Drop Rate">{bus.sohDropRatePerMonth.toFixed(2)}%/mo {ds && <Text type="secondary" style={{ fontSize: 10 }}>(avg {ds.avgSohDropRate.toFixed(2)})</Text>}</Descriptions.Item>
            </Descriptions>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 3. Utilisation */}
          <SectionTitle>Utilisation</SectionTitle>
          <div className="px-5 pb-4">
            <Row gutter={12}>
              <Col span={12}>
                <StatBox label="km/day" value={isMaint ? "0 (maint.)" : String(bus.km_per_day)}
                  sub={ds && !isMaint ? `${pctDiff(bus.km_per_day, ds.avgKmPerDay)} vs depot` : undefined}
                  subColor={ds && bus.km_per_day >= (ds?.avgKmPerDay ?? 0) ? "#2ecc8a" : "#e05555"}
                />
              </Col>
              <Col span={12}>
                <StatBox label="Odometer" value={`${(bus.odometer_km / 1000).toFixed(0)}K km`} />
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 4. Financials */}
          <SectionTitle>Financials ({periodLabel})</SectionTitle>
          <div className="px-5 pb-4">
            {isMaint && <Text type="secondary" style={{ fontSize: 11, color: "#4a9de0", display: "block", marginBottom: 8 }}>Values from last active period</Text>}
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <StatBox label="Revenue" value={formatInr(bus.revenueDaily * mult)}
                  sub={ds ? `avg ${formatInr((ds.totalRevenue / ds.busCount) * mult)}` : undefined}
                />
              </Col>
              <Col span={12}>
                <StatBox label="Op. Cost" value={formatInr(bus.operatingCostDaily * mult)}
                  sub={ds ? `avg ${formatInr((ds.totalOperatingCost / ds.busCount) * mult)}` : undefined}
                />
              </Col>
              <Col span={12}>
                <StatBox label="Net P&L" value={formatInr(bus.netPnlDaily * mult)}
                  valueColor={bus.netPnlDaily >= 0 ? "#2ecc8a" : "#e05555"}
                />
              </Col>
              <Col span={12}>
                <StatBox label="P&L/km" value={`₹${bus.pnlPerKm.toFixed(2)}`}
                  valueColor={bus.pnlPerKm >= 0 ? "#2ecc8a" : "#e05555"}
                />
              </Col>
              <Col span={24}>
                <StatBox label="Asset Value" value={formatInr(bus.currentAssetValueInr)} />
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 5. Benchmarking */}
          <SectionTitle>Benchmarking vs {bus.depot} Peers</SectionTitle>
          <div className="px-5 pb-4 flex flex-col gap-4">
            {benchmarks.map((bm) => (
              <BulletBar key={bm.label} metric={bm} />
            ))}
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 6. Outlier Flags */}
          <SectionTitle>Outlier Flags</SectionTitle>
          <div className="px-5 pb-4 flex flex-col gap-2">
            {outlierFlags.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>Within normal range on all metrics.</Text>
            ) : (
              outlierFlags.map((f, i) => (
                <Alert
                  key={i}
                  message={f.label}
                  type={f.direction === "bad" ? "warning" : "success"}
                  showIcon
                  style={{ fontSize: 12 }}
                />
              ))
            )}
          </div>

          <Divider style={{ margin: 0 }} />

          {/* 7. Export */}
          <div className="px-5 py-4">
            <Button
              block
              icon={<FilePdfOutlined />}
              onClick={() => {
                message.success(`PDF export triggered for ${bus.bus_id}`);
              }}
            >
              Export as PDF
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ── Helpers ──

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-2">
      <Text type="secondary" strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{children}</Text>
    </div>
  );
}

function StatBox({ label, value, valueColor, sub, subColor }: {
  label: string; value: string; valueColor?: string; sub?: string; subColor?: string;
}) {
  return (
    <div style={{ background: "var(--bg4)", borderRadius: 6, padding: "8px 10px" }}>
      <Text type="secondary" style={{ fontSize: 10, display: "block" }}>{label}</Text>
      <Text strong style={{ fontSize: 13, color: valueColor }}>{value}</Text>
      {sub && <Text style={{ fontSize: 10, color: subColor || "#666", display: "block" }}>{sub}</Text>}
    </div>
  );
}

function BulletBar({ metric }: { metric: BenchmarkMetric }) {
  const { label, busValue, depotAvg, depotMin, depotMax, unit, higherIsBetter } = metric;
  const range = depotMax - depotMin || 1;
  const padMin = depotMin - range * 0.1;
  const padMax = depotMax + range * 0.1;
  const totalRange = padMax - padMin || 1;

  const busPos = Math.max(0, Math.min(((busValue - padMin) / totalRange) * 100, 100));
  const avgPos = Math.max(0, Math.min(((depotAvg - padMin) / totalRange) * 100, 100));
  const rangeLeft = Math.max(0, ((depotMin - padMin) / totalRange) * 100);
  const rangeRight = Math.min(100, ((depotMax - padMin) / totalRange) * 100);
  const isGood = higherIsBetter ? busValue >= depotAvg : busValue <= depotAvg;

  const fmtVal = (v: number) => unit === "₹" ? `₹${v.toFixed(2)}` : `${v.toFixed(1)}${unit}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
        <Text strong style={{ fontSize: 11 }}>{fmtVal(busValue)}</Text>
      </div>
      <div style={{ position: "relative", height: 10, background: "var(--soh-track)", borderRadius: 5 }}>
        <div style={{ position: "absolute", top: 0, height: "100%", borderRadius: 5, background: "var(--hover)", left: `${rangeLeft}%`, width: `${rangeRight - rangeLeft}%` }} />
        <Tooltip title={`Depot avg: ${fmtVal(depotAvg)}`}>
          <div style={{ position: "absolute", top: 0, height: "100%", width: 2, background: "var(--border2)", left: `${avgPos}%` }} />
        </Tooltip>
        <Tooltip title={`This bus: ${fmtVal(busValue)} (${pctDiff(busValue, depotAvg)} vs avg)`}>
          <div style={{
            position: "absolute", top: "50%", width: 10, height: 10, borderRadius: "50%",
            transform: "translate(-50%, -50%)", left: `${busPos}%`,
            background: isGood ? "#2ecc8a" : "#e05555", border: "2px solid var(--dot-border)",
          }} />
        </Tooltip>
      </div>
      <div className="flex justify-between" style={{ fontSize: 9, color: "var(--text4)" }}>
        <span>{fmtVal(depotMin)}</span>
        <span>{fmtVal(depotMax)}</span>
      </div>
    </div>
  );
}
