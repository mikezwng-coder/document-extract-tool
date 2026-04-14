# Extraction Logic

## Overview

The extraction pipeline uses a 6-step hybrid approach combining regex pattern matching (for high-confidence structured data) with LLM analysis (for unstructured content). This design maximizes accuracy by using the right tool for each data type.

## Pipeline Steps

### Step 1: PDF Text Extraction

**Tool**: `pdf-parse` library

The raw PDF is read into a buffer and parsed to extract plain text. Post-processing cleans up common PDF artifacts:
- Form feeds (`\f`) replaced with double newlines
- Windows line endings normalized
- Excessive whitespace collapsed
- Empty lines cleaned

### Step 2: Document Format Detection

**Tool**: Regex pattern scoring

Two sets of patterns are scored against the document text:

**9 Key Element patterns** (score +1 each):
- `Element [a-i]:` or `Element [a-i]\n`
- `9 Key Element`
- `HUC \d{12}`
- `GY\d{2} Watershed`

**Chapter-based patterns** (score +1 each):
- `I. Executive Summary`
- `V. Watershed Description`
- `VIII. Watershed Management`
- `IX. Education/Outreach`
- `Watershed Implementation Plan`

The format with the higher score wins. This correctly identifies all test documents.

### Step 3: Section Splitting

Based on the detected format, the document is split into logical sections:

**9 Key Element format**: Split on `Element [a-i]` headers. Each section maps to a semantic type:
- Element a → causes-and-sources
- Element b → expected-load-reduction
- Element c → proposed-management-measures
- Element d → technical-financial-assistance (contains BMP cost tables)
- Element e → information-education
- Element f → implementation-schedule
- Element g → milestones-outcomes
- Element h → load-reduction-evaluation (contains water quality thresholds)
- Element i → monitoring

**Chapter-based format**: Split on Roman numeral headers (I. through XII.). Appendix B (319 Project Proposal) is extracted separately to avoid double-counting budgets.

### Step 4: Regex Extraction (High-Confidence Data)

Regex patterns extract structured/tabular data with near-100% accuracy:

#### Metadata
- **HUC code**: `/HUC\s+(\d{12}|\d{8})/i`
- **Watershed name**: First line matching `Creek|River|Branch|Canal` before "Plan" or "Implementation"
- **Plan year**: `FY\d{2}` or full date patterns
- **County**: `located in [County Name] County`
- **Acreage**: `covering|approximately N,NNN acres`

#### BMP Cost Tables
Primary pattern targets rows with: `Practice Name | Unit | # Units | Unit Cost | Est. Cost`
```regex
/^([A-Z][\w\s\/\-&]+?)\s+(?:(ac|ft|ea|cu\s*yd|sq\s*ft|gal)\s+)([\d,]+)\s+\$?([\d,.]+)\s+\$?([\d,.]+)/gim
```

Validation: For each extracted row, `numberOfUnits * unitCost` is checked against `estimatedCost` within 5% tolerance.

Alternative pattern handles the 2012 format: `Practice | Area Affected | BMP Cost | BMP Total`

#### Water Quality Thresholds
Individual patterns for each parameter (Dissolved Oxygen, pH, Temperature, TSS, Turbidity, etc.) extract the threshold value.

#### TMDLs
- Sediment: `/reduction of (\d+% to \d+%) is recommended/i`
- Phosphorus: `/Total Phosphorus.*?(\d+)%/i`
- Nitrogen: `/Total Nitrogen.*?(\d+)%/i`

#### Land Use
Percentage patterns: `/(\d+)%\s*cropland/i`, `/(\d+)%\s*pasture/i`, etc.

#### Total Costs
- Full project: `/Total Estimated Project Cost\s+\$([\d,]+)/i`
- Phase 1: `/Phase 1 Estimated.*?Cost\s+\$([\d,]+)/i`

### Step 5: LLM Extraction (Unstructured Content)

**Model**: OpenAI GPT-4o-mini (chosen for speed and cost efficiency)

Each section type gets a targeted system prompt with:
- Specific JSON output schema
- Category definitions (e.g., BMP categories: structural, vegetative, management)
- Instructions to extract only explicitly stated information
- Few-shot category examples

**Sections processed by LLM**:

| Section Type | LLM Function | What It Extracts |
|---|---|---|
| Causes/sources + Load reduction | `extractGoalsWithLLM` | Goals, TMDL targets, delisting objectives |
| Financial assistance + Management | `extractBMPsWithLLM` | BMP practices (supplements regex) |
| Implementation schedule | `extractImplementationWithLLM` | Numbered activities with month ranges |
| Education/outreach | `extractOutreachWithLLM` | Programs, budgets, indicators |
| Preamble/metadata | `extractMetadataWithLLM` | Document title, watershed name (fills regex gaps) |

**Key LLM prompt design decisions**:
- `temperature: 0.1` for consistent, factual output
- `response_format: { type: "json_object" }` ensures valid JSON
- Text truncated to 12,000 chars to stay within context limits
- System prompts include category definitions to standardize classification

### Step 6: Merge and Validate

**BMP Merging Strategy**:
- If regex found ≥70% as many BMPs as LLM: use regex as base (higher number confidence), add LLM-only finds
- If LLM found significantly more: use LLM as base, overwrite costs with regex values where matched
- Deduplication by normalized practice name + cost similarity

**Metadata Merging**: Regex values take priority (exact matches), LLM fills gaps.

**Final assembly**: All extracted data is merged into the `ExtractedReport` interface with computed summary statistics.

## Accuracy Design Decisions

1. **Regex for numbers**: BMP costs, acreages, percentages, and thresholds are extracted with regex to ensure exact-copy fidelity
2. **LLM for semantics**: Goals, activity descriptions, and categorizations use LLM where context understanding is needed
3. **Cross-validation**: BMP costs are validated (units × unit cost ≈ estimated cost)
4. **Format-specific splitting**: Each format gets its own section detector to avoid misalignment
5. **Appendix B awareness**: Chapter-based documents have budgets in both the main plan and Appendix B; the pipeline extracts from the main plan tables to avoid double-counting
