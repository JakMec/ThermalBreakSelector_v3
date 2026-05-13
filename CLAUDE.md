# Thermal Break Selector — Project Notes

## What this app is

An ASP.NET Core Razor Pages web application for selecting thermal break connector products based on structural input parameters. Selected products are collected in a results table that can be exported to CSV or printed as PDF.

## How to run

### Development
```bash
cd "C:\CSharp_projects\ThermalBreakSelector_v3\ThermalBreakSelector"
dotnet run --launch-profile http
```

Then open **http://localhost:5100/ThermalBreakSelector.html** in the browser.

### Portable distribution (self-contained exe)
Build the `dist/` folder by running `build-dist.bat` at the repo root:
```
build-dist.bat
```
This runs `dotnet publish` with the `SelfContained-win-x64` profile, then copies the CSV and launchers into `dist/`.

Double-click `dist\Launch.bat` (or `dist\Launch.hta`) to start the server and open the browser automatically. The exe serves at **http://localhost:5100/ThermalBreakSelector.html** — no .NET runtime install required on the target machine.

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
│   ├── Index.cshtml              # Main application UI — route: /ThermalBreakSelector.html
│   ├── Index.cshtml.cs           # Minimal page model (OnGet only)
│   ├── _ViewImports.cshtml
│   └── _ViewStart.cshtml
├── wwwroot/
│   ├── css/
│   │   └── site.css              # Print/PDF styles, scrollbar overrides
│   └── js/
│       └── app.js                # All front-end logic
├── Properties/
│   ├── launchSettings.json       # HTTP: 5100, HTTPS: 7181
│   └── PublishProfiles/
│       └── SelfContained-win-x64.pubxml  # Single-file win-x64 publish → dist/
├── Program.cs                    # Minimal API + Razor Pages; /api/database; port 5100 in prod
└── appsettings.json

# Repo root
build-dist.bat                    # Build script: dotnet publish + copy CSV + launchers to dist/
Launch.bat                        # Launcher template (copied to dist/ by build-dist.bat)
Launch.hta                        # HTA launcher template (copied to dist/ by build-dist.bat)
dist/                             # Published output (gitignore this folder)
├── ThermalBreakSelector.exe      # Self-contained win-x64 exe (~48 MB)
├── 2026_05_11 ConnectorDatabase.csv
├── wwwroot/                      # Static assets (CSS, JS, images)
├── Launch.bat
└── Launch.hta
```

## UI layout

The page is a full-height flex row with three zones:

1. **Narrow nav bar (40 px)** — three icon buttons: Home (closes overlay), Person (project settings), Hamburger (file operations). Clicking Person or Hamburger opens an overlay panel that slides over the sidebar.

2. **Overlay panel (264 px, absolute)** — two sub-panels toggled by the nav:
   - **Project settings**: Designer section (Company, Address, Phone, Name, Email) + Project section (Company, Location, Contact person, Comments) — included in PDF printout and CSV export
   - **File operations**: Open file, Save as, Print PDF, Export CSV, Import CSV

3. **Left sidebar (256 px)** — two stacked bordered sections:
   - **Global inputs**: Type of support (3 icon buttons: Slab-to-Slab, Slab-to-Wall, Horizontal el.), Bending moment + direction toggles (− | ±), Shear load + direction toggles (+ | ±), Horizontal load (no direction buttons), Balcony connector height, Balcony slab concrete grade, Thermal insulation thickness toggle (ISO 80 | ISO 120), Thermal break type toggle (EBEA | TEBEA), Concrete cover (dynamic options), Maximum utilization, Select button
   - **Selected type** — single unified panel (no TEBEA/EBEA split): Selected type dropdown → Connector length → Anchorage length (range slider) → Extra insulation top → Extra insulation bottom → Without crossbar (toggle switch) → Position name → Quantity + Add to list

4. **Right content area** — Delete button + horizontally scrollable results table:
   - Buttons: Delete (trash icon) — Import CSV / Save as / Print PDF / Export CSV are in the File overlay panel only
   - Table columns: ☐ | No. | Position | Connector | Length [mm] | Quantity [pcs] | Edit | mEd [kNm/m] | mRd [kNm/m] | ηm | vEd [kN/m] | vRd [kN/m] | ηV | HEd [kN] | HRd [kN] | ηH | Stiffness [kNm/rad/m]
   - All headers: gray (`bg-gray-50`)

## Button data

| Control | Values |
|---|---|
| Type of support | Slab-to-Slab (default, active on load), Slab-to-Wall, Horizontal el. |
| Thermal insulation thickness | ISO 80 (default active), ISO 120 |
| Thermal break type | EBEA (default active), TEBEA — **TEBEA disabled when ISO 80 is selected** |

## Dropdown / input data

| Control | Values |
|---|---|
| Balcony connector height | EBEA: 160–300 mm step 20; TEBEA: 160–250 mm step 10 (JS generated, rebuilt on break type change) |
| Balcony slab concrete grade | C20/25, C25/30 (default), C30/37 |
| Concrete cover | Dynamic — see table below |
| Connector length | Built from `minLength`..`ProductLength` after product selection; step 500 (TEBEA) / 50 (EBEA); default = `ProductLength` |
| Anchorage length | Range slider; enabled only when Slab-to-Wall; TEBEA: 145–220, EBEA: 120–220, step 5, default 145 |
| Extra insulation top / bottom | 0–70 mm, step 5; **disabled/hidden for TEBEA** |
| Without crossbar | **Disabled for TEBEA** |
| Quantity | Integer input (default 1) |

### Concrete cover options (dynamic)

| Break type | Support | Options |
|---|---|---|
| TEBEA | Slab-to-Slab or Slab-to-Wall | 35, 55 |
| TEBEA | Horizontal | 35 |
| EBEA | Slab-to-Slab | 30, 45 |
| EBEA | Slab-to-Wall or Horizontal | 30 |

## Dynamic field behaviour

| Trigger | Effect |
|---|---|
| Type of support = Horizontal el. | Bending moment + Shear load disabled and cleared; Horizontal load enabled; `updateConcreteCover()` + `updateAnchorageLength()` called |
| Type of support = Slab-to-Wall | Anchorage length slider enabled; `updateConcreteCover()` called |
| Thermal insulation = ISO 80 | TEBEA button disabled + dimmed; if TEBEA was active, auto-switches to EBEA |
| Thermal insulation = ISO 120 | TEBEA button re-enabled |
| Thermal break type = TEBEA | Connector height rebuilt (160–250 step 10); concrete cover rebuilt; anchorage range updated; extra insulation + crossbar disabled |
| Thermal break type = EBEA | Connector height rebuilt (160–300 step 20); concrete cover rebuilt; anchorage range updated; extra insulation + crossbar enabled |
| Load direction buttons (− / ± for bm; + / ± for sl) | Toggle active direction highlight (teal); stored in `loadDirs`; used during selection |
| Without crossbar toggle switch | EBEA only — slides knob right + track turns teal when on; stored in `crossbarActive` |
| Select button | Runs full 3-step filter against `productDatabase`; populates `#selected-type` or shows "no model available" |
| Selected type dropdown change | Calls `updateConnectorLengths(productRow)` — rebuilds length options from DB row |

## app.js — key functions

| Function | Description |
|---|---|
| `initDropdowns()` | Populates extra-ins selects; calls `updateConnectorHeight()` + `updateConcreteCover()` |
| `updateConnectorHeight()` | Rebuilds `#connector-height` options based on `currentBreakType` (EBEA: 160–300 step 20; TEBEA: 160–250 step 10) |
| `loadDatabase()` | `fetch('/api/database')` on page load; stores result in `productDatabase` |
| `updateConcreteCover()` | Rebuilds `#concrete-cover` options based on `currentBreakType` + `currentSupport` |
| `updateAnchorageLength()` | Enables/disables anchorage slider; sets min/max per break type |
| `updateEbeaOnlyFields()` | Enables/disables extra insulation + crossbar based on `currentBreakType` |
| `setSupport(type)` | Updates active support button, calls `onTypeOfSupportChange()` |
| `onTypeOfSupportChange()` | Enables/disables load inputs; calls cover, anchorage, connector-length updaters; clears selection |
| `updateConnectorLengths(productRow)` | Rebuilds connector length options from DB row (`minLength`..`ProductLength`, step 500/50) |
| `setInputDisabled(id, disabled)` | Toggles disabled state + visual style on an input |
| `setLoadDir(load, dir)` | Highlights the active direction button for bm / sl |
| `selectInsulation(type)` | Toggle ISO 80/120; disables/re-enables TEBEA button; if ISO 80 + TEBEA active → force-switches to EBEA |
| `selectBreakType(type)` | Toggle EBEA/TEBEA; calls `updateConnectorHeight()`, `updateConcreteCover()`, `updateAnchorageLength()`, `updateEbeaOnlyFields()` |
| `toggleCrossbar()` | EBEA only — animates the toggle switch knob and track; flips `crossbarActive` |
| `selectProduct()` | **Implemented** — 3-step filter: (1) exact match, (2) DoubleMoment/DoubleShear flags, (3) load capacity + utilization ratio ≤ maxUtil |
| `onSelectedTypeChange()` | Reads selected option's `data-row-idx`; updates `selectedProductRow`; calls `updateConnectorLengths()` |
| `calcUtilization(p, bm, sl, hl)` | Returns max utilization ratio for the product row given the applied loads |
| `buildProductCode(...)` | Builds EBEA or TEBEA product code string for the results table `Connector` column |
| `addToList()` | Reads Section 2 inputs → builds product code → fills capacity columns from DB → appends row |
| `clearSelection()` | Resets `#selected-type` to "Select" and clears connector length options |
| `renderTable()` | Re-renders all table rows from `tableRows[]` state |
| `toggleSelectAll(checked)` | Checks/unchecks all row checkboxes |
| `openEditModal(id)` / `closeEditModal()` / `saveEdit()` | Edit position + quantity via modal |
| `deleteSelected()` | Removes all checked rows from `tableRows[]` |
| `exportCSV()` | Prepends project settings block (Designer + Project, two-column, with date) then table headers + rows; downloads as `.csv` |
| `importCSV()` / `handleCSVImport(event)` | Imports rows from a `.csv` file |
| `saveAsJSON()` | Saves all inputs + project settings + rows as `.json` |
| `openFile()` / `handleJSONLoad(event)` | Loads a previously saved `.json` project file |
| `printPDF()` | Populates `#print-header` spans from project settings inputs, then calls `window.print()` |
| `navTo(panel)` | Shows/hides the overlay panel ('main', 'project', or 'file') |

## app.js — state variables

| Variable | Type | Description |
|---|---|---|
| `tableRows` | `Array` | All table rows; each row stores all input values at time of add |
| `nextId` | `number` | Auto-increment ID counter for rows |
| `editingRowId` | `number\|null` | ID of the row currently open in the edit modal |
| `currentSupport` | `string` | `'slab-slab'`, `'slab-wall'`, or `'horizontal'` |
| `currentInsulation` | `string` | `'iso80'` or `'iso120'` |
| `currentBreakType` | `string` | `'ebea'` or `'tebea'` |
| `crossbarActive` | `boolean` | Whether "Without crossbar" is toggled on (EBEA only) |
| `loadDirs` | `object` | Active direction per load: `{ bm: 'negBm'\|'posNegBm', sl: 'posSl'\|'posNegSl' }` |
| `productDatabase` | `Array` | Full database loaded from `/api/database` on page load |
| `selectedProductRow` | `object\|null` | The DB row object for the currently selected product |

## Product database

Source file: `BackgroundData/2026_05_11 ConnectorDatabase.csv` (~11 770 rows, semicolon-delimited).  
Served at runtime via `GET /api/database` (defined in `Program.cs` as a minimal API endpoint). Parsed server-side into a JSON array; numeric and boolean fields are typed, not strings.

### Filter columns (map to UI inputs)

| CSV column | Values | UI control |
|---|---|---|
| `ProductFamily` (col 21) | `TEBEA` / `EBEA` | Thermal break type toggle |
| `InsThickness` (col 20) | `80` / `120` | ISO 80 / ISO 120 toggle |
| `Type` (col 26) | `Slab-to-Slab` / `Slab-to-Wall` / `Horizontal El.` | Type of support buttons |
| `TopCover` (col 7) | `35` / `55` (TEBEA), `30` / `45` (EBEA) | Concrete cover dropdown |
| `f__ck` (col 9) | `20` / `25` / `30` | Concrete grade dropdown |
| `Height` (col 6) | `160`–`300` step 10 | Balcony connector height dropdown |
| `DoubleMoment` (col 24) | `TRUE`/`FALSE` | bm load direction toggle (`posNegBm` → `TRUE`) |
| `DoubleShear` (col 25) | `TRUE`/`FALSE` | sl load direction toggle (`posNegSl` → `TRUE`) |

### Capacity output columns (map to results table)

| CSV column | Unit in DB | Table column |
|---|---|---|
| `MRdPos` / `MRdNeg` (col 10/11) | N·mm/m | mRd [kNm/m] — divide by 1 000 000 |
| `VRdPos` / `VRdNeg` (col 12/13) | N/m | vRd [kN/m] — divide by 1 000 |
| `VRdMax` (col 14) | N/m | max shear check — divide by 1 000 |
| `HRd` (col 16) | N | HRd [kN] — divide by 1 000 |
| `SpringStiff` (col 18) | kNm/rad/m | Stiffness [kNm/rad/m] — already in final units, no conversion needed |

### Other notable columns

| CSV column | Description |
|---|---|
| `ProductType` (col 1) | Full product name used as dropdown label and in product code |
| `LoadFamily` / `LoadLevel` (col 2/3) | Connector size family, e.g. CM1–CM4, HM1, E, LM |
| `ShearFamily` / `ShearLevel` (col 4/5) | Shear variant, e.g. V / VV / W |
| `AnchoLength` (col 22) | DB anchorage length (S11); EBEA slab-wall filter: selectedAnchorageLength ≥ AnchoLength |
| `minLength` (col 23) | Minimum connector length for the product; used to build connector-length dropdown |
| `ProductLength` (col 8) | Maximum/default connector length; used to build connector-length dropdown |
| `LambdaEq` (col 19) | Equivalent lambda (thermal performance) |

## Selection procedure (triggered by "Select" button)

### Step 1 — exact-match filter
```
Type          === csvSupport          ('Slab-to-Slab' | 'Slab-to-Wall' | 'Horizontal El.')
Height        === connectorHeight     (from UI)
f__ck         === concreteStrength    (20 | 25 | 30 derived from grade dropdown)
TopCover      === concreteCover       (numeric value from cover dropdown)
ProductFamily === currentBreakType    (TEBEA | EBEA, case-insensitive)
InsThickness  === 80 | 120            (from currentInsulation)
```

### Step 2 — derive bending & shear flags (`'slab-slab'` and `'slab-wall'` only — skipped for `'horizontal'`)
```
if loadDirs.bm === 'negBm'     → DoubleBending = false
if loadDirs.bm === 'posNegBm'  → DoubleBending = true

if loadDirs.sl === 'posSl'     → DoubleShear = false
if loadDirs.sl === 'posNegSl'  → DoubleShear = true
```
Filter candidates by: `DoubleMoment === DoubleBending` and `DoubleShear === DoubleShear flag`.

### Step 3 — load capacity + utilization
All capacity checks use: `utilizationRatio ≤ maxUtilization / 100`

- **Slab-to-Slab / Slab-to-Wall (TEBEA and EBEA)**:
  `MRdNeg/1e6 ≤ bm`, `MRdPos/1e6 ≥ bm`, `VRdPos/1000 ≥ sl`, `VRdNeg/1000 ≤ sl`, `VRdMax/1000 ≥ sl`
- **EBEA Slab-to-Wall** additionally: `selectedAnchorageLength ≥ AnchoLength`
- **Horizontal**: `HRd/1000 ≥ HorizontalLoad`

`utilizationRatio = max(bm / (MRdNeg/1e6), bm / (MRdPos/1e6), sl / (VRdPos/1000), sl / (VRdNeg/1000))` for slab types; `HorizontalLoad / (HRd/1000)` for horizontal.

### Error handling
If no products survive: dropdown shows "no model available".

## Product code format (built by `buildProductCode()` in `addToList()`)

### TEBEA
```
[SelectedType]-L[connectorLength]                    (slab-slab)
[SelectedType]-L[connectorLength]-LR[anchorage]      (slab-wall)
```

### EBEA
```
[SelectedType] Dt[height+extraTop+extraBottom] [+IO[top]] [+IU[bottom]] SW[80|120] L[length] [S11=[anchorage]] REI120 [OQ]
```
- `+IO` / `+IU` included only when value > 0
- `S11=` included only when Slab-to-Wall
- `OQ` included only when crossbar toggle is **off**

## Print / Export layout

### PDF (`printPDF()`)
Before calling `window.print()`, the function populates a hidden `#print-header` div with current project settings values and makes it visible via `@media print` CSS. Layout mirrors `BackgroundData/Printout layout.docx`:

```
Designer                    Project
Company:  [value]           Company:       [value]
Address:  [value]           Location:      [value]
Phone:    [value]           Contact person:[value]
Name:     [value]           Comments:      [value]
Email:    [value]           Date:          [today]
─────────────────────────────────────────────────
[results table]
```

The sidebar, nav, action buttons, and edit modal are hidden by `@media print` in `site.css`.

### CSV (`exportCSV()`)
Prepends the same two-column project settings block as 6 header rows (4 columns each: label, value, label, value), then a blank separator row, then the standard table headers and data rows.

## What is NOT yet implemented

Remaining possible enhancements:
- Validation / user feedback beyond "no model available" (e.g. highlight which inputs caused no match)
- Load-bearing calculation for HEd/HRd columns in non-horizontal rows (currently `null`)
