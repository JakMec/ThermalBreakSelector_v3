# Thermal Break Selector — Project Notes

## What this app is

An ASP.NET Core Razor Pages web application for selecting thermal break connector products based on structural input parameters. Selected products are collected in a results table that can be exported to CSV or printed as PDF.

## How to run

```bash
cd "C:\CSharp_projects\ThermalBreakSelector_v3\ThermalBreakSelector"
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

The page is a full-height flex row with three zones:

1. **Narrow nav bar (40 px)** — three icon buttons: Home (closes overlay), Person (project settings), Hamburger (file operations). Clicking Person or Hamburger opens an overlay panel that slides over the sidebar.

2. **Overlay panel (264 px, absolute)** — two sub-panels toggled by the nav:
   - **Project settings**: Designer section (Company, Address, Phone, Name, Email) + Project section (Company, Location, Contact person, Comments)
   - **File operations**: Open file, Save as, Print PDF, Export CSV, Import CSV

3. **Left sidebar (256 px)** — two stacked bordered sections:
   - **Global inputs**: Type of support (3 icon buttons: Slab-to-Slab, Slab-to-Wall, Horizontal el.), Bending moment + direction toggles (↺↻), Shear load + direction toggles (↑↓), Horizontal load + direction toggles (←→), Balcony connector height, Balcony slab concrete grade, Thermal insulation thickness toggle (ISO 80 | ISO 120), Thermal break type toggle (EBEA | TEBEA), Concrete cover, Maximum utilization, Select button
   - **Selected type** — switches panel based on break type:
     - **TEBEA panel**: Selected type dropdown → Connector length → Anchorage length → Position name → Quantity + Add to list
     - **EBEA panel**: Connector length → Anchorage length → Extra insulation top → Extra insulation bottom → Without crossbar toggle → Position name → Quantity + Add to list

4. **Right content area** — action buttons + horizontally scrollable results table:
   - Left buttons: Import CSV, Delete (trash icon)
   - Right buttons: Save as, Print PDF, Export CSV
   - Table columns: ☐ | No. | Position | Connector | Length [mm] | Quantity [pcs] | Edit | mEd [kNm/m] | mRd [kNm/m] | ηm | vEd [kN/m] | vRd [kN/m] | ηV | HEd [kN] | HRd [kN] | ηH | Stiffness [kNm/rad/m]
   - Orange headers: mEd, mRd, ηm, vEd, vRd, ηV
   - Blue headers: HEd, HRd, ηH, Stiffness

## Button data

| Control | Values |
|---|---|
| Type of support | Slab-to-Slab (default, active on load), Slab-to-Wall, Horizontal el. |
| Thermal insulation thickness | ISO 80 (default active), ISO 120 |
| Thermal break type | EBEA (default active), TEBEA |

## Dropdown data (implemented)

| Control | Values |
|---|---|
| Balcony connector height | 160–300 mm, step 10 (JS generated) |
| Balcony slab concrete grade | C20/25, C25/30 (default), C30/37 |
| Concrete cover | CC35 (default), CC55 |
| Connector length | 1000, 500 — or 250 only when Type of support = Horizontal el. |
| Anchorage length | Select (placeholder) + 145–175 mm, step 5 (JS generated) |
| Extra insulation top / bottom | 0–70 mm, step 5 (JS generated) |
| Quantity | Integer input (default 1), one per panel |

## Dynamic field behaviour

| Trigger | Effect |
|---|---|
| Type of support = Horizontal el. | Bending moment + Shear load disabled and cleared; Horizontal load enabled; connector length options set to 250 only |
| Type of support = Slab-to-Slab or Slab-to-Wall | Horizontal load disabled and cleared; Bending moment + Shear load enabled; connector length options 1000 / 500 |
| Thermal break type = EBEA | EBEA panel shown (extra insulation, crossbar); TEBEA panel hidden |
| Thermal break type = TEBEA | TEBEA panel shown (Selected type dropdown); EBEA panel hidden |
| Load direction buttons (↺↻, ↑↓, ←→) | Toggle active direction highlight (teal); direction stored in `loadDirs` state |
| Without crossbar button | Toggles teal/inactive state; stored in `crossbarActive` |

## app.js — key functions

| Function | Description |
|---|---|
| `initDropdowns()` | Populates all JS-generated range selects on page load |
| `setSupport(type)` | Updates active support button, calls `onTypeOfSupportChange()` |
| `onTypeOfSupportChange()` | Enables/disables load inputs and calls `updateConnectorLengths()` |
| `updateConnectorLengths(type)` | Rebuilds connector length options for both panels |
| `setInputDisabled(id, disabled)` | Toggles disabled state + visual style on an input |
| `setLoadDir(load, dir)` | Highlights the active direction button for bm / sl / hl |
| `selectInsulation(type)` / `selectBreakType(type)` | Toggle ISO 80/120 or EBEA/TEBEA; call `updateSelectedPanel()` |
| `updateSelectedPanel()` | Shows EBEA or TEBEA panel based on `currentBreakType` |
| `switchTab(tab)` | Alias for `updateSelectedPanel()` |
| `toggleCrossbar()` | Toggles the "Without crossbar" button state |
| `selectProduct()` | Placeholder — DB lookup wired here later |
| `addToList(tab)` | Reads all inputs for the active panel → appends row to `tableRows[]` |
| `renderTable()` | Re-renders all table rows from `tableRows[]` state |
| `toggleSelectAll(checked)` | Checks/unchecks all row checkboxes |
| `openEditModal(id)` / `closeEditModal()` / `saveEdit()` | Edit position + quantity via modal |
| `deleteSelected()` | Removes all checked rows from `tableRows[]` |
| `exportCSV()` | Downloads table as `.csv` |
| `importCSV()` / `handleCSVImport(event)` | Imports rows from a `.csv` file |
| `saveAsJSON()` | Saves all inputs + project settings + rows as `.json` |
| `openFile()` / `handleJSONLoad(event)` | Loads a previously saved `.json` project file |
| `printPDF()` | Calls `window.print()` — sidebar + controls hidden via print CSS |
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
| `crossbarActive` | `boolean` | Whether "Without crossbar" is toggled on |
| `loadDirs` | `object` | Active direction per load: `{ bm, sl, hl }` |

## What is NOT yet implemented (to be added later)

- **Product database** — `selectProduct()` is a no-op placeholder; no DB queries yet
- **Selected type dropdown options** — `#selected-type-tebea` only has a blank "Select" option; values will come from DB
- **Calculation logic** — mEd, mRd, ηm, vEd, vRd, ηV, HEd, HRd, ηH, Stiffness columns are stored as `null` and display empty
