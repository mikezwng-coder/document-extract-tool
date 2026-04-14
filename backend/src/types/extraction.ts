export interface ExtractedReport {
  id: string;
  filename: string;
  uploadedAt: string;
  processingTimeMs: number;
  metadata: ReportMetadata;
  summary: ReportSummary;
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
  waterQualityThresholds: WaterQualityThreshold[];
  tmdls: TMDL[];
  confidence?: ExtractionConfidence;
}

export interface ReportMetadata {
  documentTitle: string;
  watershedName: string;
  hucCode: string;
  county: string;
  state: string;
  planYear: number;
  totalAcreage: number;
  documentFormat: DocumentFormat;
}

export interface ExtractionConfidence {
  formatDetected: DocumentFormat;
  formatScore: number;
  sectionsFound: number;
  sectionsExpected: number;
  regexBMPsFound: number;
  llmBMPsFound: number;
  warnings: string[];
  dataCompleteness: Record<string, boolean>;
}

export interface ReportSummary {
  totalGoals: number;
  totalBMPs: number;
  totalEstimatedCost: number;
  phase1Cost: number;
  completionRate: number;
}

export interface Goal {
  id: string;
  description: string;
  targetReduction: string;
  pollutant: string;
  status: string;
}

export interface BMP {
  id: string;
  practiceName: string;
  unit: string;
  numberOfUnits: number;
  unitCost: number;
  estimatedCost: number;
  category: string;
  phase: string;
}

export interface ImplementationActivity {
  phase: string;
  activity: string;
  timeline: string;
  responsibleParty: string;
}

export interface MonitoringMetric {
  stationId: string;
  waterBody: string;
  samplingYears: string;
  agency: string;
  dataTypes: string[];
}

export interface OutreachActivity {
  activity: string;
  description: string;
  budget: number;
  indicators: string;
  schedule: string;
}

export interface GeographicArea {
  name: string;
  type: string;
  acreage: number;
  landUse: Record<string, number>;
}

export interface WaterQualityThreshold {
  parameter: string;
  threshold: string;
}

export interface TMDL {
  name: string;
  pollutant: string;
  reductionRequired: string;
  targetValue: string;
}

export type DocumentFormat = "9-key-element" | "chapter-based" | "generic";

export interface DocumentSection {
  title: string;
  content: string;
  sectionType: string;
}

export interface ProcessingStatus {
  id: string;
  filename: string;
  status: "uploading" | "extracting-text" | "detecting-format" | "splitting-sections" | "llm-extraction" | "validating" | "complete" | "error";
  progress: number;
  message: string;
  result?: ExtractedReport;
  error?: string;
  detectedCounties?: string[];
}
