# Analytics & Data Transformation Logic

## Dashboard Overview

The analytics dashboard transforms raw extracted data into visual summaries. Each visualization is derived directly from the `ExtractedReport` data structure.

## Summary Cards

Four key metrics are computed:

| Card | Source | Computation |
|---|---|---|
| Total Goals | `report.goals.length` | Count of extracted goals |
| Total BMPs | `report.bmps.length` | Count of extracted BMP practices |
| Estimated Cost | `report.summary.totalEstimatedCost` | From regex-matched "Total Estimated Project Cost" or sum of BMP costs |
| Watershed Area | `report.metadata.totalAcreage` | From regex-matched acreage |

Phase 1 cost is shown as a subtitle when available.

## BMP Cost Breakdown (Bar + Pie Charts)

### Top BMPs Bar Chart
- **Data**: BMPs sorted by `estimatedCost` descending, top 10
- **X-axis**: Cost in $k
- **Y-axis**: Practice name (truncated to 25 chars)
- **Color**: By category (structural=blue, vegetative=green, management=orange)

### By Practice Pie Chart
- Same top 10 BMPs as pie slices
- Labels show name and percentage of total

### By Category Donut Chart
- BMPs grouped by `category` field
- Sum of `estimatedCost` per category
- Categories: structural, vegetative, management, other

**Category assignment logic** (in `regexExtractor.ts`):
- **Structural**: grade stabilization, sediment basin, diversion, pond, terrace, dam, pipeline, reservoir, stream crossing, water control structure, underground outlet
- **Vegetative**: cover crop, filter strip, field border, grassed waterway, tree/shrub planting, forest improvement, prescribed burning, forage planting
- **Management**: fencing, nutrient management, prescribed grazing, watering facility, heavy use area, livestock management, critical area planting

## Land Use Distribution (Pie Chart)

- **Source**: `report.geographicAreas[0].landUse`
- **Data**: Object entries of `{ cropland: 37, pasture: 20, forest: 27, ... }`
- **Colors**: Predefined per land use type (cropland=yellow, pasture=lime, forest=green, wetlands=cyan, urban=gray)
- **Labels**: Category name + percentage

Extraction relies on regex patterns matching `XX% cropland`, `XX% pastureland`, `XX% forestry`, etc. from Element a or Watershed Description.

## Outreach Budget Allocation (Bar Chart)

- **Source**: `report.outreach` filtered where `budget > 0`
- **Data**: Activities sorted by budget descending
- **X-axis**: Budget amount
- **Y-axis**: Activity name

This is particularly rich for Chapter-based (2012) documents which have detailed per-activity budgets (Signage, Field Days, Fact Sheets, Puppet Show, County Fair, etc.).

## Data Tables

### Goals & TMDL Targets
- Columns: Description, Pollutant (badge), Target Reduction (monospace), Status (colored badge)
- Color coding: planned=gray, in-progress=yellow, completed=green

### BMP Table
- Columns: Practice Name, Category (badge), Units + Unit Type, Unit Cost, Estimated Cost, Phase
- Footer row: Total cost sum
- Sortable by cost

### Water Quality Thresholds
- Columns: Parameter, Threshold
- Direct display of regex-extracted values

### TMDL Table
- Columns: Pollutant, Reduction Required (red monospace), Target Value

### Implementation Schedule
- Columns: Activity, Timeline (monospace), Responsible Party
- Timeline values like "Months 1-6" preserved as-is from document

### Monitoring Stations
- Columns: Station ID (monospace), Water Body, Sampling Years, Agency, Data Types (tags)

### Outreach Activities
- Columns: Activity, Description, Budget (right-aligned), Schedule

## Data Integrity Checks

1. **Cost sums**: BMP table footer sums all `estimatedCost` values; this is compared against `summary.totalEstimatedCost` which comes from the document's stated total
2. **Percentage totals**: Land use percentages should sum to ~100% (±5% for rounding)
3. **No double-counting**: Chapter-based documents have budgets in both main plan and Appendix B; only main plan tables are used for the primary BMP extraction
4. **Empty state handling**: Charts show "No data extracted" messages when arrays are empty

## Export Formats

### JSON Export
Complete `ExtractedReport` object as formatted JSON. Preserves all nested structures.

### CSV Export
Flat CSV with sections separated by headers:
- `=== DOCUMENT METADATA ===`
- `=== SUMMARY ===`
- `=== GOALS ===`
- `=== BEST MANAGEMENT PRACTICES ===`
- `=== WATER QUALITY THRESHOLDS ===`
- `=== TMDLs ===`
- `=== IMPLEMENTATION SCHEDULE ===`
- `=== OUTREACH ACTIVITIES ===`

Each section has appropriate column headers. Values are quoted to handle commas in descriptions.
