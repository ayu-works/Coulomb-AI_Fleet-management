import { rawBusData } from "./bus-data";
import { toBus, computeDepotStats } from "@/lib/calculations";

// 5 buses under maintenance — one per depot spread across fleet
const MAINTENANCE_BUS_IDS = new Set([
  "BLR-011", // KBS — older bus
  "BLR-049", // SBC
  "BLR-081", // BTM
  "BLR-154", // YPR — oldest in fleet
  "BLR-188", // ELC
]);

// Simulate some degraded buses for Moderate and Critical tiers
const SOH_OVERRIDES: Record<string, number> = {
  // Critical (<75%)
  "BLR-015": 72.1,   // KBS — oldest, heavily degraded
  "BLR-037": 70.8,   // KBS — near EOL
  "BLR-167": 73.5,   // YPR — old fleet
  // Moderate (75–84%)
  "BLR-014": 78.2,   // KBS
  "BLR-032": 80.4,   // KBS
  "BLR-064": 76.9,   // SBC
  "BLR-097": 82.1,   // BTM
  "BLR-159": 79.3,   // YPR
  "BLR-176": 75.8,   // YPR
  "BLR-184": 83.5,   // ELC
};

/** All 200 buses with derived metrics */
export const buses = rawBusData.map((raw) => {
  // Apply SOH overrides before computing derived metrics
  const adjusted = SOH_OVERRIDES[raw.bus_id] != null
    ? { ...raw, soh_pct: SOH_OVERRIDES[raw.bus_id] }
    : raw;
  const bus = toBus(adjusted);
  if (MAINTENANCE_BUS_IDS.has(raw.bus_id)) {
    bus.maintenanceStatus = "maintenance";
    bus.km_per_day = 0;
  }
  return bus;
});

/** Depot-level aggregate stats — maintenance buses excluded from utilisation averages */
export const depotStats = computeDepotStats(
  buses.filter((b) => b.maintenanceStatus === "active")
);
