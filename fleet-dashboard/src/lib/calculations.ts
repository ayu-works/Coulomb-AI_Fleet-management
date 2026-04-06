import type {
  BusRaw,
  Bus,
  BusDerived,
  DepotCode,
  DepotStats,
  HealthTier,
  OutlierFlag,
  Alert,
  Period,
  PERIOD_DAYS,
} from "./types";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const NOMINAL_CAPACITY_KWH = 300;
const INITIAL_ASSET_VALUE = 2_000_000; // ₹20,00,000
const SOH_NEW = 100;
const SOH_EOL = 70; // replacement threshold
const SOH_RANGE = SOH_NEW - SOH_EOL; // 30 percentage-points of useful life

// ──────────────────────────────────────────────
// Per-bus derived metric calculations (pure)
// ──────────────────────────────────────────────

/** Effective battery capacity = nominal × (SOH / 100) */
export function effectiveBatteryCapacity(sohPct: number): number {
  return NOMINAL_CAPACITY_KWH * (sohPct / 100);
}

/**
 * Current asset value based on SOH.
 * Linear from ₹20L at SOH 100% → ₹0 at SOH 70%.
 * Clamped: value cannot go below 0 or above initial.
 */
export function currentAssetValue(sohPct: number): number {
  const fraction = Math.max(0, Math.min((sohPct - SOH_EOL) / SOH_RANGE, 1));
  return INITIAL_ASSET_VALUE * fraction;
}

/** Depreciation = initial value − current value */
export function depreciation(sohPct: number): number {
  return INITIAL_ASSET_VALUE - currentAssetValue(sohPct);
}

/**
 * SOH drop rate per month.
 * Simple linear: (100 − current SOH) / age_months.
 * Returns 0 if age is 0.
 */
export function sohDropRatePerMonth(sohPct: number, ageMonths: number): number {
  if (ageMonths <= 0) return 0;
  return (SOH_NEW - sohPct) / ageMonths;
}

/**
 * Projected months until SOH hits 70% (EOL).
 * = (SOH − 70) / monthly drop rate.
 * Returns null if drop rate is 0 (no degradation observed).
 */
export function projectedMonthsToEol(
  sohPct: number,
  ageMonths: number
): number | null {
  const rate = sohDropRatePerMonth(sohPct, ageMonths);
  if (rate <= 0) return null;
  return (sohPct - SOH_EOL) / rate;
}

/** Daily revenue = km/day × revenue/km */
export function revenueDaily(kmPerDay: number, revenuePerKm: number): number {
  return kmPerDay * revenuePerKm;
}

/** Daily operating cost = km/day × energy/km × price/kWh */
export function operatingCostDaily(
  kmPerDay: number,
  energyPerKm: number,
  pricePerKwh: number
): number {
  return kmPerDay * energyPerKm * pricePerKwh;
}

/** Net P&L = revenue − operating cost */
export function netPnl(revenue: number, opCost: number): number {
  return revenue - opCost;
}

/** P&L per km = net P&L / km driven. Returns 0 if km is 0. */
export function pnlPerKm(netPnlValue: number, km: number): number {
  if (km <= 0) return 0;
  return netPnlValue / km;
}

// ──────────────────────────────────────────────
// Compose all derived metrics for one bus
// ──────────────────────────────────────────────

export function deriveBusMetrics(raw: BusRaw): BusDerived {
  const cap = effectiveBatteryCapacity(raw.soh_pct);
  const assetVal = currentAssetValue(raw.soh_pct);
  const dep = depreciation(raw.soh_pct);
  const dropRate = sohDropRatePerMonth(raw.soh_pct, raw.age_months);
  const eol = projectedMonthsToEol(raw.soh_pct, raw.age_months);
  const rev = revenueDaily(raw.km_per_day, raw.revenue_per_km);
  const cost = operatingCostDaily(
    raw.km_per_day,
    raw.energy_consumption_per_km,
    raw.price_per_kwh
  );
  const pnl = netPnl(rev, cost);
  const pnlKm = pnlPerKm(pnl, raw.km_per_day);

  return {
    effectiveBatteryCapacityKwh: cap,
    currentAssetValueInr: assetVal,
    depreciationInr: dep,
    sohDropRatePerMonth: dropRate,
    projectedMonthsToEol: eol,
    revenueDaily: rev,
    operatingCostDaily: cost,
    netPnlDaily: pnl,
    pnlPerKm: pnlKm,
  };
}

/** Combine raw + derived into a full Bus record */
export function toBus(raw: BusRaw): Bus {
  return { ...raw, ...deriveBusMetrics(raw), maintenanceStatus: "active" };
}

// ──────────────────────────────────────────────
// Period scaling
// ──────────────────────────────────────────────

export function scaleToperiod(dailyValue: number, period: Period): number {
  const days: Record<Period, number> = { daily: 1, weekly: 7, monthly: 30, all: 365 };
  return dailyValue * days[period];
}

// ──────────────────────────────────────────────
// Health tier classification
// ──────────────────────────────────────────────

export function healthTier(sohPct: number): HealthTier {
  if (sohPct >= 85) return "Healthy";
  if (sohPct >= 75) return "Moderate";
  return "Critical";
}

// ──────────────────────────────────────────────
// Depot-level aggregates
// ──────────────────────────────────────────────

export function computeDepotStats(buses: Bus[]): Map<DepotCode, DepotStats> {
  const map = new Map<DepotCode, DepotStats>();

  // Group buses by depot
  const grouped = new Map<DepotCode, Bus[]>();
  for (const b of buses) {
    const arr = grouped.get(b.depot) ?? [];
    arr.push(b);
    grouped.set(b.depot, arr);
  }

  for (const [depot, depotBuses] of grouped) {
    const n = depotBuses.length;
    const totalRev = depotBuses.reduce((s, b) => s + b.revenueDaily, 0);
    const totalCost = depotBuses.reduce((s, b) => s + b.operatingCostDaily, 0);
    const totalPnl = totalRev - totalCost;
    const totalAsset = depotBuses.reduce(
      (s, b) => s + b.currentAssetValueInr,
      0
    );
    const avgSoh = depotBuses.reduce((s, b) => s + b.soh_pct, 0) / n;
    const avgKm = depotBuses.reduce((s, b) => s + b.km_per_day, 0) / n;
    const avgRevPerKm =
      depotBuses.reduce((s, b) => s + b.revenue_per_km, 0) / n;
    const avgOpCostPerKm =
      depotBuses.reduce(
        (s, b) => s + b.energy_consumption_per_km * b.price_per_kwh,
        0
      ) / n;
    const avgPnlPerKm = depotBuses.reduce((s, b) => s + b.pnlPerKm, 0) / n;
    const avgDropRate =
      depotBuses.reduce((s, b) => s + b.sohDropRatePerMonth, 0) / n;

    map.set(depot, {
      depot,
      busCount: n,
      avgSohPct: avgSoh,
      avgKmPerDay: avgKm,
      avgRevenuePerKm: avgRevPerKm,
      avgOperatingCostPerKm: avgOpCostPerKm,
      avgPnlPerKm: avgPnlPerKm,
      avgSohDropRate: avgDropRate,
      totalRevenue: totalRev,
      totalOperatingCost: totalCost,
      totalNetPnl: totalPnl,
      totalAssetValue: totalAsset,
    });
  }

  return map;
}

// ──────────────────────────────────────────────
// Outlier detection
// ──────────────────────────────────────────────

export function detectOutliers(
  bus: Bus,
  depotStats: DepotStats
): OutlierFlag[] {
  const flags: OutlierFlag[] = [];
  const ds = depotStats;

  // Bad outliers
  if (bus.sohDropRatePerMonth > ds.avgSohDropRate * 1.3) {
    flags.push({
      type: "fast_degrader",
      direction: "bad",
      label: "Fast degrader — SOH dropping faster than depot average",
    });
  }

  if (bus.netPnlDaily < 0 && ds.totalNetPnl / ds.busCount > 0) {
    flags.push({
      type: "underperformer",
      direction: "bad",
      label: "Underperformer — negative P&L while depot average is positive",
    });
  }

  if (
    bus.revenue_per_km < ds.avgRevenuePerKm * 0.9 &&
    bus.km_per_day >= ds.avgKmPerDay * 0.9
  ) {
    flags.push({
      type: "revenue_poor",
      direction: "bad",
      label: "Revenue-poor — low revenue despite average km",
    });
  }

  if (
    bus.energy_consumption_per_km * bus.price_per_kwh >
    ds.avgOperatingCostPerKm * 1.2
  ) {
    flags.push({
      type: "cost_heavy",
      direction: "bad",
      label: "Cost-heavy — high operating cost/km vs depot peers",
    });
  }

  if (bus.km_per_day < ds.avgKmPerDay * 0.7) {
    flags.push({
      type: "underutilised",
      direction: "bad",
      label: "Underutilised — km/day well below depot average",
    });
  }

  // Good outliers
  if (bus.pnlPerKm > ds.avgPnlPerKm * 1.2 && bus.soh_pct >= 90) {
    flags.push({
      type: "star_performer",
      direction: "good",
      label: "Star performer — high P&L per km with healthy SOH",
    });
  }

  if (
    bus.km_per_day > ds.avgKmPerDay * 1.15 &&
    bus.sohDropRatePerMonth < ds.avgSohDropRate * 0.85
  ) {
    flags.push({
      type: "efficient_mover",
      direction: "good",
      label: "Efficient mover — high km with above-average SOH retention",
    });
  }

  if (
    bus.revenue_per_km > ds.avgRevenuePerKm * 1.05 &&
    bus.energy_consumption_per_km * bus.price_per_kwh <
      ds.avgOperatingCostPerKm * 0.9
  ) {
    flags.push({
      type: "revenue_efficient",
      direction: "good",
      label: "Revenue efficient — high revenue, lower-than-average cost",
    });
  }

  return flags;
}

// ──────────────────────────────────────────────
// Alert generation
// ──────────────────────────────────────────────

export function generateAlerts(
  bus: Bus,
  depotStats: DepotStats
): Alert[] {
  const alerts: Alert[] = [];

  // Fast degrader: drop rate > 1.5× depot average
  if (bus.sohDropRatePerMonth > depotStats.avgSohDropRate * 1.5) {
    alerts.push({
      busId: bus.bus_id,
      type: "fast_degrader",
      severity: "high",
      message: `SOH dropping at ${bus.sohDropRatePerMonth.toFixed(2)}%/mo — 1.5× depot average`,
    });
  }

  // Approaching EOL: < 3 months to 70%
  if (bus.projectedMonthsToEol !== null && bus.projectedMonthsToEol < 3) {
    alerts.push({
      busId: bus.bus_id,
      type: "approaching_eol",
      severity: "high",
      message: `Only ${bus.projectedMonthsToEol.toFixed(1)} months to battery EOL (70% SOH)`,
    });
  }

  // Negative P&L
  if (bus.netPnlDaily < 0) {
    alerts.push({
      busId: bus.bus_id,
      type: "pnl_negative",
      severity: "medium",
      message: `Negative daily P&L: ₹${bus.netPnlDaily.toFixed(0)}`,
    });
  }

  // Underutilised: km/day < 60% of depot average
  if (bus.km_per_day < depotStats.avgKmPerDay * 0.6) {
    alerts.push({
      busId: bus.bus_id,
      type: "underutilised",
      severity: "medium",
      message: `km/day (${bus.km_per_day}) is below 60% of depot average (${depotStats.avgKmPerDay.toFixed(0)})`,
    });
  }

  // Cost spike: op cost/km > 1.3× depot average
  const busCostPerKm = bus.energy_consumption_per_km * bus.price_per_kwh;
  if (busCostPerKm > depotStats.avgOperatingCostPerKm * 1.3) {
    alerts.push({
      busId: bus.bus_id,
      type: "cost_spike",
      severity: "medium",
      message: `Operating cost/km ₹${busCostPerKm.toFixed(2)} exceeds 1.3× depot avg ₹${depotStats.avgOperatingCostPerKm.toFixed(2)}`,
    });
  }

  return alerts;
}

// ──────────────────────────────────────────────
// Fleet-level KPI summaries
// ──────────────────────────────────────────────

export interface FleetKpis {
  totalNetPnl: number;
  totalRevenue: number;
  totalOperatingCost: number;
  totalAssetValue: number;
  fleetAvgSoh: number;
  busCount: number;
}

// ──────────────────────────────────────────────
// Depot peer benchmarking (for side panel)
// ──────────────────────────────────────────────

export interface BenchmarkMetric {
  label: string;
  busValue: number;
  depotAvg: number;
  depotMin: number;
  depotMax: number;
  unit: string;
  higherIsBetter: boolean;
}

/**
 * Compute benchmarks for one bus against depot peers.
 * - SOH & financial metrics use ALL depot peers (incl. maintenance)
 * - Utilisation (km/day) uses only active peers
 */
export function computeBenchmarks(
  bus: Bus,
  allDepotPeers: Bus[]
): BenchmarkMetric[] {
  const activePeers = allDepotPeers.filter((b) => b.maintenanceStatus === "active");

  // SOH — all peers
  const sohValues = allDepotPeers.map((b) => b.soh_pct);
  // Financials — all peers
  const pnlValues = allDepotPeers.map((b) => b.pnlPerKm);
  const costValues = allDepotPeers.map(
    (b) => b.energy_consumption_per_km * b.price_per_kwh
  );
  // Utilisation — active only
  const kmValues = activePeers.map((b) => b.km_per_day);

  return [
    {
      label: "SOH",
      busValue: bus.soh_pct,
      depotAvg: avg(sohValues),
      depotMin: Math.min(...sohValues),
      depotMax: Math.max(...sohValues),
      unit: "%",
      higherIsBetter: true,
    },
    {
      label: "P&L/km",
      busValue: bus.pnlPerKm,
      depotAvg: avg(pnlValues),
      depotMin: Math.min(...pnlValues),
      depotMax: Math.max(...pnlValues),
      unit: "₹",
      higherIsBetter: true,
    },
    {
      label: "km/day",
      busValue: bus.km_per_day,
      depotAvg: avg(kmValues),
      depotMin: kmValues.length ? Math.min(...kmValues) : 0,
      depotMax: kmValues.length ? Math.max(...kmValues) : 0,
      unit: "",
      higherIsBetter: true,
    },
    {
      label: "Op Cost/km",
      busValue: bus.energy_consumption_per_km * bus.price_per_kwh,
      depotAvg: avg(costValues),
      depotMin: Math.min(...costValues),
      depotMax: Math.max(...costValues),
      unit: "₹",
      higherIsBetter: false,
    },
  ];
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function computeFleetKpis(buses: Bus[], period: Period): FleetKpis {
  const days: Record<Period, number> = { daily: 1, weekly: 7, monthly: 30, all: 365 };
  const mult = days[period];

  const totalRev = buses.reduce((s, b) => s + b.revenueDaily * mult, 0);
  const totalCost = buses.reduce((s, b) => s + b.operatingCostDaily * mult, 0);
  const totalAsset = buses.reduce((s, b) => s + b.currentAssetValueInr, 0);
  const avgSoh = buses.reduce((s, b) => s + b.soh_pct, 0) / buses.length;

  return {
    totalNetPnl: totalRev - totalCost,
    totalRevenue: totalRev,
    totalOperatingCost: totalCost,
    totalAssetValue: totalAsset,
    fleetAvgSoh: avgSoh,
    busCount: buses.length,
  };
}
