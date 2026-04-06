# Coloumb AI — UX Design Brief
## EV Fleet Financial Health Dashboard

---

## 1. Problem Statement

Fleet operators cannot see how battery health translates into financial performance — at the individual bus level or across the fleet — because no unified view exists today.

---

## 2. Data Inputs

### Raw signals (source data)

| Signal | Description | Notes |
|---|---|---|
| SOH | Battery degradation over time (%) | Scale: 100% (new) → 70% (end of life) |
| KM driven per day | Daily utilisation per asset | Varies by route and depot |
| Odometer | Lifetime distance covered | Cumulative km |
| Energy consumption per km | kWh consumed per km | NOT directly linked to SOH |
| Revenue per km | Earnings generated per km driven | Varies by route/zone |
| Price per unit of charging | Energy cost per kWh (₹) | Varies slightly by depot tariff zone |
| Initial asset value | Acquisition cost of the battery | Fixed at ₹20,00,000 (300 kWh pack) |

### Derived metrics (calculated)

| Metric | Formula | Notes |
|---|---|---|
| Effective battery capacity | 300 kWh × (SOH / 100) | e.g. SOH 80% = 240 kWh usable |
| Depreciation | Asset value erosion as SOH drops from 100→70 | End of life = SOH 70% |
| Revenue | km driven × revenue per km | Period-based |
| Operating cost | km driven × energy/km × price/kWh | Period-based |
| Net P&L | Revenue − Operating cost | Tracked against depreciating asset value |
| P&L per km | Net P&L / total km driven | Quality of km, not just volume |
| SOH drop rate | SOH loss per month | Compared against depot/fleet average |
| Months to EOL | (SOH − 70) / monthly drop rate | Projected end-of-life timeline |

---

## 3. Key Domain Clarifications
*(From conversation with Data Engineer)*

- **SOH is linear.** A 300 kWh battery at SOH 80% has an effective capacity of 240 kWh. The battery is replaced once SOH hits 70% — industry standard.

- **Operating cost is NOT directly SOH-dependent.** When the battery degrades, you charge for fewer kWh (the effective capacity). However, you charge more frequently. For simplicity, cost is modelled as: km × energy/km × price/kWh. Energy/km is a vehicle efficiency metric, not a battery health metric.

- **Revenue is NOT directly SOH-dependent.** Revenue is purely km driven × revenue per km. A degraded battery affects range (km achievable per charge), not the per-km rate itself.

- **Depreciation is SOH-driven.** As SOH drops, the asset loses value. The curve runs from 100% SOH (full value ₹20L) to 70% SOH (zero residual value, replacement triggered).

- **Fleet context:** Bengaluru (BMTC-style) city electric buses. Fixed battery: 300 kWh, ₹20,00,000 acquisition value. 200 buses across 6 depots.

---

## 4. Fleet Configuration

### Depot map — Bengaluru

| Depot Code | Zone | Buses | Avg km/day | Revenue/km (₹) | Notes |
|---|---|---|---|---|---|
| KBS | Central | 40 | 180 | 9.2 | Oldest fleet, most stop-start, fastest SOH drop |
| SBC | North | 35 | 160 | 8.8 | Mixed age fleet |
| BTM | South | 35 | 140 | 8.5 | Shorter routes, lower utilisation |
| WHF | East (Whitefield) | 38 | 200 | 9.8 | IT corridor, longer routes, newer fleet |
| YPR | Northwest (Yeshwantpur) | 30 | 150 | 8.3 | Older fleet, medium utilisation |
| ELC | South Corridor (Electronic City) | 22 | 220 | 10.2 | Longest routes, highest revenue/km, newest fleet |

### Bus data schema (per asset)

```
bus_id                      — Unique identifier e.g. BLR-001
depot                       — Depot code
route_zone                  — Human-readable zone name
age_months                  — Months in service
soh_pct                     — Current SOH (%)
battery_capacity_kwh        — Fixed 300 kWh (nominal)
km_per_day                  — Average daily km driven
odometer_km                 — Lifetime km covered
energy_consumption_per_km   — kWh per km (vehicle efficiency)
revenue_per_km              — ₹ earned per km
price_per_kwh               — ₹ per kWh charged
initial_asset_value_inr     — ₹20,00,000 fixed
```

---

## 5. User — Fleet Manager Persona

**Name:** Rajan Murthy
**Role:** Fleet Operations Manager, Bengaluru North & Central Depots
**Manages:** ~75 buses across KBS and SBC depots
**Experience:** 14 years in fleet ops, 3 years with EV fleets

### Day in the life
Rajan starts at 6am before the first bus leaves the depot. His mornings are about making sure buses are charged, drivers are assigned, and nothing is flagged red. By 9am he's at his desk — a shared office with one monitor. Afternoons involve depot walkabouts, driver briefings, and paperwork. He reports to a regional ops head weekly and to the finance team monthly.

### Current workarounds
He tracks SOH and km data in a vendor-provided telematics app that shows raw numbers. P&L is done manually by his supervisor in Excel once a month. He finds out about a battery problem either from the driver, or when the range drops visibly. He has no way to see which buses are underperforming financially until month-end.

### Goals
- Know at a glance which buses need attention today
- Spot buses that are degrading faster than expected before it becomes a field problem
- Justify battery replacement decisions to finance with data, not gut feel
- Understand if a route/zone is structurally less profitable

### Frustrations
- Too much raw data, not enough signal — he doesn't need 40 metrics, he needs the 3 that are off
- Month-end financial reports are too late to act on
- No way to compare buses against each other — he can't tell if a bus is bad or if the whole depot is bad

### Device & context
- Desktop browser, office environment
- Not a data person — needs clear labels, plain language, colour coding
- Shares screens with his supervisor during weekly reviews
- Occasionally pulls it up on a tablet during depot walkthroughs

### What success looks like for Rajan
> "I open this on Monday morning and in 30 seconds I know which buses I need to deal with this week — and why."

---

## 6. Dashboard Requirements

### 6.1 Fleet Overview (landing screen)

**Purpose:** Give Rajan the 30-second read on fleet health.

#### Summary KPIs
- Total Net P&L (period)
- Total Revenue (period)
- Total Operating Cost (period)
- Total Asset Value (current, depreciation-adjusted)
- Fleet Average SOH (%)

#### Outlier surface — the most important feature
The fleet table must make outliers immediately visible — both bad and good.

| Outlier type | Signal | Direction |
|---|---|---|
| Fast degrader | SOH drop rate > depot average | Bad |
| Underperformer | P&L negative while depot avg is positive | Bad |
| Revenue-poor | Low revenue despite average or high km (route issue) | Bad |
| Cost-heavy | High operating cost/km vs depot peers | Bad |
| Underutilised | km/day significantly below depot average | Bad |
| Star performer | High P&L per km + healthy SOH | Good |
| Efficient mover | High km/day with above-average SOH retention | Good |
| Revenue efficient | High revenue, lower-than-average operating cost | Good |

#### Fleet table columns (minimum)
Bus ID, Depot, SOH %, km/day, Revenue, Op. Cost, Net P&L, P&L/km, Asset Value, Status flag

#### Filters / grouping
- By depot / route zone
- By health tier: Healthy (≥85%), Moderate (75–84%), Critical (<75%)
- Sort by any column
- Surface top 10 bad outliers / top 10 good outliers as a quick view

#### Charts
- P&L trend over time (fleet aggregate, by period)
- SOH distribution across fleet (histogram by health band)
- Revenue vs Operating Cost by depot (grouped bar)
- Depreciation curve — fleet average asset value over SOH bands

### 6.2 Individual Asset View (drill-down)

**Purpose:** Everything Rajan needs to understand one bus — its health, its financial contribution, and where it's headed.

#### Sections

**Identity & health**
- Bus ID, depot, route zone, age in months
- SOH % with visual indicator
- Effective battery capacity (kWh = 300 × SOH/100)
- Projected months to EOL (70% SOH)
- Depreciation to date (₹ lost from ₹20L)

**Utilisation**
- km/day (vs depot average)
- Total odometer km
- Utilisation index: this bus vs depot avg km/day (over / under %)

**Financials (selected period)**
- Revenue
- Operating Cost
- Net P&L
- Asset value today
- P&L per km

**Benchmarking (vs depot peers)**
- SOH rank within depot (e.g. 12th of 40)
- P&L rank within depot
- Revenue/km vs depot avg
- Op. cost/km vs depot avg
- These should be visual — bar or bullet chart, not just numbers

**Flags**
- Is this bus a good outlier, bad outlier, or within normal range — and on which metric?
- Plain language: "This bus has a higher SOH drop rate than 80% of KBS depot buses"

---

## 7. What We Are NOT Building (scope boundaries)

- SOH vs energy efficiency chart — energy/km is not SOH-dependent in this model
- Predictive ML models — this is a visualisation and monitoring tool, not forecasting
- Driver-level data — unit of analysis is the bus, not the driver
- Real-time telemetry — data is assumed to be daily batch updated

---

## 8. Decisions — Scoping Answers

### Period selector
Daily, weekly, and monthly views are in scope. Custom date range will exist as a **placeholder UI element** (visible but disabled) — signals roadmap intent without adding prototype complexity.

### Individual asset view
Implemented as a **side panel / drawer** — opens from the fleet table on row click. Keeps the fleet overview context visible, avoids a full page navigation. Panel slides in from the right.

### Export
**In scope.** Rajan needs to share data with his supervisor and finance team.
- Export fleet table as CSV
- Export individual asset summary as PDF
- Both triggered from the relevant view. No complex formatting required for prototype — clean and functional.

### Alerts & notifications
**Basic alert layer in scope for prototype.**

| Alert type | Trigger condition | Severity |
|---|---|---|
| Fast degrader | SOH drop rate > 1.5× depot average | High |
| Approaching EOL | Projected months to 70% SOH < 3 months | High |
| P&L negative | Net P&L negative for selected period | Medium |
| Underutilised | km/day < 60% of depot average for 7+ days | Medium |
| Cost spike | Operating cost/km > 1.3× depot average | Medium |

Alerts surface as:
- A badge count in the top navigation
- A dedicated alerts banner / panel on the fleet overview (collapsible)
- A flag on the relevant row in the fleet table
- A flag inside the individual asset side panel

Notification delivery (email, SMS) is **out of scope for prototype** — in-app only.

### Maintenance state
Buses under maintenance are **shown in the fleet table**, not hidden. They carry a distinct visual state:

- "Under Maintenance" status tag on the row
- km/day shows as 0 or last recorded value with a maintenance indicator
- Financial metrics freeze at last active period — labelled clearly as such
- SOH and asset value still display (battery health doesn't change during maintenance)
- Excluded from depot averages for utilisation calculations, included for SOH and financial averages

This gives Rajan full visibility without distorting fleet performance benchmarks.

---

## 9. Prototype Scope Summary

| Feature | In scope | Notes |
|---|---|---|
| Fleet overview with KPIs | ✅ | |
| Fleet table with outlier flags | ✅ | |
| Filter by depot, health tier | ✅ | |
| Sort by any column | ✅ | |
| Period selector (daily/weekly/monthly) | ✅ | |
| Custom date range | 🔲 Placeholder | Visible, disabled |
| Individual asset side panel | ✅ | |
| Benchmarking vs depot peers | ✅ | |
| Basic alerts (in-app) | ✅ | |
| Export CSV (fleet table) | ✅ | |
| Export PDF (individual asset) | ✅ | |
| Maintenance state display | ✅ | |
| Push notifications (email/SMS) | ❌ Phase 2 | |
| Predictive / ML forecasting | ❌ Out of scope | |

---

*Brief version: 2.0 — updated with founder scoping decisions.*
*Fleet data: blr_fleet_200.csv (200 buses, 6 depots, Bengaluru)*
