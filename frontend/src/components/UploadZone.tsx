import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { uploadPDF, getProcessingStatus } from "../services/api";
import { ProcessingStatus } from "../types/extraction";

interface Props {
  onExtractionComplete: (jobId: string, detectedCounties?: string[]) => void;
}

export default function UploadZone({ onExtractionComplete }: Props) {
  const [jobs, setJobs] = useState<ProcessingStatus[]>([]);

  const pollStatus = useCallback(
    async (jobId: string) => {
      const poll = async () => {
        try {
          const status = await getProcessingStatus(jobId);
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? status : j))
          );
          if (status.status === "complete") {
            onExtractionComplete(status.result?.id || jobId, status.detectedCounties);
          } else if (status.status !== "error") {
            setTimeout(poll, 1500);
          }
        } catch {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? { ...j, status: "error" as const, message: "Lost connection to server" }
                : j
            )
          );
        }
      };
      poll();
    },
    [onExtractionComplete]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const tempId = `temp-${Date.now()}`;
        setJobs((prev) => [
          ...prev,
          {
            id: tempId,
            filename: file.name,
            status: "uploading",
            progress: 0,
            message: "Uploading...",
          },
        ]);

        try {
          const { jobId } = await uploadPDF(file);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === tempId
                ? { ...j, id: jobId, status: "extracting-text", progress: 10, message: "Processing started..." }
                : j
            )
          );
          pollStatus(jobId);
        } catch (err: any) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === tempId
                ? { ...j, status: "error", progress: 0, message: err.message || "Upload failed" }
                : j
            )
          );
        }
      }
    },
    [pollStatus]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 100 * 1024 * 1024,
    multiple: true,
  });

  const activeJobs = jobs.filter((j) => j.status !== "complete");

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 transition-colors ${isDragActive ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"}`} style={{ borderRadius: "var(--radius)" }}>
            <Upload className={`w-6 h-6 ${isDragActive ? "text-blue-600" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200" style={{ fontSize: "var(--font-size-base)" }}>
              {isDragActive ? "Drop your PDF here" : "Upload your PDF"}
            </p>
            <p className="text-caption mt-0.5">Drag and drop or select a file to begin</p>
          </div>
          <button type="button" className="btn btn-md btn-primary mt-1">Select PDF</button>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div className="space-y-2">
          {activeJobs.map((job) => (
            <div key={job.id} className="card card-body">
              <div className="flex items-center gap-2">
                {job.status === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : job.status === "complete" ? (
                  <FileText className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate dark:text-gray-200" style={{ fontSize: "var(--font-size-sm)" }}>{job.filename}</p>
                  <p className={`text-caption mt-0.5 ${job.status === "error" ? "text-red-500" : ""}`}>
                    {job.message}
                  </p>
                </div>
                <span className="text-mono text-gray-400">{job.progress}%</span>
              </div>
              {job.status !== "error" && (
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                  <div
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${job.progress}%`, borderRadius: "var(--radius)" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
