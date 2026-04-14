import { BMP, WaterQualityThreshold, GeographicArea, TMDL, MonitoringMetric, ReportMetadata } from "../types/extraction";
import { DocumentFormat } from "../types/extraction";

/**
 * Pre-LLM extraction using regex patterns for high-confidence structured data.
 * These patterns target tabular data that appears consistently across documents.
 */

export function extractMetadataWithRegex(
  text: string,
  format: DocumentFormat
): Partial<ReportMetadata> {
  const metadata: Partial<ReportMetadata> = {
    state: "Mississippi",
    documentFormat: format,
  };

  // HUC code - always present
  const hucMatch = text.match(/HUC\s+(\d{12}|\d{8}(?:-\d{4})?)/i);
  if (hucMatch) metadata.hucCode = hucMatch[1].replace(/-/g, "");

  // Watershed name - typically in the title or first few lines
  const nameMatch = text.match(
    /^([\w\s\-]+(?:Creek|River|Branch|Canal|Watershed)[\w\s\-]*?)(?:\s+Watershed)?\s+(?:Plan|Implementation|9\s*Key)/im
  );
  if (nameMatch) metadata.watershedName = nameMatch[1].trim();

  // Plan year
  const yearMatch = text.match(
    /(?:FY|GY)\s*(\d{2})|(?:March|April|May|June|July|August|September|October|November|December|January|February)\s+\d{1,2},?\s+(\d{4})/i
  );
  if (yearMatch) {
    if (yearMatch[1]) {
      metadata.planYear = 2000 + parseInt(yearMatch[1]);
    } else if (yearMatch[2]) {
      metadata.planYear = parseInt(yearMatch[2]);
    }
  }

  // County
  const countyMatch = text.match(
    /(?:located\s+in|within)\s+([\w\s]+?)\s+Count(?:y|ies)/i
  );
  if (countyMatch) metadata.county = countyMatch[1].trim() + " County";

  // Multiple counties
  const multiCountyMatch = text.match(
    /([\w]+)\s+and\s+([\w]+)\s+counties/i
  );
  if (multiCountyMatch) {
    metadata.county = `${multiCountyMatch[1]} and ${multiCountyMatch[2]} Counties`;
  }

  // Acreage
  const acreageMatch = text.match(
    /(?:covering|approximately|contains?)\s+([\d,]+)[\s-]*acres/i
  );
  if (acreageMatch) {
    metadata.totalAcreage = parseInt(acreageMatch[1].replace(/,/g, ""));
  }

  // Alternative acreage patterns
  if (!metadata.totalAcreage) {
    const altAcreage = text.match(
      /(?:(\d[\d,]+)\s*acres?\s*(?:located\s+)?within)/i
    );
    if (altAcreage) {
      metadata.totalAcreage = parseInt(altAcreage[1].replace(/,/g, ""));
    }
  }

  return metadata;
}

export function extractAllCounties(text: string): string[] {
  const counties = new Set<string>();

  const singleMatch = text.matchAll(/(?:located\s+in|within)\s+([\w\s]+?)\s+Count(?:y|ies)/gi);
  for (const m of singleMatch) {
    counties.add(m[1].trim() + " County");
  }

  const multiMatch = text.matchAll(/([\w]+)\s+and\s+([\w]+)\s+[Cc]ounties/g);
  for (const m of multiMatch) {
    counties.add(m[1].trim() + " County");
    counties.add(m[2].trim() + " County");
  }

  const commaMatch = text.matchAll(/((?:[\w]+\s*,\s*)+[\w]+)\s+and\s+([\w]+)\s+[Cc]ounties/g);
  for (const m of commaMatch) {
    const parts = (m[1] + "," + m[2]).split(",").map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      counties.add(p + " County");
    }
  }

  return Array.from(counties);
}

export function extractBMPsWithRegex(text: string): Partial<BMP>[] {
  const bmps: Partial<BMP>[] = [];
  const seenKeys = new Set<string>();

  function addBMP(bmp: Partial<BMP>) {
    const key = normalizeKey(bmp.practiceName || "") + "|" + (bmp.estimatedCost || 0);
    if (!seenKeys.has(key) && bmp.practiceName && (bmp.estimatedCost || 0) > 0) {
      seenKeys.add(key);
      bmps.push(bmp);
    }
  }

  function normalizeKey(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  // Pattern 1 (9-key-element): Practice Name | Unit | No of Units | Unit Cost | Estimated Cost
  const tableRowPattern =
    /^([A-Z][\w\s\/\-&().]+?)\s+(?:(ac|ft|ea|cu\s*yd|sq\s*ft|gal|each|acres?|feet|structures?|units?|mi|miles?|lf|ln\.?\s*ft)\s+)([\d,]+(?:\.\d+)?)\s+\$?([\d,.]+)\s+\$?([\d,.]+)/gim;

  let match;
  while ((match = tableRowPattern.exec(text)) !== null) {
    const practiceName = match[1].trim();
    const unit = match[2].trim();
    const numberOfUnits = parseFloat(match[3].replace(/,/g, ""));
    const unitCost = parseFloat(match[4].replace(/,/g, ""));
    const estimatedCost = parseFloat(match[5].replace(/,/g, ""));

    if (estimatedCost > 0) {
      addBMP({
        practiceName,
        unit,
        numberOfUnits,
        unitCost,
        estimatedCost,
        category: categorizeBMP(practiceName),
      });
    }
  }

  // Pattern 2 (2012 chapter-based): Practice | Area Affected | BMP Cost | BMP Total
  const altPattern =
    /^([A-Z][\w\s\/\-&().]+?)\s+([\d,]+(?:\.\d+)?\s*(?:acres?|feet|structures?|each|sq(?:uare)?\s*feet|units?|mi|miles?))\s+\$?([\d,.]+)\/?\w*\s+\$?([\d,.]+)/gim;

  while ((match = altPattern.exec(text)) !== null) {
    const practiceName = match[1].trim();
    const areaAffected = match[2].trim();
    const cost = parseFloat(match[3].replace(/,/g, ""));
    const total = parseFloat(match[4].replace(/,/g, ""));

    const numMatch = areaAffected.match(/([\d,]+(?:\.\d+)?)/);
    const numberOfUnits = numMatch
      ? parseFloat(numMatch[1].replace(/,/g, ""))
      : 0;
    const unitStr = areaAffected.replace(/[\d,.\s]+/, "").trim();

    addBMP({
      practiceName,
      unit: unitStr || "unit",
      numberOfUnits,
      unitCost: cost,
      estimatedCost: total,
      category: categorizeBMP(practiceName),
    });
  }

  // Pattern 3 (pipe-delimited or tab-delimited tables)
  const pipePattern =
    /([A-Z][\w\s\/\-&().]+?)\s*[|\t]\s*([\w\s.]+?)\s*[|\t]\s*([\d,]+(?:\.\d+)?)\s*[|\t]\s*\$?([\d,.]+)\s*[|\t]\s*\$?([\d,.]+)/gim;

  while ((match = pipePattern.exec(text)) !== null) {
    const practiceName = match[1].trim();
    const unit = match[2].trim();
    const numberOfUnits = parseFloat(match[3].replace(/,/g, ""));
    const unitCost = parseFloat(match[4].replace(/,/g, ""));
    const estimatedCost = parseFloat(match[5].replace(/,/g, ""));

    if (estimatedCost > 0) {
      addBMP({
        practiceName,
        unit,
        numberOfUnits,
        unitCost,
        estimatedCost,
        category: categorizeBMP(practiceName),
      });
    }
  }

  // Pattern 4 (loose): Practice Name followed by a dollar amount on the same line
  const loosePattern =
    /^([A-Z][\w\s\/\-&().]{5,40}?)\s+\$?([\d,]+(?:\.\d{2}))\s*$/gim;

  while ((match = loosePattern.exec(text)) !== null) {
    const practiceName = match[1].trim();
    const estimatedCost = parseFloat(match[2].replace(/,/g, ""));

    if (estimatedCost > 100 && !practiceName.match(/total|subtotal|management|monitoring|education|technical/i)) {
      addBMP({
        practiceName,
        unit: "",
        numberOfUnits: 0,
        unitCost: 0,
        estimatedCost,
        category: categorizeBMP(practiceName),
      });
    }
  }

  return bmps;
}

function categorizeBMP(name: string): string {
  const structural = [
    "grade stabilization",
    "sediment basin",
    "diversion",
    "pond",
    "terrace",
    "structure",
    "underground outlet",
    "pipeline",
    "reservoir",
    "dam",
    "stream crossing",
    "water control",
  ];
  const vegetative = [
    "cover crop",
    "filter strip",
    "field border",
    "grassed waterway",
    "tree",
    "shrub",
    "planting",
    "forest",
    "biomass",
    "prescribed burning",
    "brush management",
    "weed management",
    "pasture",
    "hay land",
  ];
  const management = [
    "nutrient management",
    "prescribed grazing",
    "livestock",
    "fencing",
    "fence",
    "watering",
    "tank",
    "trough",
    "heavy use",
    "firebreak",
    "habitat",
    "land clearing",
    "critical area",
  ];

  const lower = name.toLowerCase();
  if (structural.some((s) => lower.includes(s))) return "structural";
  if (vegetative.some((v) => lower.includes(v))) return "vegetative";
  if (management.some((m) => lower.includes(m))) return "management";
  return "other";
}

export function extractWaterQualityThresholds(
  text: string
): WaterQualityThreshold[] {
  const thresholds: WaterQualityThreshold[] = [];

  const patterns = [
    { param: "Dissolved Oxygen", regex: /Dissolved\s+Oxygen\s+(Daily\s+Average[^;\n]+)/i },
    { param: "Dissolved Oxygen % Sat", regex: /Dissolved\s+Oxygen\s+%\s+Sat\s+([\u2265≥>]?\s*\d+%?\s*[-–]\s*[\u2264≤<]?\s*\d+%?)/i },
    { param: "pH", regex: /pH\s+([\d.]+\s*[-–]\s*[\d.]+)/i },
    { param: "Temperature", regex: /Temperature\s+(Not\s+to\s+exceed[^;\n]+|[\d]+°?F)/i },
    { param: "Specific Conductance", regex: /Specific\s+Conductance\s+(Less\s+[Tt]han[^;\n]+|\d+[^;\n]+micromhos)/i },
    { param: "Total Suspended Solids", regex: /Total\s+Suspended\s+Solids\s+([\d.]+\s*mg\/L)/i },
    { param: "Turbidity", regex: /Turbidity\s+([\d.]+\s*NTU)/i },
    { param: "Chemical Oxygen Demand", regex: /Chemical\s+Oxygen\s+Demand\s+([\d.]+\s*mg\/L)/i },
    { param: "Total Nitrogen", regex: /Total\s+Nitrogen\s+([\d.]+\s*mg\/L[^;\n]*)/i },
    { param: "Total Phosphorus", regex: /Total\s+Phosphorus\s+([\d.]+\s*mg\/L[^;\n]*)/i },
    { param: "M-BISQ", regex: /M-BISQ[^;\n]*([\d.]+\s+Calibration[^;\n]*)/i },
  ];

  for (const { param, regex } of patterns) {
    const match = text.match(regex);
    if (match) {
      thresholds.push({
        parameter: param,
        threshold: match[1].trim(),
      });
    }
  }

  // Dissolved Solids separate pattern
  const dsMatch = text.match(
    /Dissolved\s+Solids\s+(Monthly\s+average[^;\n]+)/i
  );
  if (dsMatch) {
    thresholds.push({
      parameter: "Dissolved Solids",
      threshold: dsMatch[1].trim(),
    });
  }

  return thresholds;
}

export function extractLandUse(text: string): Record<string, number> {
  const landUse: Record<string, number> = {};

  const patterns = [
    { key: "cropland", regex: /(\d+)%?\s*(?:\([^)]*\)\s*)?cropland/i },
    { key: "pasture", regex: /(\d+)%?\s*(?:\([^)]*\)\s*)?pasture(?:land)?/i },
    { key: "forest", regex: /(\d+)%?\s*(?:\([^)]*\)\s*)?forest(?:land|ry)?/i },
    { key: "wetlands", regex: /(\d+)%?\s*(?:\([^)]*\)\s*)?wetlands?/i },
    { key: "urban", regex: /(\d+)%?\s*(?:\([^)]*\)\s*)?urban/i },
    { key: "other", regex: /(\d+)%?\s*(?:\([^)]*\)\s*)?other/i },
  ];

  for (const { key, regex } of patterns) {
    const match = text.match(regex);
    if (match) {
      landUse[key] = parseInt(match[1]);
    }
  }

  // Alternative pattern for "XX% (YYYY acres) category"
  const altPattern = /approximately\s+(\d+)%\s*\([\d,]+\s*acres?\)\s*(forest(?:ry|land)?|cropland|pasture(?:land)?|grassland)/gi;
  let altMatch;
  while ((altMatch = altPattern.exec(text)) !== null) {
    const pct = parseInt(altMatch[1]);
    const category = altMatch[2].toLowerCase();
    if (category.includes("forest")) landUse["forest"] = pct;
    else if (category.includes("crop")) landUse["cropland"] = pct;
    else if (category.includes("pasture") || category.includes("grass")) landUse["pasture"] = pct;
  }

  return landUse;
}

export function extractTMDLs(text: string): Partial<TMDL>[] {
  const tmdls: Partial<TMDL>[] = [];

  // Sediment reduction patterns
  const sedimentMatch = text.match(
    /reduction\s+(?:in\s+sediment\s+)?of\s+(\d+%?\s*(?:to|-)\s*\d+%?)\s+is\s+recommended/i
  );
  if (sedimentMatch) {
    tmdls.push({
      pollutant: "Sediment",
      reductionRequired: sedimentMatch[1].replace(/-/g, " to "),
      targetValue: "Stable stream conditions",
    });
  }

  // Nutrient reduction patterns
  const tpMatch = text.match(
    /(?:Total\s+Phosphorus|TP)\s*(?:reduction\s+of\s+)?(\d+)%/i
  );
  if (tpMatch) {
    tmdls.push({
      pollutant: "Total Phosphorus",
      reductionRequired: `${tpMatch[1]}%`,
      targetValue: "0.10 mg/L",
    });
  }

  const tnMatch = text.match(
    /(?:Total\s+Nitrogen|TN)\s*(?:reduction\s+of\s+)?(\d+)%/i
  );
  if (tnMatch) {
    tmdls.push({
      pollutant: "Total Nitrogen",
      reductionRequired: `${tnMatch[1]}%`,
      targetValue: "0.70 mg/L",
    });
  }

  // Nutrient load reduction for chapter-based docs
  const nutrientMatch = text.match(
    /(\d+)\s*(?:to|-)\s*(\d+)%\s*reduction\s+of\s+the\s+nutrient\s+loads/i
  );
  if (nutrientMatch) {
    tmdls.push({
      pollutant: "Nutrients",
      reductionRequired: `${nutrientMatch[1]}-${nutrientMatch[2]}%`,
      targetValue: "Meet water quality standards",
    });
  }

  // Phosphorus reduction from chapter-based
  const pReductionMatch = text.match(
    /(\d+)%\s*reduction\s+(?:of\s+)?phosphor(?:us|ous)/i
  );
  if (pReductionMatch && !tpMatch) {
    tmdls.push({
      pollutant: "Phosphorus",
      reductionRequired: `${pReductionMatch[1]}%`,
      targetValue: "Meet TMDL targets",
    });
  }

  return tmdls;
}

export function extractMonitoringStations(text: string): Partial<MonitoringMetric>[] {
  const stations: Partial<MonitoringMetric>[] = [];

  // Pattern for monitoring tables
  const stationPattern =
    /([A-Z]{2}\d{3}[A-Z]?\d*|NI\d{3})\s+([\w\s]+?(?:Creek|River|Branch|Canal))\s+(\d{4}(?:,\s*\d{4})*)\s+(MDEQ|USGS)\s+(\w+)/gi;

  let match;
  while ((match = stationPattern.exec(text)) !== null) {
    const dataTypes: string[] = [];
    const restOfLine = text.substring(match.index, match.index + 200);
    if (/Water\s*Chem|X\s+X/i.test(restOfLine)) dataTypes.push("Water Chemistry");
    if (/In-?\s*Situ/i.test(restOfLine)) dataTypes.push("In-Situ");
    if (/Benthic|Algal/i.test(restOfLine)) dataTypes.push("Benthics/Algal");

    stations.push({
      stationId: match[1],
      waterBody: match[2].trim(),
      samplingYears: match[3],
      agency: match[4],
      dataTypes: dataTypes.length > 0 ? dataTypes : ["Water Chemistry", "In-Situ", "Benthics/Algal"],
    });
  }

  return stations;
}

export function extractTotalCost(text: string): { fullCost: number; phase1Cost: number } {
  let fullCost = 0;
  let phase1Cost = 0;

  // "Total Estimated Project Cost $X,XXX,XXX.XX"
  const fullMatch = text.match(
    /Total\s+Estimated\s+Project\s+Cost\s+\$?([\d,]+(?:\.\d{2})?)/i
  );
  if (fullMatch) {
    fullCost = parseFloat(fullMatch[1].replace(/,/g, ""));
  }

  // Phase 1 cost
  const phase1Match = text.match(
    /Phase\s+1\s+Estimated\s+(?:Project\s+)?Cost\s+\$?([\d,]+(?:\.\d{2})?)/i
  );
  if (phase1Match) {
    phase1Cost = parseFloat(phase1Match[1].replace(/,/g, ""));
  }

  // Alternative: just "Total $XXX,XXX" at end of budget table
  if (!fullCost) {
    const altTotal = text.match(/Total\s+\$?([\d,]+(?:\.\d{2})?)\s*$/im);
    if (altTotal) {
      fullCost = parseFloat(altTotal[1].replace(/,/g, ""));
    }
  }

  return { fullCost, phase1Cost };
}
