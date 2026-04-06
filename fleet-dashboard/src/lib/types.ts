// --- Raw bus data (matches CSV schema) ---

export interface BusRaw {
  bus_id: string;
  depot: DepotCode;
  route_zone: string;
  age_months: number;
  soh_pct: number;
  battery_capacity_kwh: number; // always 300
  km_per_day: number;
  odometer_km: number;
  energy_consumption_per_km: number; // kWh/km
  revenue_per_km: number; // INR/km
  price_per_kwh: number; // INR/kWh charged
  initial_asset_value_inr: number; // always 2_000_000
}

// --- Depot codes ---

export type DepotCode = "KBS" | "SBC" | "BTM" | "WHF" | "YPR" | "ELC";

export const DEPOT_LABELS: Record<DepotCode, string> = {
  KBS: "Central (KBS)",
  SBC: "North (SBC)",
  BTM: "South (BTM)",
  WHF: "East – Whitefield (WHF)",
  YPR: "Northwest – Yeshwantpur (YPR)",
  ELC: "South Corridor – Electronic City (ELC)",
};

// --- Health tier ---

export type HealthTier = "Healthy" | "Moderate" | "Critical";

// --- Period multiplier for revenue / cost calculations ---

export type Period = "daily" | "weekly" | "monthly" | "all";

export const PERIOD_DAYS: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  all: 365,
};

// --- Derived metrics (computed from BusRaw) ---

export interface BusDerived {
  effectiveBatteryCapacityKwh: number;
  currentAssetValueInr: number;
  depreciationInr: number;
  sohDropRatePerMonth: number;
  projectedMonthsToEol: number | null; // null if drop rate is 0
  revenueDaily: number;
  operatingCostDaily: number;
  netPnlDaily: number;
  pnlPerKm: number;
}

// --- Maintenance status ---

export type MaintenanceStatus = "active" | "maintenance";

// --- Full bus record: raw + derived ---

export interface Bus extends BusRaw, BusDerived {
  maintenanceStatus: MaintenanceStatus;
}

// --- Display status (combines health tier + maintenance) ---

export type DisplayStatus = HealthTier | "Maintenance";

// --- Outlier flags ---

export type OutlierType =
  | "fast_degrader"
  | "underperformer"
  | "revenue_poor"
  | "cost_heavy"
  | "underutilised"
  | "star_performer"
  | "efficient_mover"
  | "revenue_efficient";

export interface OutlierFlag {
  type: OutlierType;
  direction: "bad" | "good";
  label: string;
}

// --- Alert types ---

export type AlertSeverity = "high" | "medium";

export interface Alert {
  busId: string;
  type: string;
  message: string;
  severity: AlertSeverity;
}

// --- Depot aggregate (for benchmarking) ---

export interface DepotStats {
  depot: DepotCode;
  busCount: number;
  avgSohPct: number;
  avgKmPerDay: number;
  avgRevenuePerKm: number;
  avgOperatingCostPerKm: number;
  avgPnlPerKm: number;
  avgSohDropRate: number;
  totalRevenue: number;
  totalOperatingCost: number;
  totalNetPnl: number;
  totalAssetValue: number;
}
