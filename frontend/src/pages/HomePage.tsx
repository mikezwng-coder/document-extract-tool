import { useState, useEffect, useCallback } from "react";
import { Trash2, Eye, AlertCircle, Target, MapPin, Activity, Megaphone, Settings, FileSearch } from "lucide-react";
import UploadZone from "../components/UploadZone";
import CountyModal from "../components/CountyModal";
import { getReport, getReports, deleteReport, checkHealth, selectCounty } from "../services/api";
import { ExtractedReport, ReportListItem } from "../types/extraction";
import { formatDate, formatCurrency } from "../utils/format";

interface Props {
  onViewReport: (report: ExtractedReport) => void;
}

const FEATURES = [
  { icon: Target, label: "Goals and implementation metrics" },
  { icon: MapPin, label: "Geographic areas covered" },
  { icon: Activity, label: "Monitoring activities" },
  { icon: Megaphone, label: "Participation & outreach data" },
  { icon: Settings, label: "Implementation metrics" },
  { icon: FileSearch, label: "Project support information" },
];

export default function HomePage({ onViewReport }: Props) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [countyModal, setCountyModal] = useState<{ reportId: string; counties: string[] } | null>(null);

  const refreshReports = useCallback(async () => {
    try {
      const list = await getReports();
      setReports(list);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    checkHealth()
      .then((h) => setBackendOk(h.status === "ok"))
      .catch(() => setBackendOk(false));
    refreshReports();
  }, [refreshReports]);

  const handleExtractionComplete = async (reportId: string, detectedCounties?: string[]) => {
    if (detectedCounties && detectedCounties.length > 1) {
      setCountyModal({ reportId, counties: detectedCounties });
      return;
    }
    await loadReport(reportId);
  };

  const handleCountySelect = async (county: string) => {
    if (!countyModal) return;
    try {
      await selectCounty(countyModal.reportId, county);
    } catch {
      /* continue anyway */
    }
    setCountyModal(null);
    await loadReport(countyModal.reportId);
  };

  const loadReport = async (id: string) => {
    try {
      setLoading(true);
      const report = await getReport(id);
      onViewReport(report);
      setError(null);
      refreshReports();
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (id: string) => {
    await loadReport(id);
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport(id);
      refreshReports();
    } catch {
      /* silent */
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-page-title">PDF Data Extractor</h2>
        <p className="text-caption max-w-xl mx-auto">
          Upload any PDF to extract relevant data and patterns. Query specific information from your documents with ease.
        </p>
      </div>

      {backendOk === false && (
        <div className="card card-body flex items-center gap-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p style={{ fontSize: "var(--font-size-sm)" }}>
            Backend server is not reachable. Start it with <code className="font-mono bg-red-100 dark:bg-red-900 px-1" style={{ borderRadius: "var(--radius)" }}>npm run dev:backend</code>
          </p>
        </div>
      )}

      {error && (
        <div className="card card-body flex items-center gap-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p style={{ fontSize: "var(--font-size-sm)" }}>{error}</p>
        </div>
      )}

      <UploadZone onExtractionComplete={handleExtractionComplete} />

      <div className="card card-body">
        <p className="text-section-title mb-3" style={{ fontSize: "var(--font-size-base)" }}>What this tool extracts:</p>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-body" style={{ fontSize: "var(--font-size-sm)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {reports.length > 0 && (
        <div className="space-y-3">
          <h3 style={{ fontSize: "var(--font-size-lg)" }} className="font-semibold text-gray-900 dark:text-gray-100">
            Previous Extractions
          </h3>
          <div className="grid gap-2">
            {reports.map((r) => (
              <div key={r.id} className="card card-body flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: "var(--font-size-sm)" }}>
                    {r.watershedName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-caption">
                    <span>{r.filename}</span>
                    {r.planYear > 0 && <span>Year: {r.planYear}</span>}
                    <span>{r.totalBMPs} BMPs</span>
                    {r.totalCost > 0 && <span>{formatCurrency(r.totalCost)}</span>}
                    <span>{formatDate(r.uploadedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleViewReport(r.id)} className="btn btn-sm btn-ghost text-blue-600 dark:text-blue-400 cursor-pointer">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button onClick={() => handleDeleteReport(r.id)} className="btn btn-icon btn-danger cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="modal-overlay">
          <div className="card card-body text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-caption mt-2">Loading report...</p>
          </div>
        </div>
      )}

      {countyModal && (
        <CountyModal
          counties={countyModal.counties}
          onSelect={handleCountySelect}
          onClose={() => {
            setCountyModal(null);
            loadReport(countyModal.reportId);
          }}
        />
      )}
    </main>
  );
}
