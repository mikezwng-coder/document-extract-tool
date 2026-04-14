import { ExtractedReport } from "../types/extraction";

export function reportToCSV(report: ExtractedReport): string {
  const lines: string[] = [];

  // Metadata
  lines.push("=== DOCUMENT METADATA ===");
  lines.push("Field,Value");
  lines.push(`Watershed Name,"${report.metadata.watershedName}"`);
  lines.push(`HUC Code,"${report.metadata.hucCode}"`);
  lines.push(`County,"${report.metadata.county}"`);
  lines.push(`State,"${report.metadata.state}"`);
  lines.push(`Plan Year,${report.metadata.planYear}`);
  lines.push(`Total Acreage,${report.metadata.totalAcreage}`);
  lines.push(`Document Format,"${report.metadata.documentFormat}"`);
  lines.push("");

  // Summary
  lines.push("=== SUMMARY ===");
  lines.push("Metric,Value");
  lines.push(`Total Goals,${report.summary.totalGoals}`);
  lines.push(`Total BMPs,${report.summary.totalBMPs}`);
  lines.push(`Total Estimated Cost,$${report.summary.totalEstimatedCost.toLocaleString()}`);
  lines.push(`Phase 1 Cost,$${report.summary.phase1Cost.toLocaleString()}`);
  lines.push("");

  // Goals
  lines.push("=== GOALS ===");
  lines.push("ID,Description,Target Reduction,Pollutant,Status");
  for (const goal of report.goals) {
    lines.push(
      `"${goal.id}","${goal.description}","${goal.targetReduction}","${goal.pollutant}","${goal.status}"`
    );
  }
  lines.push("");

  // BMPs
  lines.push("=== BEST MANAGEMENT PRACTICES ===");
  lines.push("Practice Name,Unit,Number of Units,Unit Cost,Estimated Cost,Category,Phase");
  for (const bmp of report.bmps) {
    lines.push(
      `"${bmp.practiceName}","${bmp.unit}",${bmp.numberOfUnits},$${bmp.unitCost},$${bmp.estimatedCost},"${bmp.category}","${bmp.phase}"`
    );
  }
  lines.push("");

  // Water Quality Thresholds
  lines.push("=== WATER QUALITY THRESHOLDS ===");
  lines.push("Parameter,Threshold");
  for (const wq of report.waterQualityThresholds) {
    lines.push(`"${wq.parameter}","${wq.threshold}"`);
  }
  lines.push("");

  // TMDLs
  lines.push("=== TMDLs ===");
  lines.push("Pollutant,Reduction Required,Target Value");
  for (const tmdl of report.tmdls) {
    lines.push(`"${tmdl.pollutant}","${tmdl.reductionRequired}","${tmdl.targetValue}"`);
  }
  lines.push("");

  // Implementation
  lines.push("=== IMPLEMENTATION SCHEDULE ===");
  lines.push("Phase,Activity,Timeline,Responsible Party");
  for (const impl of report.implementation) {
    lines.push(
      `"${impl.phase}","${impl.activity}","${impl.timeline}","${impl.responsibleParty}"`
    );
  }
  lines.push("");

  // Outreach
  lines.push("=== OUTREACH ACTIVITIES ===");
  lines.push("Activity,Description,Budget,Indicators,Schedule");
  for (const out of report.outreach) {
    lines.push(
      `"${out.activity}","${out.description}",$${out.budget},"${out.indicators}","${out.schedule}"`
    );
  }

  return lines.join("\n");
}
