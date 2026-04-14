import {
  ProcessingStatus,
  ExtractedReport,
  ReportListItem,
} from "../types/extraction";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function uploadPDF(
  file: File,
): Promise<{ jobId: string; filename: string }> {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  return response.json();
}

export async function getProcessingStatus(
  jobId: string,
): Promise<ProcessingStatus> {
  const response = await fetch(`${API_BASE}/upload/status/${jobId}`);
  if (!response.ok) throw new Error("Failed to get status");
  return response.json();
}

export async function getReports(): Promise<ReportListItem[]> {
  const response = await fetch(`${API_BASE}/upload/reports`);
  if (!response.ok) throw new Error("Failed to fetch reports");
  return response.json();
}

export async function getReport(id: string): Promise<ExtractedReport> {
  const response = await fetch(`${API_BASE}/upload/reports/${id}`);
  if (!response.ok) throw new Error("Report not found");
  return response.json();
}

export async function deleteReport(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/upload/reports/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete report");
}

export async function selectCounty(
  reportId: string,
  county: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/upload/reports/${reportId}/county`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ county }),
    },
  );
  if (!response.ok) throw new Error("Failed to update county");
}

export function getExportJSONUrl(id: string): string {
  return `${API_BASE}/upload/reports/${id}/export/json`;
}

export function getExportCSVUrl(id: string): string {
  return `${API_BASE}/upload/reports/${id}/export/csv`;
}

export async function checkHealth(): Promise<{
  status: string;
  hasOpenAIKey: boolean;
  hasAnthropicKey: boolean;
}> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error("Backend unavailable");
  return response.json();
}
