"use client";

import { useMemo, useState } from "react";
import { Table, Tag, Tooltip, Input, Button, Select, Space, Typography, App } from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  WarningFilled,
  StarFilled,
  ToolOutlined,
  ExclamationCircleFilled,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useDashboard } from "@/lib/dashboard-context";
import { formatInr } from "@/lib/format";
import { healthTier, detectOutliers } from "@/lib/calculations";
import { exportFleetCsv } from "@/lib/export";
import { DEPOT_LABELS, type DepotCode } from "@/lib/types";
import type { Bus, HealthTier, OutlierFlag } from "@/lib/types";

const { Text } = Typography;

type HealthFilter = "All" | "Healthy" | "Moderate" | "Critical" | "Maintenance";

const SOH_COLORS: Record<HealthTier, string> = {
  Healthy: "#2ecc8a",
  Moderate: "#f0a832",
  Critical: "#e05555",
};

const TAG_STYLES: Record<HealthTier | "Maintenance", { bg: string; color: string }> = {
  Healthy: { bg: "rgba(46,204,138,0.12)", color: "#2ecc8a" },
  Moderate: { bg: "rgba(240,168,50,0.12)", color: "#f0a832" },
  Critical: { bg: "rgba(224,85,85,0.12)", color: "#e05555" },
  Maintenance: { bg: "rgba(74,157,224,0.1)", color: "#4a9de0" },
};

export function FleetTable() {
  const { filteredBuses, depotStatsMap, period, setSelectedBusId } = useDashboard();
  const { message } = App.useApp();
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("All");
  const [depotFilter, setDepotFilter] = useState<DepotCode | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const mult = { daily: 1, weekly: 7, monthly: 30, all: 365 }[period];

  // Pre-compute outlier flags
  const outlierMap = useMemo(() => {
    const map = new Map<string, OutlierFlag[]>();
    for (const bus of filteredBuses) {
      const ds = depotStatsMap.get(bus.depot);
      if (ds) map.set(bus.bus_id, detectOutliers(bus, ds));
      else map.set(bus.bus_id, []);
    }
    return map;
  }, [filteredBuses, depotStatsMap]);

  // Filter
  const filtered = useMemo(() => {
    let result = filteredBuses;
    // Depot filter (table-local, independent of global depot filter)
    if (depotFilter !== "ALL") {
      result = result.filter((b) => b.depot === depotFilter);
    }
    if (healthFilter !== "All") {
      if (healthFilter === "Maintenance") {
        result = result.filter((b) => b.maintenanceStatus === "maintenance");
      } else {
        result = result.filter(
          (b) => b.maintenanceStatus === "active" && healthTier(b.soh_pct) === healthFilter
        );
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.bus_id.toLowerCase().includes(q) ||
          b.depot.toLowerCase().includes(q) ||
          b.route_zone.toLowerCase().includes(q)
      );
    }
    // Sort: active first, then maintenance
    return [...result].sort((a, b) => {
      if (a.maintenanceStatus === b.maintenanceStatus) return 0;
      return a.maintenanceStatus === "active" ? -1 : 1;
    });
  }, [filteredBuses, healthFilter, search]);

  const columns: ColumnsType<Bus> = [
    {
      title: "Bus ID",
      dataIndex: "bus_id",
      key: "bus_id",
      sorter: (a, b) => a.bus_id.localeCompare(b.bus_id),
      render: (v) => <Text strong style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>{v}</Text>,
      width: 90,
    },
    {
      title: "Depot",
      dataIndex: "depot",
      key: "depot",
      sorter: (a, b) => a.depot.localeCompare(b.depot),
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
      width: 65,
    },
    {
      title: "SOH %",
      dataIndex: "soh_pct",
      key: "soh_pct",
      sorter: (a, b) => a.soh_pct - b.soh_pct,
      render: (v: number) => {
        const tier = healthTier(v);
        return (
          <div className="flex items-center gap-2">
            <div style={{ width: 56, height: 6, background: "var(--soh-track)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(v, 100)}%`, height: "100%", background: SOH_COLORS[tier], borderRadius: 3 }} />
            </div>
            <Text style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{v.toFixed(1)}%</Text>
          </div>
        );
      },
      width: 130,
    },
    {
      title: "km/day",
      dataIndex: "km_per_day",
      key: "km_per_day",
      sorter: (a, b) => a.km_per_day - b.km_per_day,
      align: "right",
      render: (v: number, bus) =>
        bus.maintenanceStatus === "maintenance"
          ? <Text type="secondary" style={{ fontSize: 12 }}>0</Text>
          : <Text style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{v}</Text>,
      width: 80,
    },
    {
      title: "Revenue",
      key: "revenue",
      sorter: (a, b) => a.revenueDaily - b.revenueDaily,
      align: "right",
      render: (_, bus) => {
        const v = bus.revenueDaily * mult;
        return bus.maintenanceStatus === "maintenance"
          ? <Tooltip title="Frozen — last active period"><Text type="secondary" style={{ fontSize: 12, textDecoration: "underline dotted" }}>{formatInr(v)}</Text></Tooltip>
          : <Text style={{ fontSize: 12 }}>{formatInr(v)}</Text>;
      },
      width: 90,
    },
    {
      title: "Op. Cost",
      key: "opCost",
      sorter: (a, b) => a.operatingCostDaily - b.operatingCostDaily,
      align: "right",
      render: (_, bus) => {
        const v = bus.operatingCostDaily * mult;
        return bus.maintenanceStatus === "maintenance"
          ? <Tooltip title="Frozen — last active period"><Text type="secondary" style={{ fontSize: 12, textDecoration: "underline dotted" }}>{formatInr(v)}</Text></Tooltip>
          : <Text style={{ fontSize: 12 }}>{formatInr(v)}</Text>;
      },
      width: 90,
    },
    {
      title: "Net P&L",
      key: "netPnl",
      sorter: (a, b) => a.netPnlDaily - b.netPnlDaily,
      align: "right",
      render: (_, bus) => {
        const v = bus.netPnlDaily * mult;
        const color = bus.maintenanceStatus === "maintenance" ? "#666" : v >= 0 ? "#2ecc8a" : "#e05555";
        return <Text strong style={{ fontSize: 12, color }}>{formatInr(v)}</Text>;
      },
      width: 90,
    },
    {
      title: "P&L/km",
      key: "pnlPerKm",
      sorter: (a, b) => a.pnlPerKm - b.pnlPerKm,
      align: "right",
      render: (_, bus) => {
        const color = bus.pnlPerKm >= 0 ? "#2ecc8a" : "#e05555";
        return <Text style={{ fontSize: 12, color }}>₹{bus.pnlPerKm.toFixed(2)}</Text>;
      },
      width: 80,
    },
    {
      title: "Asset Value",
      key: "assetValue",
      sorter: (a, b) => a.currentAssetValueInr - b.currentAssetValueInr,
      align: "right",
      render: (_, bus) => <Text style={{ fontSize: 12 }}>{formatInr(bus.currentAssetValueInr)}</Text>,
      width: 100,
    },
    {
      title: "Status",
      key: "status",
      sorter: (a, b) => {
        const sa = a.maintenanceStatus === "maintenance" ? "Maintenance" : healthTier(a.soh_pct);
        const sb = b.maintenanceStatus === "maintenance" ? "Maintenance" : healthTier(b.soh_pct);
        return sa.localeCompare(sb);
      },
      render: (_, bus) => {
        const status = bus.maintenanceStatus === "maintenance" ? "Maintenance" : healthTier(bus.soh_pct);
        const ts = TAG_STYLES[status];
        return (
          <Tag
            icon={status === "Maintenance" ? <ToolOutlined /> : undefined}
            style={{ fontSize: 10, margin: 0, background: ts.bg, color: ts.color, border: "none", fontFamily: "var(--font-geist-mono)" }}
          >
            {status}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "",
      key: "flags",
      width: 36,
      render: (_, bus) => {
        const flags = outlierMap.get(bus.bus_id) ?? [];
        if (flags.length === 0) return null;
        const hasBad = flags.some((f) => f.direction === "bad");
        const hasGood = flags.some((f) => f.direction === "good");
        const icon = hasBad
          ? <ExclamationCircleFilled style={{ color: "#e05555", fontSize: 14 }} />
          : <StarFilled style={{ color: "#2ecc8a", fontSize: 14 }} />;
        return (
          <Tooltip
            title={
              <ul style={{ margin: 0, padding: "0 0 0 12px", fontSize: 11 }}>
                {flags.map((f, i) => (
                  <li key={i} style={{ color: f.direction === "bad" ? "#ff7875" : "#95de64" }}>{f.label}</li>
                ))}
              </ul>
            }
          >
            {icon}
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {([
            { label: "All", value: "All" as HealthFilter },
            { label: "Healthy", value: "Healthy" as HealthFilter },
            { label: "Moderate", value: "Moderate" as HealthFilter },
            { label: "Critical", value: "Critical" as HealthFilter },
            { label: "Maintenance", value: "Maintenance" as HealthFilter },
          ]).map((pill) => {
            const active = healthFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => setHealthFilter(pill.value)}
                style={{
                  padding: "5px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  border: active ? "1px solid #4a9de0" : "1px solid var(--border2)",
                  background: active ? "rgba(74,157,224,0.12)" : "transparent",
                  color: active ? "#4a9de0" : "var(--text2)",
                  transition: "all 0.15s",
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
        <Space size={10}>
          <Input
            placeholder="Search bus ID, depot..."
            prefix={<SearchOutlined style={{ color: "var(--text4)" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 220,
              background: "var(--bg3)",
              border: "1px solid var(--border2)",
              borderRadius: 20,
              color: "var(--text)",
              fontSize: 12,
            }}
            allowClear
          />
          <Select
            value={depotFilter}
            onChange={(v) => setDepotFilter(v as DepotCode | "ALL")}
            suffixIcon={<EnvironmentOutlined style={{ color: "var(--text4)" }} />}
            style={{ minWidth: 150 }}
            size="middle"
            options={[
              { value: "ALL", label: "All Depots" },
              ...Object.entries(DEPOT_LABELS).map(([code, label]) => ({
                value: code,
                label,
              })),
            ]}
          />
          <Button
            icon={<DownloadOutlined />}
            size="middle"
            onClick={() => {
              exportFleetCsv(filtered, period);
              message.success("CSV export downloaded");
            }}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table<Bus>
        columns={columns}
        dataSource={filtered}
        rowKey="bus_id"
        size="small"
        pagination={{ pageSize: 25, showSizeChanger: false, showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} buses` }}
        onRow={(bus) => ({
          onClick: () => setSelectedBusId(bus.bus_id),
          style: {
            cursor: "pointer",
            opacity: bus.maintenanceStatus === "maintenance" ? 0.5 : 1,
          },
        })}
        locale={{ emptyText: "No buses match the current filters" }}
        scroll={{ x: 1000 }}
        style={{ borderRadius: 8 }}
      />
    </div>
  );
}
