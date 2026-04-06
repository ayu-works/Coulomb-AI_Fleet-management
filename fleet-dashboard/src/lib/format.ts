/**
 * Canonical INR formatter used across the entire app.
 *
 * Rules:
 *  - ≥ 1 Cr  → ₹X.XXCr   (2 decimal places)
 *  - ≥ 1 L   → ₹X.XL     (1 decimal place)
 *  - ≥ 1 K   → ₹X.XK     (1 decimal place)
 *  - < 1 K   → ₹X        (integer)
 *
 * Negative values get a leading minus sign.
 * The ₹ symbol is always included.
 */
export function formatInr(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

/**
 * Compact axis formatter (slightly shorter for chart tick labels).
 * Same rules as formatInr but 1 decimal for Cr.
 */
export function formatInrAxis(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(0)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}
