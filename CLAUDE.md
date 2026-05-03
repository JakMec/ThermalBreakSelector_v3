# Thermal Break Selector — Project Notes

## What this app is

An ASP.NET Core Razor Pages web application for selecting thermal break connector products based on structural input parameters. Selected products are collected in a results table that can be exported to CSV or printed as PDF.

## How to run

```bash
cd "C:\CSharp_projects\ThermalBreak Selector_V3\ThermalBreakSelector"
dotnet run --launch-profile http
```

Then open **http://localhost:5100** in the browser.

## Tech stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | ASP.NET Core 10 — Razor Pages       |
| CSS        | Tailwind CSS (CDN)                  |
| JavaScript | Vanilla JS (no framework)           |
| PDF print  | Browser `window.print()`            |

## Project structure

```
ThermalBreakSelector/
├── Pages/
│   ├── Shared/
│   │   └── _Layout.cshtml        # Minimal layout — Tailwind CDN, no Bootstrap
│   ├── Index.cshtml              # Main application UI
│   ├── Index.cshtml.cs           # Minimal page model (OnGet only)
│   ├── _ViewImports.cshtml
│   └── _ViewStart.cshtml
├── wwwroot/
│   ├── css/
│   │   └── site.css              # Print/PDF styles, scrollbar overrides
│   └── js/
│       └── app.js                # All front-end logic
├── Properties/
│   └── launchSettings.json       # HTTP: 5100, HTTPS: 7181
├── Program.cs
└── appsettings.json
```

## UI layout

- **Left sidebar (264 px)** — two stacked bordered sections:
  1. Global inputs: Type of support, Bending moment, Shear load, Horizontal load, Balcony connector height, Balcony slab concrete grade, Thermal insulation thickness, Thermal break type, Concrete cover, Maximum utilization ratio → Select
  2. Selected type section:
     - **ISO 120 & TEBEA**: 
     Selected type → Connector length →  Anchorage length, Position name, Add to list
     - **(ISO 80 or ISO 120)&EBEA**: Connector length → Anchorage length, Extra insulation top/bottom, Without crossbar toggle, Position name, Add to list

- **Right panel** — action buttons + horizontally scrollable results table:
  - Left buttons: Import CSV, Delete
  - Right buttons: Save as, Print PDF, Export CSV
  - Table columns: No. | Position | Connector | Length | Quantity | Edit | mEd | mRd | ηm | vEd | vRd | ηV | HEd | HRd | ηH | Stiffness
  - Orange headers: mEd, mRd, ηm, vEd, vRd, ηV
  - Blue headers: HEd, HRd, ηH, Stiffness

## Button data
| Type of support | 
Slab-to-Slab (default), Slab-to-Wall, Offset-down, Offcet-up |
| Thermal insulation thickness | ISO 80, ISO 120 (default)|
| Thermal break type | EBEA, TEBEA (default)|

## Dropdown data (implemented)

| Control | Values |
|---|---|
| Balcony connector height | 160–300 mm, step 10 (JS generated) |
| Balcony slab concrete grade | C20/25, C25/30 (default), C30/37 |
| Concrete cover (ISO 120) | CC35 (default), CC55 when TEBEA, CC30 (default), CC40 when EBEA |
| Extra insulation top/bottom (ISO 80) | 0–70 mm, step 5 (JS generated) |
| Quantity | Free integer input (default 1), one per tab |

## Dynamic field behaviour


## app.js — key functions

| Function | Description |
|---|---|
| `initDropdowns()` | Populates all JS-generated range selects on page load |
| `onTypeOfSupportChange()` | Enables/disables load inputs and updates connector length options |
| `updateConnectorLengths(type)` | Rebuilds connector length options for both tabs |
| `setInputDisabled(id, disabled)` | Toggles disabled state + visual style on a numeric input |
| `switchTab(tab)` | Switches between ISO 120 / ISO 80 panels |
| `toggleCrossbar()` | Toggles the "Without crossbar" switch (ISO 80) |
| `selectProduct(_tab)` | Placeholder — DB lookup wired here later |
| `addToList(tab)` | Reads position, connector, length, quantity → appends row |
| `renderTable()` | Re-renders all table rows from `tableRows[]` state |
| `openEditModal(id)` / `saveEdit()` | Edit a row via modal dialog |
| `deleteSelected()` | Deletes all checked rows |
| `exportCSV()` | Downloads table as `.csv` |
| `importCSV()` / `handleCSVImport()` | Imports rows from a `.csv` file |
| `saveAsJSON()` | Saves all inputs + rows as a `.json` project file |
| `printPDF()` | Calls `window.print()` — sidebar hidden via print CSS |

## What is NOT yet implemented (to be added later)

- **Product database** — `selectProduct()` is a placeholder; no DB queries yet
- **Selected type / Anchorage S11 dropdown data** — options will come from DB
- **Calculation logic** — mEd, mRd, ηm, vEd, vRd, ηV, HEd, HRd, ηH, Stiffness columns not yet computed
- **Load project** — Save as writes JSON but there is no Load/Open to restore a saved project
