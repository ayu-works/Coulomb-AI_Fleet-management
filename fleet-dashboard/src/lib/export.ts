import type { Bus, Period } from "./types";
import { healthTier } from "./calculations";

export function exportFleetCsv(buses: Bus[], period: Period) {
  const mult = { daily: 1, weekly: 7, monthly: 30, all: 365 }[period];
  const headers = [
    "Bus ID", "Depot", "Route Zone", "Age (months)", "SOH %",
    "km/day", "Odometer (km)", "Revenue", "Op. Cost", "Net P&L",
    "P&L/km", "Asset Value", "Status",
  ];

  const rows = buses.map((b) => {
    const status = b.maintenanceStatus === "maintenance" ? "Maintenance" : healthTier(b.soh_pct);
    return [
      b.bus_id, b.depot, b.route_zone, b.age_months, b.soh_pct.toFixed(1),
      b.km_per_day, b.odometer_km,
      (b.revenueDaily * mult).toFixed(0),
      (b.operatingCostDaily * mult).toFixed(0),
      (b.netPnlDaily * mult).toFixed(0),
      b.pnlPerKm.toFixed(2),
      b.currentAssetValueInr.toFixed(0),
      status,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fleet_data_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
