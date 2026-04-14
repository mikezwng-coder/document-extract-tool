import { v4 as uuidv4 } from "uuid";
import {
  ExtractedReport,
  ReportMetadata,
  ReportSummary,
  Goal,
  BMP,
  ImplementationActivity,
  MonitoringMetric,
  OutreachActivity,
  GeographicArea,
  WaterQualityThreshold,
  TMDL,
} from "../types/extraction";

export class ReportModel {
  private data: ExtractedReport;

  constructor(data: ExtractedReport) {
    this.data = data;
  }

  static create(params: {
    filename: string;
    processingTimeMs: number;
    metadata: ReportMetadata;
    goals: Goal[];
    bmps: Partial<BMP>[];
    implementation: ImplementationActivity[];
    monitoring: Partial<MonitoringMetric>[];
    outreach: OutreachActivity[];
    geographicAreas: GeographicArea[];
    waterQualityThresholds: WaterQualityThreshold[];
    tmdls: Partial<TMDL>[];
    totalCost: number;
    phase1Cost: number;
  }): ReportModel {
    const id = uuidv4();
    const bmps = params.bmps.map((b, i) => ReportModel.normalizeBMP(b, i));

    const report: ExtractedReport = {
      id,
      filename: params.filename,
      uploadedAt: new Date().toISOString(),
      processingTimeMs: params.processingTimeMs,
      metadata: ReportModel.normalizeMetadata(params.metadata),
      summary: {
        totalGoals: params.goals.length,
        totalBMPs: bmps.length,
        totalEstimatedCost: params.totalCost || bmps.reduce((s, b) => s + b.estimatedCost, 0),
        phase1Cost: params.phase1Cost,
        completionRate: 0,
      },
      goals: params.goals,
      bmps,
      implementation: params.implementation,
      monitoring: params.monitoring.map(ReportModel.normalizeMonitoring),
      outreach: params.outreach,
      geographicAreas: params.geographicAreas,
      waterQualityThresholds: params.waterQualityThresholds,
      tmdls: params.tmdls.map(ReportModel.normalizeTMDL),
    };

    return new ReportModel(report);
  }

  get id(): string { return this.data.id; }
  get raw(): ExtractedReport { return this.data; }
  get metadata(): ReportMetadata { return this.data.metadata; }
  get summary(): ReportSummary { return this.data.summary; }

  setCounty(county: string): void {
    this.data.metadata.county = county;
  }

  toListItem() {
    return {
      id: this.data.id,
      filename: this.data.filename,
      uploadedAt: this.data.uploadedAt,
      watershedName: this.data.metadata.watershedName,
      planYear: this.data.metadata.planYear,
      totalBMPs: this.data.summary.totalBMPs,
      totalCost: this.data.summary.totalEstimatedCost,
    };
  }

  toJSON(): ExtractedReport {
    return this.data;
  }

  private static normalizeMetadata(m: Partial<ReportMetadata> & { documentFormat?: string }): ReportMetadata {
    return {
      documentTitle: m.documentTitle || "",
      watershedName: m.watershedName || "Unknown Watershed",
      hucCode: m.hucCode || "",
      county: m.county || "",
      state: m.state || "Mississippi",
      planYear: m.planYear || 0,
      totalAcreage: m.totalAcreage || 0,
      documentFormat: (m.documentFormat as ReportMetadata["documentFormat"]) || "9-key-element",
    };
  }

  private static normalizeBMP(b: Partial<BMP>, index: number): BMP {
    return {
      id: b.id || `bmp-${index + 1}`,
      practiceName: b.practiceName || "",
      unit: b.unit || "",
      numberOfUnits: b.numberOfUnits || 0,
      unitCost: b.unitCost || 0,
      estimatedCost: b.estimatedCost || 0,
      category: b.category || "other",
      phase: b.phase || "full",
    };
  }

  private static normalizeMonitoring(s: Partial<MonitoringMetric>): MonitoringMetric {
    return {
      stationId: s.stationId || "",
      waterBody: s.waterBody || "",
      samplingYears: s.samplingYears || "",
      agency: s.agency || "",
      dataTypes: s.dataTypes || [],
    };
  }

  private static normalizeTMDL(t: Partial<TMDL>): TMDL {
    return {
      name: t.name || `${t.pollutant || "Unknown"} TMDL`,
      pollutant: t.pollutant || "",
      reductionRequired: t.reductionRequired || "",
      targetValue: t.targetValue || "",
    };
  }
}
