import { v4 as uuidv4 } from "uuid";
import { ExtractedReport, ProcessingStatus, BMP, ExtractionConfidence } from "../types/extraction";
import { extractTextFromPDF } from "./pdfExtractor";
import { detectDocumentFormat, splitIntoSections } from "./formatDetector";
import {
  extractMetadataWithRegex,
  extractBMPsWithRegex,
  extractWaterQualityThresholds,
  extractLandUse,
  extractTMDLs,
  extractMonitoringStations,
  extractTotalCost,
  extractAllCounties,
} from "./regexExtractor";
import {
  extractMetadataWithLLM,
  extractGoalsWithLLM,
  extractBMPsWithLLM,
  extractImplementationWithLLM,
  extractOutreachWithLLM,
  extractAllWithLLM,
  clearLLMErrors,
  getLLMErrors,
} from "./llmExtractor";

type StatusCallback = (status: ProcessingStatus) => void;

export async function runExtractionPipeline(
  filePath: string,
  filename: string,
  onStatus?: StatusCallback
): Promise<ExtractedReport & { detectedCounties?: string[] }> {
  const id = uuidv4();
  const startTime = Date.now();
  const warnings: string[] = [];

  clearLLMErrors();

  const updateStatus = (
    status: ProcessingStatus["status"],
    progress: number,
    message: string
  ) => {
    onStatus?.({ id, filename, status, progress, message });
  };

  try {
    // Step 1: Extract text from PDF
    updateStatus("extracting-text", 10, "Extracting text from PDF...");
    const rawText = await extractTextFromPDF(filePath);

    if (rawText.length < 100) {
      throw new Error("PDF appears to be empty or image-based. Could not extract sufficient text.");
    }

    // Step 2: Detect document format
    updateStatus("detecting-format", 20, "Detecting document format...");
    const detection = detectDocumentFormat(rawText);
    const format = detection.format;

    if (format === "generic") {
      warnings.push("Document did not match known format patterns (9-Key-Element or Chapter-based). Using generic extraction — results may be less structured.");
    }

    // Step 3: Split into sections (with automatic fallback chain)
    updateStatus("splitting-sections", 30, "Splitting document into sections...");
    const sections = splitIntoSections(rawText, format);

    if (sections.length < 2) {
      warnings.push("Could not split document into meaningful sections. Using full-text LLM extraction.");
    }

    // Step 4: Regex-based extraction (fast, high-confidence)
    updateStatus("llm-extraction", 40, "Extracting structured data with regex...");

    const regexMetadata = extractMetadataWithRegex(rawText, format);
    const detectedCounties = extractAllCounties(rawText);
    const regexBMPs = extractBMPsWithRegex(rawText);
    const waterQualityThresholds = extractWaterQualityThresholds(rawText);
    const landUse = extractLandUse(rawText);
    const regexTMDLs = extractTMDLs(rawText);
    const monitoringStations = extractMonitoringStations(rawText);
    const costs = extractTotalCost(rawText);

    // Step 5: LLM-based extraction
    updateStatus("llm-extraction", 50, "Running LLM extraction...");

    let goals = await extractGoalsFromSections(sections, rawText);
    let llmBMPs = await extractBMPsFromSections(sections, rawText);
    let implementation = await extractImplementationFromSections(sections, rawText);
    let outreach = await extractOutreachFromSections(sections, rawText);

    updateStatus("llm-extraction", 75, "Checking extraction completeness...");

    // Fallback: if section-based extraction produced very little data,
    // run a full-document LLM pass
    const hasThinResults =
      goals.length === 0 &&
      llmBMPs.length === 0 &&
      implementation.length === 0 &&
      outreach.length === 0;

    if (hasThinResults && rawText.length > 200) {
      warnings.push("Section-based extraction yielded no results. Running full-document LLM extraction.");
      updateStatus("llm-extraction", 80, "Running full-document LLM extraction...");

      const fullResult = await extractAllWithLLM(rawText);
      if (fullResult.goals.length > goals.length) goals = fullResult.goals;
      if (fullResult.bmps.length > llmBMPs.length) llmBMPs = fullResult.bmps;
      if (fullResult.implementation.length > implementation.length) implementation = fullResult.implementation;
      if (fullResult.outreach.length > outreach.length) outreach = fullResult.outreach;
    }

    // LLM metadata (to fill gaps from regex)
    const preamble = sections.find((s) => s.sectionType === "preamble");
    let llmMetadata: Partial<typeof regexMetadata> = {};
    try {
      llmMetadata = await extractMetadataWithLLM(
        preamble?.content || "",
        rawText.substring(0, 5000)
      );
    } catch {
      warnings.push("LLM metadata extraction failed, using regex-only metadata.");
    }

    // Step 6: Merge and validate
    updateStatus("validating", 90, "Merging and validating results...");

    const mergedBMPs = mergeBMPs(regexBMPs, llmBMPs);
    const metadata = { ...llmMetadata, ...regexMetadata };

    // Collect LLM errors as warnings
    const llmErrors = getLLMErrors();
    for (const err of llmErrors) {
      warnings.push(`LLM error in ${err.section}: ${err.error}`);
    }

    // Build confidence report
    const expectedSections = format === "9-key-element" ? 9 : format === "chapter-based" ? 11 : 5;
    const confidence: ExtractionConfidence = {
      formatDetected: format,
      formatScore: detection.score,
      sectionsFound: sections.length,
      sectionsExpected: expectedSections,
      regexBMPsFound: regexBMPs.length,
      llmBMPsFound: llmBMPs.length,
      warnings,
      dataCompleteness: {
        metadata: Boolean(metadata.watershedName && metadata.hucCode),
        goals: goals.length > 0,
        bmps: mergedBMPs.length > 0,
        implementation: implementation.length > 0,
        outreach: outreach.length > 0,
        waterQuality: waterQualityThresholds.length > 0,
        monitoring: monitoringStations.length > 0,
        tmdls: regexTMDLs.length > 0,
        landUse: Object.keys(landUse).length > 0,
      },
    };

    const report: ExtractedReport = {
      id,
      filename,
      uploadedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
      metadata: {
        documentTitle: metadata.documentTitle || filename.replace(".pdf", ""),
        watershedName: metadata.watershedName || "Unknown Watershed",
        hucCode: metadata.hucCode || "",
        county: metadata.county || "",
        state: "Mississippi",
        planYear: metadata.planYear || 0,
        totalAcreage: metadata.totalAcreage || 0,
        documentFormat: format,
      },
      summary: {
        totalGoals: goals.length,
        totalBMPs: mergedBMPs.length,
        totalEstimatedCost: costs.fullCost || mergedBMPs.reduce((sum, b) => sum + (b.estimatedCost || 0), 0),
        phase1Cost: costs.phase1Cost,
        completionRate: 0,
      },
      goals,
      bmps: mergedBMPs.map((b, i) => ({
        id: `bmp-${i + 1}`,
        practiceName: b.practiceName || "",
        unit: b.unit || "",
        numberOfUnits: b.numberOfUnits || 0,
        unitCost: b.unitCost || 0,
        estimatedCost: b.estimatedCost || 0,
        category: b.category || "other",
        phase: b.phase || "full",
      })),
      implementation,
      monitoring: monitoringStations.map((s) => ({
        stationId: s.stationId || "",
        waterBody: s.waterBody || "",
        samplingYears: s.samplingYears || "",
        agency: s.agency || "",
        dataTypes: s.dataTypes || [],
      })),
      outreach,
      geographicAreas: [
        {
          name: metadata.watershedName || "Primary Watershed",
          type: "watershed",
          acreage: metadata.totalAcreage || 0,
          landUse,
        },
      ],
      waterQualityThresholds,
      tmdls: regexTMDLs.map((t) => ({
        name: `${t.pollutant} TMDL`,
        pollutant: t.pollutant || "",
        reductionRequired: t.reductionRequired || "",
        targetValue: t.targetValue || "",
      })),
      confidence,
    };

    updateStatus("complete", 100, "Extraction complete!");
    return { ...report, detectedCounties: detectedCounties.length > 1 ? detectedCounties : undefined };
  } catch (error: any) {
    updateStatus("error", 0, error.message || "Extraction failed");
    throw error;
  }
}

// --- Section-aware extraction helpers with full-text fallback ---

async function extractGoalsFromSections(
  sections: { sectionType: string; content: string }[],
  rawText: string
) {
  const goalSections = sections.filter((s) =>
    ["causes-and-sources", "expected-load-reduction", "executive-summary", "water-resources", "watershed-management", "general"].includes(s.sectionType)
  );
  const goalText = goalSections.map((s) => s.content).join("\n\n");

  if (goalText.trim().length > 50) {
    return extractGoalsWithLLM(goalText);
  }
  return extractGoalsWithLLM(rawText.substring(0, 30000));
}

async function extractBMPsFromSections(
  sections: { sectionType: string; content: string }[],
  rawText: string
): Promise<Partial<BMP>[]> {
  const bmpSections = sections.filter((s) =>
    ["technical-financial-assistance", "watershed-management", "appendix-b-proposal", "general"].includes(s.sectionType)
  );

  let llmBMPs: Partial<BMP>[] = [];
  if (bmpSections.length > 0) {
    for (const section of bmpSections) {
      const sectionBMPs = await extractBMPsWithLLM(section.content);
      llmBMPs = llmBMPs.concat(sectionBMPs);
    }
  }

  if (llmBMPs.length === 0) {
    const costTableMatch = rawText.match(/(?:Practice\s+Name|BMP\s+Practice|Management\s+Measure)([\s\S]{0,15000}?)(?:Total\s+(?:Estimated\s+)?(?:Project\s+)?Cost|Subtotal|\n\s*\n\s*\n)/i);
    if (costTableMatch) {
      llmBMPs = await extractBMPsWithLLM(costTableMatch[0]);
    }
  }

  return llmBMPs;
}

async function extractImplementationFromSections(
  sections: { sectionType: string; content: string }[],
  rawText: string
) {
  const implSections = sections.filter((s) =>
    ["implementation-schedule", "milestones-outcomes", "watershed-management", "general"].includes(s.sectionType)
  );
  const implText = implSections.map((s) => s.content).join("\n\n");

  if (implText.trim().length > 50) {
    return extractImplementationWithLLM(implText);
  }

  const scheduleMatch = rawText.match(/(?:Implementation\s+Schedule|Implementation\s+Activities|Project\s+Timeline)([\s\S]{0,10000}?)(?=\n\s*(?:Element|Chapter|\d+\.|[A-Z]{3,}))/i);
  if (scheduleMatch) {
    return extractImplementationWithLLM(scheduleMatch[0]);
  }

  return [];
}

async function extractOutreachFromSections(
  sections: { sectionType: string; content: string }[],
  rawText: string
) {
  const outreachSections = sections.filter((s) =>
    ["information-education", "education-outreach", "general"].includes(s.sectionType)
  );
  const outreachText = outreachSections.map((s) => s.content).join("\n\n");

  if (outreachText.trim().length > 50) {
    return extractOutreachWithLLM(outreachText);
  }

  const outreachMatch = rawText.match(/(?:Education|Outreach|Information\s+and\s+Education)([\s\S]{0,10000}?)(?=\n\s*(?:Element|Chapter|\d+\.|[A-Z]{3,}))/i);
  if (outreachMatch) {
    return extractOutreachWithLLM(outreachMatch[0]);
  }

  return [];
}

// --- BMP merge logic ---

function mergeBMPs(
  regexBMPs: Partial<BMP>[],
  llmBMPs: Partial<BMP>[]
): Partial<BMP>[] {
  if (regexBMPs.length === 0 && llmBMPs.length === 0) return [];
  if (regexBMPs.length === 0) return llmBMPs;
  if (llmBMPs.length === 0) return regexBMPs;

  if (regexBMPs.length >= llmBMPs.length * 0.7) {
    const merged = [...regexBMPs];
    for (const llmBmp of llmBMPs) {
      const exists = merged.some(
        (r) =>
          r.practiceName &&
          llmBmp.practiceName &&
          normalizeString(r.practiceName) === normalizeString(llmBmp.practiceName) &&
          Math.abs((r.estimatedCost || 0) - (llmBmp.estimatedCost || 0)) < 100
      );
      if (!exists && llmBmp.practiceName && llmBmp.estimatedCost) {
        merged.push(llmBmp);
      }
    }
    return merged;
  }

  return llmBMPs.map((llmBmp) => {
    const regexMatch = regexBMPs.find(
      (r) =>
        r.practiceName &&
        llmBmp.practiceName &&
        normalizeString(r.practiceName) === normalizeString(llmBmp.practiceName)
    );
    if (regexMatch) {
      return { ...llmBmp, ...regexMatch };
    }
    return llmBmp;
  });
}

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}
