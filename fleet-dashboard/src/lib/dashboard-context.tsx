"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import type { Bus, DepotCode, Period, DepotStats, Alert } from "./types";
import {
  computeDepotStats,
  computeFleetKpis,
  generateAlerts,
  type FleetKpis,
} from "./calculations";
import { buses as allBuses, depotStats as allDepotStats } from "@/data/fleet-data";

interface DashboardState {
  depot: DepotCode | "ALL";
  setDepot: (d: DepotCode | "ALL") => void;
  period: Period;
  setPeriod: (p: Period) => void;
  filteredBuses: Bus[];
  depotStatsMap: Map<DepotCode, DepotStats>;
  kpis: FleetKpis;
  alerts: Alert[];
  highAlertCount: number;
  selectedBusId: string | null;
  setSelectedBusId: (id: string | null) => void;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [depot, setDepot] = useState<DepotCode | "ALL">("ALL");
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  const filteredBuses = useMemo(
    () => (depot === "ALL" ? allBuses : allBuses.filter((b) => b.depot === depot)),
    [depot]
  );

  const depotStatsMap = useMemo(
    () => (depot === "ALL" ? allDepotStats : computeDepotStats(filteredBuses)),
    [depot, filteredBuses]
  );

  const kpis = useMemo(
    () => computeFleetKpis(filteredBuses, period),
    [filteredBuses, period]
  );

  const alerts = useMemo(() => {
    const all: Alert[] = [];
    for (const bus of filteredBuses) {
      const ds = allDepotStats.get(bus.depot);
      if (ds) all.push(...generateAlerts(bus, ds));
    }
    // Sort: high first, then medium
    all.sort((a, b) => {
      if (a.severity === b.severity) return 0;
      return a.severity === "high" ? -1 : 1;
    });
    return all;
  }, [filteredBuses]);

  const highAlertCount = useMemo(
    () => alerts.filter((a) => a.severity === "high").length,
    [alerts]
  );

  return (
    <DashboardContext.Provider
      value={{
        depot,
        setDepot,
        period,
        setPeriod,
        filteredBuses,
        depotStatsMap,
        kpis,
        alerts,
        highAlertCount,
        selectedBusId,
        setSelectedBusId,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be inside DashboardProvider");
  return ctx;
}
