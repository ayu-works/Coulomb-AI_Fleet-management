# Coulomb AI Fleet Dashboard — Session Memory

## Project Overview
UX prototype for an EV fleet financial health dashboard. Bengaluru BMTC-style city electric buses — 200 buses across 6 depots (KBS, SBC, BTM, WHF, YPR, ELC). Battery: 300 kWh, ₹20L acquisition value.

**Persona:** Rajan Murthy, Fleet Operations Manager — needs 30-second reads, plain language, color coding, desktop browser.

## Tech Stack
- Next.js 16.2.2 (App Router, Turbopack)
- Ant Design 5 + @ant-design/icons (migrated FROM shadcn/ui + Lucide)
- Recharts for all charts
- Tailwind CSS 4 (layout only) + CSS custom properties for theming
- Inter font (body) + JetBrains Mono (numbers)
- Light/dark toggle via ThemeProvider + CSS variables + antd ConfigProvider

## Reference Files (parent dir)
- `coloumb_ai_project_brief.md` — full product brief, persona, data schema
- `blr_fleet_200.csv` — raw fleet data (200 buses)
- `ev_fleet_dashboard (1).html` — reference HTML with target warm-dark color scheme
- `Initial protoype1.png` / `Initial protoype2.png` — design screenshots
- `chip reference.png` — filter pill design
- `image copy.png` — chart heading style reference

---

## Architecture & File Map

### Data Layer (DO NOT MODIFY — business logic)
- `src/lib/types.ts` — Bus, BusRaw, BusDerived, DepotCode, DepotStats, Period ("daily"|"weekly"|"monthly"|"all"), HealthTier, Alert, OutlierFlag
- `src/lib/calculations.ts` — pure functions: deriveBusMetrics, healthTier, computeDepotStats, detectOutliers, generateAlerts, computeFleetKpis, computeBenchmarks
- `src/lib/dashboard-context.tsx` — React Context: depot/period filters, filteredBuses, kpis, alerts, selectedBusId
- `src/lib/chart-data.ts` — chart data generators: generatePnlTrend (period-aware, includes depreciation + cumulative P&L), computeSohDistribution, computeDepotComparison, generateDepreciationCurve
- `src/lib/format.ts` — formatInr (₹X.XL / ₹X.XXCr), formatInrAxis
- `src/lib/export.ts` — exportFleetCsv (browser download)
- `src/lib/theme-context.tsx` — ThemeProvider (light/dark), persists to localStorage
- `src/lib/chart-theme.ts` — getChartColors() returns theme-aware chart color tokens
- `src/data/bus-data.ts` — 200 buses typed array (generated from CSV)
- `src/data/fleet-data.ts` — enriched buses + depotStats, includes 5 maintenance buses + 10 SOH overrides (3 critical, 7 moderate)

### App Shell
- `src/app/layout.tsx` — Inter + JetBrains Mono fonts, ThemeProvider → AntdProvider wrapper
- `src/app/antd-provider.tsx` — ConfigProvider with dynamic light/dark theme based on ThemeContext
- `src/app/globals.css` — CSS variables for both themes via [data-theme="light"] and [data-theme="dark"], antd overrides for rounded inputs/selects
- `src/app/page.tsx` — DashboardProvider → TopNav → KPIs → Section dividers → Charts → Widgets → Fleet Table → Bus Detail Panel

### Components
- `top-nav.tsx` — sticky header: bus search, depot select, period select, theme toggle (Sun/Moon), alert badge
- `kpi-cards.tsx` — 5 KPI cards with 2px colored top borders, Last Updated label
- `section-divider.tsx` — "──── TITLE ────" style dividers
- `charts/charts-section.tsx` — layout for 5 charts in 2 rows
- `charts/pnl-bar-chart.tsx` — grouped bar: Revenue vs Cost+Depreciation vs Net P&L per month (period-aware x-axis)
- `charts/pnl-trend-chart.tsx` — cumulative P&L (green/red area) + cumulative revenue & cost (white lines)
- `charts/soh-distribution-chart.tsx` — horizontal bars by SOH band
- `charts/depreciation-curve-chart.tsx` — dual Y-axis: asset value line + depr rate dashed line
- `charts/depot-comparison-chart.tsx` — grouped bars by depot, clickable to filter
- `top-attention.tsx` — Top 5 Need Attention widget
- `star-performers.tsx` — Star Performers widget
- `comparison-widget.tsx` — Compare 2 buses with metric tag chips
- `fleet-table.tsx` — antd Table: sort, filter pills (rounded chips), depot filter, search, CSV export, SOH bars, status tags, outlier icons, row click → panel
- `bus-detail-panel.tsx` — antd Drawer: 7 sections (header, battery health SOH ring, utilisation, financials, benchmarking bullet bars, outlier flags, PDF export). USER LIKES THIS — keep structure.
- `skeletons.tsx` — loading states for KPIs, charts, table

### P&L Formula
`Net P&L = Revenue - (Operating Cost + Depreciation)`

---

## Design Feedback & Preferences

### Keep the side panel
The bus detail drawer (7 sections) is the one thing the user explicitly likes. Never restructure — re-skin only.

### Color palette from reference HTML
Colors match `ev_fleet_dashboard (1).html` — warm-dark palette. All colors are CSS variables now. Dark: #0e0f11 bg, #1a1c20 cards, #e8e6e0 text. Light: #f5f5f7 bg, #ffffff cards, #1a1c20 text.

### Chip/pill filter style
Rounded pills (border-radius: 20px) for health tier filters, NOT antd Segmented. See `chip reference.png`.

### Widget headings inside cards
Titles inside card body (bold title + gray subtitle), NOT using antd Card `title` prop. See `image copy.png`.

### Input/select styling
Rounded (border-radius: 20px) matching reference. CSS overrides in globals.css.

### Chart text readability
Axis labels bumped to #8a8780 (dark) / #7a7770 (light) for readability.

### P&L chart is bar, not line
P&L breakdown = grouped bar chart per period. Separate cumulative trend line chart.

### Cumulative P&L coloring
Green area if growing, red if declining. Revenue and cost as white/gray context lines.

### No deprecated antd components
Replaced antd List with plain divs. Drawer uses `styles.wrapper.width` not `width` prop.

---

## User Profile — Ayush
- Building UX prototype for Coulomb AI (EV fleet management)
- Strong design opinions — provides reference images, expects exact color/style matching
- Iterates quickly — small targeted requests, fast turnaround
- Cares about console warnings
- Prefers dark theme but wants light/dark toggle
- Provides PNGs more than written specs — always check project root for reference images
