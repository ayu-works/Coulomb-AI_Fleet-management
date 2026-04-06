"use client";

import { Select, Badge, Button, Tooltip, Space, Typography, Switch } from "antd";
import { ThunderboltFilled, BellOutlined, SearchOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import { useTheme } from "@/lib/theme-context";
import { DEPOT_LABELS, type DepotCode, type Period } from "@/lib/types";
import { buses as allBuses } from "@/data/fleet-data";

const { Text } = Typography;

const DEPOT_OPTIONS = [
  { value: "ALL", label: "All Depots" },
  ...Object.entries(DEPOT_LABELS).map(([code, label]) => ({ value: code, label })),
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "all", label: "All Time" },
];

export function TopNav() {
  const { depot, setDepot, period, setPeriod, highAlertCount, setSelectedBusId } = useDashboard();
  const { theme, toggleTheme } = useTheme();

  const busOptions = allBuses.map((b) => ({
    value: b.bus_id,
    label: `${b.bus_id} — ${b.depot} · ${b.route_zone}`,
  }));

  return (
    <div
      className="sticky top-0 z-40 flex h-14 items-center justify-between px-6"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}
    >
      <Space align="center" size={10}>
        <ThunderboltFilled style={{ color: "#f0a832", fontSize: 18 }} />
        <Text strong style={{ fontSize: 15, color: "var(--text)" }}>Coulomb AI</Text>
        <Text style={{ fontSize: 12, color: "var(--text4)" }}>Fleet Dashboard</Text>
      </Space>

      <Space size={10}>
        <Select
          showSearch placeholder="Search bus ID, depot..." options={busOptions}
          filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          onSelect={(v) => setSelectedBusId(v)}
          suffixIcon={<SearchOutlined style={{ color: "var(--text4)" }} />}
          allowClear style={{ minWidth: 220 }} popupMatchSelectWidth={false} size="middle"
        />
        <Select value={depot} onChange={(v) => setDepot(v as DepotCode | "ALL")} options={DEPOT_OPTIONS} style={{ minWidth: 140 }} popupMatchSelectWidth={false} size="middle" />
        <Select value={period} onChange={(v) => setPeriod(v as Period)} options={PERIOD_OPTIONS} style={{ minWidth: 120 }} size="middle" />

        {/* Theme toggle */}
        <Tooltip title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
          <Button
            type="text"
            icon={theme === "dark" ? <SunOutlined style={{ fontSize: 16 }} /> : <MoonOutlined style={{ fontSize: 16 }} />}
            onClick={toggleTheme}
            size="middle"
          />
        </Tooltip>

        <Tooltip title={`${highAlertCount} high-severity alerts`}>
          <Badge count={highAlertCount} size="small" offset={[-2, 2]}>
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18, color: "var(--text2)" }} />} size="middle" />
          </Badge>
        </Tooltip>
      </Space>
    </div>
  );
}
