# Virufy × EHS · UAE Respiratory Disease Map (Illustrative demo)

A **public, shareable** demonstration dashboard: app-based pediatric cough & breath
screening surfacing a respiratory signal across the seven emirates. Design reference:
Virufy's public `virufy.org/disease-map` and `virufy.org/dubai-map`, kept deliberately
clean and simple.

> **All data is simulated.** No real EHS sites, patients, partners, or clinical-study
> figures appear here. Safe to show publicly and to host on public GitHub.

## Preview
Double-click `UAE-Respiratory-Surveillance-Dashboard.html` (no server needed). Works
offline, self-contained in one file. For development, run `npm run dev`.

## The 60-second explanation
- **The map** shows the seven emirates. Each **circle** sits on a real emirate; its
  **size** is how many children were screened there, and its **colour** is the
  respiratory-index tier (green for Low, up to red for Critical).
- **Location** (top-left) zooms the map into a single emirate; the detail card on the
  right then shows that emirate's index, screening count, coverage, top signal and a
  modeled next-month projection. Choose *All emirates* to zoom back out.
- **Season** re-weights the respiratory load (winter is the peak).
- **Forecast scenario** is a what-if (winter surge, dust storm, flu season, school
  return) that scales every emirate at once.
- The **ranked list**, **12-month trend** (observed vs a modeled line), **presenting
  signals** and **age bands** are all supporting context.

That is the whole tool: three controls, one map, a few supporting stats.

## Safety framing
Because an earlier version accidentally exposed study data, this build is deliberately
generic: a "TEST DATA" badge, a simulated-data disclaimer banner, a "Geography real ·
data simulated" map note, no site counts or coverage claims, and a "What this is" note
that spells out it is a synthetic prototype, not a raw data export.

## Editing the mock numbers
All simulated figures live in `src/model.ts`:
- `EMIRATES`: each emirate's `base` index (0 to 100), `vol` (children screened), `pop`
  (illustrative child population, for coverage), dominant `sig`, and `pfac` (the
  modeled vs observed ratio behind the "modeled next-month" figure).
- `SEASON_FACTOR`: how each season scales index (`i`) and volume (`v`).
- `SCENARIOS`: the forecast what-ifs and their index/volume multipliers.
- `TIERS`: the 5-class Low to Critical colour scale plus thresholds.
- `SIGNALS`, `AGE_BANDS`, `TREND_SHAPE`: signal mix, age mix, 12-month shape.

## Build
- `npm run dev`: Vite dev server.
- `npm run build`: type-checks, bundles into one self-contained HTML, and copies it
  to `UAE-Respiratory-Surveillance-Dashboard.html` at the repo root.

## Hosting
Drag the folder onto Netlify or any static host. The deliverable is one HTML file.
