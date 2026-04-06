/** Chart color tokens that adapt to theme via CSS variables */
export function getChartColors() {
  if (typeof window === "undefined") return DARK; // SSR fallback
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return isDark ? DARK : LIGHT;
}

export const DARK = {
  grid: "rgba(255,255,255,0.04)",
  axisLine: "rgba(255,255,255,0.07)",
  tickText: "#8a8780",
  tickTextAlt: "#9a9790",
  tooltipBg: "#1a1c20",
  tooltipBorder: "rgba(255,255,255,0.12)",
  tooltipLabel: "#9a9790",
  legendText: "#9a9790",
  cursor: "rgba(255,255,255,0.06)",
  refLine: "rgba(255,255,255,0.12)",
  trendLine1: "rgba(232,230,224,0.5)",
  trendLine2: "rgba(232,230,224,0.3)",
  activeDot: "#e8e6e0",
};

export const LIGHT = {
  grid: "rgba(0,0,0,0.06)",
  axisLine: "rgba(0,0,0,0.1)",
  tickText: "#7a7770",
  tickTextAlt: "#6b6966",
  tooltipBg: "#ffffff",
  tooltipBorder: "rgba(0,0,0,0.12)",
  tooltipLabel: "#6b6966",
  legendText: "#6b6966",
  cursor: "rgba(0,0,0,0.04)",
  refLine: "rgba(0,0,0,0.1)",
  trendLine1: "rgba(30,30,30,0.4)",
  trendLine2: "rgba(30,30,30,0.25)",
  activeDot: "#1a1c20",
};
