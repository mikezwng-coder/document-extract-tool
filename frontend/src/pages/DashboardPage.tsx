import { useState } from "react";
import { ExtractedReport } from "../types/extraction";
import { getExportJSONUrl, getExportCSVUrl } from "../services/api";
import { formatDate } from "../utils/format";
import TopTabs, { Section } from "../components/TopTabs";
import SummaryCards from "../components/SummaryCards";
import BMPChart from "../components/BMPChart";
import LandUseChart from "../components/LandUseChart";
import OutreachChart from "../components/OutreachChart";
import {
  GoalsTable,
  BMPTable,
  WaterQualityTable,
  TMDLTable,
  ImplementationTable,
  MonitoringTable,
  OutreachTable,
} from "../components/DataTables";
import ConfidencePanel from "../components/ConfidencePanel";
import { ArrowLeft, Clock, FileText, FileJson, FileSpreadsheet } from "lucide-react";

interface Props {
  report: ExtractedReport;
  onBack: () => void;
}

export default function DashboardPage({ report, onBack }: Props) {
  const [section, setSection] = useState<Section>("summary");

  const handleExport = (format: "json" | "csv") => {
    const url = format === "json" ? getExportJSONUrl(report.id) : getExportCSVUrl(report.id);
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onBack} className="btn btn-icon btn-ghost cursor-pointer shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: "var(--font-size-lg)" }}>
                {report.metadata.watershedName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-caption">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {report.metadata.documentFormat === "9-key-element"
                    ? "9 Key Element"
                    : report.metadata.documentFormat === "chapter-based"
                      ? "Chapter-Based"
                      : "Generic"}
                </span>
                {report.metadata.planYear > 0 && <span>Year: {report.metadata.planYear}</span>}
                {report.metadata.hucCode && <span className="font-mono">HUC: {report.metadata.hucCode}</span>}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(report.processingTimeMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => handleExport("json")} className="btn btn-sm btn-ghost cursor-pointer" title="Export JSON">
              <FileJson className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button onClick={() => handleExport("csv")} className="btn btn-sm btn-ghost cursor-pointer" title="Export CSV">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5">
        <div className="max-w-6xl mx-auto">
          <TopTabs active={section} onChange={setSection} />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-6xl mx-auto space-y-4">
          {section === "summary" && (
            <>
              <SummaryCards summary={report.summary} metadata={report.metadata} />
              {report.confidence && (
                <ConfidencePanel confidence={report.confidence} />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BMPChart bmps={report.bmps} />
                <LandUseChart areas={report.geographicAreas} />
              </div>
              {report.outreach.some((o) => o.budget > 0) && (
                <OutreachChart outreach={report.outreach} />
              )}
              <GoalsTable goals={report.goals} />
              <BMPTable bmps={report.bmps} />
            </>
          )}

          {section === "goals" && (
            <>
              <GoalsTable goals={report.goals} />
              <TMDLTable tmdls={report.tmdls} />
            </>
          )}

          {section === "bmps" && (
            <>
              <BMPChart bmps={report.bmps} />
              <BMPTable bmps={report.bmps} />
            </>
          )}

          {section === "implementation" && (
            <ImplementationTable activities={report.implementation} />
          )}

          {section === "monitoring" && (
            <>
              <MonitoringTable monitoring={report.monitoring} />
              <WaterQualityTable thresholds={report.waterQualityThresholds} />
            </>
          )}

          {section === "outreach" && (
            <>
              <OutreachChart outreach={report.outreach} />
              <OutreachTable outreach={report.outreach} />
            </>
          )}

          {section === "water-quality" && (
            <WaterQualityTable thresholds={report.waterQualityThresholds} />
          )}

          {section === "tmdls" && (
            <>
              <BMPChart bmps={report.bmps} />
              <LandUseChart areas={report.geographicAreas} />
              <OutreachChart outreach={report.outreach} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
