# Testing & Accuracy Validation

## Test Documents

The tool was developed and tested against 5 Mississippi Watershed Plans spanning two distinct formats:

| Document | Format | Year | Key Features |
|---|---|---|---|
| Broken Pumpkin Creek | 9 Key Element | 2019 | Sediment focus, 30+ BMPs, Phase 1 budget |
| Carmichael Creek-Town Creek | 9 Key Element | 2019 | Nutrients + sediment, NPDES facilities, 2 cost tables |
| Owl Creek-Little Hatchie River | 9 Key Element | 2020 | 6 BMPs, simpler cost structure |
| Tarebreeches Creek-Tuscumbia River Canal | Chapter-based | 2012 | Detailed education budget, 9 BMPs, Appendix B |
| Bell Creek-West Prong Muddy Creek | Chapter-based | 2012 | Nutrient focus, fecal coliform TMDL, Appendix B |

## Validation Methodology

### 1. Metadata Accuracy (Manual Verification)

For each document, verify:
- [ ] Watershed name matches document title
- [ ] HUC code extracted correctly
- [ ] County name(s) correct
- [ ] Plan year correct
- [ ] Total acreage matches document

**Expected accuracy**: 100% for HUC codes and watershed names (regex-matched)

### 2. BMP Extraction Accuracy

For each document, compare extracted BMPs against the source cost table:
- Count of BMPs extracted vs. total in document
- For each BMP: practice name, unit, quantity, unit cost, estimated cost
- Verify total cost matches document's stated total

**Validation formula**:
```
BMP Accuracy = (correctly extracted BMPs / total BMPs in document) × 100
```

**Target**: ≥75%

### 3. Goal Extraction Accuracy

For each document, verify:
- TMDL reduction targets extracted (e.g., "77-97% sediment reduction")
- Pollutant correctly identified
- No hallucinated goals

### 4. Water Quality Thresholds

Compare extracted parameters against the threshold table in Element h (9-Key) or Table 7.1 (Chapter-based):
- Dissolved Oxygen
- pH
- Temperature
- Total Suspended Solids
- Turbidity
- M-BISQ score

### 5. Zero False Positive Check

Verify no fabricated data for:
- Watershed names (must be exact copy from document)
- HUC codes (must match exactly)
- Permit numbers (e.g., MS0033464)
- Facility names

## Running Tests

### Manual Testing

1. Start the application (`npm run dev`)
2. Upload each of the 5 test PDFs
3. For each report, compare extracted data against the source document
4. Document findings in a spreadsheet

### Automated Spot Checks

The regex extraction includes built-in validation:
- BMP cost rows are cross-checked: `numberOfUnits × unitCost ≈ estimatedCost` (within 5%)
- Total costs are validated against the document's stated totals
- HUC codes must match the expected pattern (8 or 12 digits)

## Expected Results by Document

### Broken Pumpkin Creek (2019)
- Metadata: HUC 031601060307, Noxubee/Lowndes Counties, 24,573 acres
- Full project cost: $2,131,086.33
- Phase 1 cost: $341,517.98
- BMPs: ~31 practices in full table, 8 in Phase 1
- Goals: 77-97% sediment reduction
- WQ Thresholds: 11 parameters

### Carmichael Creek (2019)
- Metadata: HUC 031601020403, Lee County, 26,002 acres
- Full project cost: $2,744,001
- Phase 1 cost: $383,187.60
- BMPs: ~17 practices in full table, 10 in Phase 1
- Goals: 77-97% sediment, 80% TP, 13% TN reductions
- WQ Thresholds: 13 parameters

### Owl Creek (2020)
- Metadata: HUC 080102070101, Tippah County, 25,740 acres
- Full project cost: $1,633,693
- Phase 1 cost: $456,358
- BMPs: 6 practices
- Goals: 50-94% sediment reduction

### Tarebreeches Creek (2012)
- Metadata: HUC 08010207-0503, Alcorn County, 16,721 acres
- Total budget: $552,001.01
- BMPs: 9 practices
- Goals: Reduce sediment/nutrient loading, remove from 303(d) list

### Bell Creek-Muddy Creek (2012)
- Metadata: HUC 08010207-0601, Tippah County, 19,277 acres
- Total budget: $510,334.01
- BMPs: 10 practices
- Goals: 45-70% nutrient reduction

## Accuracy Tracking

| Metric | Target | Method |
|---|---|---|
| Metadata fields | 100% | Exact string match |
| BMP count | ≥75% | Count comparison |
| BMP costs | ≥75% | Value comparison (±$1 tolerance) |
| Goals identified | ≥75% | Manual review |
| Quantitative metrics | ≥75% | Value comparison |
| False positive rate | 0% | Manual review of exact-copy fields |
| Content categorization | ≥75% | Category match check |
