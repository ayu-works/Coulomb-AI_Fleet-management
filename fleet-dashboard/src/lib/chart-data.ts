import type { Bus, DepotCode } from "./types";
import { currentAssetValue } from "./calculations";
export { formatInrAxis } from "./format";

// ──────────────────────────────────────────────
// 1. P&L vs Asset Depreciation — 12-month trend
// ──────────────────────────────────────────────

export interface PnlTrendPoint {
  month: string;
  revenue: number;
  operatingCost: number;
  depreciation: number;
  totalCost: number;        // operatingCost + depreciation
  netPnl: number;           // revenue - totalCost
  assetValue: number;
  cumulativePnl: number;    // running total of netPnl
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type PeriodType = "daily" | "weekly" | "monthly" | "all";

/**
 * Generate P&L data points with x-axis labels matching the selected period:
 * - daily: last 30 days (Day 1 → Day 30)
 * - weekly: last 12 weeks (W1 → W12)
 * - monthly / all: last 12 months (May 25 → Apr 26)
 */
export function generatePnlTrend(buses: Bus[], period: PeriodType = "monthly"): PnlTrendPoint[] {
  if (buses.length === 0) return [];

  const activeBuses = buses.filter((b) => b.maintenanceStatus === "active");
  const baseRevDaily = activeBuses.reduce((s, b) => s + b.revenueDaily, 0);
  const baseCostDaily = activeBuses.reduce((s, b) => s + b.operatingCostDaily, 0);
  const baseAssetValue = buses.reduce((s, b) => s + b.currentAssetValueInr, 0);

  // Determine number of buckets and days per bucket
  let buckets: number;
  let daysPerBucket: number;
  let labelFn: (i: number) => string;

  if (period === "daily") {
    buckets = 30;
    daysPerBucket = 1;
    labelFn = (i) => `Day ${i + 1}`;
  } else if (period === "weekly") {
    buckets = 12;
    daysPerBucket = 7;
    labelFn = (i) => `W${i + 1}`;
  } else {
    // monthly and all
    buckets = 12;
    daysPerBucket = 30;
    const startYear = 2025;
    const startMonth = 4;
    labelFn = (i) => {
      const mIdx = (startMonth + i) % 12;
      const year = startYear + Math.floor((startMonth + i) / 12);
      return `${MONTH_NAMES[mIdx]} ${String(year).slice(2)}`;
    };
  }

  const rng = seededRandom(42);
  const points: PnlTrendPoint[] = [];
  let cumulativePnl = 0;
  const lastBucket = buckets - 1 || 1;

  for (let i = 0; i < buckets; i++) {
    const progress = i / lastBucket; // 0 → 1

    // Revenue grows ~15% with jitter
    const revGrowth = 0.85 + 0.15 * progress;
    const revJitter = 1 + (rng() - 0.5) * 0.16;
    // Costs grow ~18%
    const costGrowth = 0.82 + 0.18 * progress;
    const costJitter = 1 + (rng() - 0.5) * 0.12;

    const bucketRev = baseRevDaily * daysPerBucket * revGrowth * revJitter;
    const bucketCost = baseCostDaily * daysPerBucket * costGrowth * costJitter;

    // Asset depreciation spread across buckets
    const assetDecay = 1 - 0.06 * progress;
    const assetVal = baseAssetValue * assetDecay;
    const prevDecay = i === 0 ? 1 : 1 - 0.06 * ((i - 1) / lastBucket);
    const bucketDepr = baseAssetValue * (prevDecay - assetDecay);
    const totalCost = bucketCost + bucketDepr;
    const netPnl = bucketRev - totalCost;
    cumulativePnl += netPnl;

    points.push({
      month: labelFn(i),
      revenue: Math.round(bucketRev),
      operatingCost: Math.round(bucketCost),
      depreciation: Math.round(bucketDepr),
      totalCost: Math.round(totalCost),
      netPnl: Math.round(netPnl),
      assetValue: Math.round(assetVal),
      cumulativePnl: Math.round(cumulativePnl),
    });
  }

  return points;
}

// ──────────────────────────────────────────────
// 2. SOH Distribution — bucket buses into bands
// ──────────────────────────────────────────────

export interface SohBand {
  band: string;
  count: number;
  fill: string;
}

const SOH_BANDS: { label: string; min: number; max: number; fill: string }[] = [
  { label: "95–100%", min: 95, max: 100.1, fill: "#2ecc8a" },
  { label: "90–94%", min: 90, max: 95, fill: "#4edd9f" },
  { label: "85–89%", min: 85, max: 90, fill: "#f0a832" },
  { label: "80–84%", min: 80, max: 85, fill: "#e8932a" },
  { label: "75–79%", min: 75, max: 80, fill: "#e07050" },
  { label: "70–74%", min: 70, max: 75, fill: "#e05555" },
];

export function computeSohDistribution(buses: Bus[]): SohBand[] {
  return SOH_BANDS.map(({ label, min, max, fill }) => ({
    band: label,
    count: buses.filter((b) => b.soh_pct >= min && b.soh_pct < max).length,
    fill,
  }));
}

// ──────────────────────────────────────────────
// 3. Revenue vs Operating Cost by depot
// ──────────────────────────────────────────────

export interface DepotComparison {
  depot: DepotCode;
  revenue: number;
  operatingCost: number;
  netPnl: number;
}

const DEPOT_ORDER: DepotCode[] = ["KBS", "SBC", "BTM", "WHF", "YPR", "ELC"];

export function computeDepotComparison(
  buses: Bus[],
  periodDays: number
): DepotComparison[] {
  const map = new Map<DepotCode, { rev: number; cost: number }>();
  for (const d of DEPOT_ORDER) map.set(d, { rev: 0, cost: 0 });

  for (const b of buses) {
    const entry = map.get(b.depot);
    if (!entry) continue;
    entry.rev += b.revenueDaily * periodDays;
    entry.cost += b.operatingCostDaily * periodDays;
  }

  return DEPOT_ORDER.map((depot) => {
    const e = map.get(depot)!;
    return {
      depot,
      revenue: Math.round(e.rev),
      operatingCost: Math.round(e.cost),
      netPnl: Math.round(e.rev - e.cost),
    };
  }).filter((d) => d.revenue > 0 || d.operatingCost > 0);
}

// ──────────────────────────────────────────────
// 4. Depreciation Curve — matches reference HTML
//    Dual Y-axis: asset value (₹L) + depr rate (₹L)
// ──────────────────────────────────────────────

export interface DepreciationCurvePoint {
  sohLabel: string;
  assetValueL: number;   // in lakhs
  deprRateL: number;     // drop from previous point in lakhs
}

const INIT_VAL = 2_000_000;

export function generateDepreciationCurve(): DepreciationCurvePoint[] {
  const sohPoints = [100, 97, 94, 91, 88, 85, 82, 79, 76, 73, 70];
  const vals = sohPoints.map((s) => {
    const f = (100 - s) / 30;
    return +(INIT_VAL * (1 - f * 0.9) / 100000).toFixed(1);
  });
  return sohPoints.map((s, i) => ({
    sohLabel: `${s}%`,
    assetValueL: vals[i],
    deprRateL: i === 0 ? 0 : +(vals[i - 1] - vals[i]).toFixed(2),
  }));
}
