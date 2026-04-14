import { ExtractionConfidence } from "../types/extraction";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

interface Props {
  confidence: ExtractionConfidence;
}

const LABEL_MAP: Record<string, string> = {
  metadata: "Metadata",
  goals: "Goals",
  bmps: "BMPs",
  implementation: "Implementation",
  outreach: "Outreach",
  waterQuality: "Water Quality",
  monitoring: "Monitoring",
  tmdls: "TMDLs",
  landUse: "Land Use",
};

export default function ConfidencePanel({ confidence }: Props) {
  const completenessEntries = Object.entries(confidence.dataCompleteness);
  const foundCount = completenessEntries.filter(([, v]) => v).length;
  const totalCount = completenessEntries.length;
  const pct = Math.round((foundCount / totalCount) * 100);

  const formatLabel =
    confidence.formatDetected === "9-key-element"
      ? "9 Key Element"
      : confidence.formatDetected === "chapter-based"
        ? "Chapter-Based"
        : "Generic (Unknown)";

  const scoreColor =
    pct >= 70 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="card card-body space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          Extraction Confidence
        </h3>
        <span className={`font-bold text-lg ${scoreColor}`}>{pct}%</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-caption">Format Detected</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatLabel}</p>
        </div>
        <div>
          <span className="text-caption">Format Confidence</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {confidence.formatScore}/{confidence.sectionsExpected > 9 ? 5 : 5}
          </p>
        </div>
        <div>
          <span className="text-caption">Sections Found</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {confidence.sectionsFound} / {confidence.sectionsExpected}
          </p>
        </div>
        <div>
          <span className="text-caption">BMP Sources</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            Regex: {confidence.regexBMPsFound}, LLM: {confidence.llmBMPsFound}
          </p>
        </div>
      </div>

      <div>
        <span className="text-caption block mb-1">Data Completeness</span>
        <div className="flex flex-wrap gap-1.5">
          {completenessEntries.map(([key, found]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                found
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {found ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {LABEL_MAP[key] || key}
            </span>
          ))}
        </div>
      </div>

      {confidence.warnings.length > 0 && (
        <div className="space-y-1">
          <span className="text-caption block">Warnings</span>
          {confidence.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
