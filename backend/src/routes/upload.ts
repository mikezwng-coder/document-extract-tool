import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { runExtractionPipeline } from "../services/extractionPipeline";
import { reportToCSV } from "../utils/exporters";
import { ReportModel } from "../models/Report";
import { ProcessingJobModel } from "../models/ProcessingJob";
import { validateFileUpload, validateParamId, validateCountySelection } from "../middleware/validation";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const reports = new Map<string, ReportModel>();
const processingJobs = new Map<string, ProcessingJobModel>();

router.post("/", upload.single("pdf"), validateFileUpload, async (req: Request, res: Response) => {
  try {
    const jobId = uuidv4();
    const filePath = req.file!.path;
    const filename = req.file!.originalname;

    const job = new ProcessingJobModel(jobId, filename);
    processingJobs.set(jobId, job);

    res.json({ jobId, filename, message: "Processing started" });

    runExtractionPipeline(filePath, filename, (status) => {
      job.update(status.status, status.progress, status.message);
    })
      .then((result) => {
        const { detectedCounties, ...reportData } = result;
        const report = new ReportModel(reportData);
        reports.set(report.id, report);

        job.complete(report.id, detectedCounties);
        job.setResult(report.toJSON());

        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      })
      .catch((error) => {
        job.fail(error.message || "Extraction failed");
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

router.get("/status/:jobId", validateParamId("jobId"), (req: Request, res: Response) => {
  const job = processingJobs.get(req.params.jobId as string);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job.toJSON());
});

router.get("/reports", (_req: Request, res: Response) => {
  const allReports = Array.from(reports.values()).map((r) => r.toListItem());
  res.json(allReports);
});

router.get("/reports/:id", validateParamId(), (req: Request, res: Response) => {
  const report = reports.get(req.params.id as string);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(report.toJSON());
});

router.patch("/reports/:id/county", validateParamId(), validateCountySelection, (req: Request, res: Response) => {
  const report = reports.get(req.params.id as string);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  report.setCounty(req.body.county);
  res.json({ message: "County updated", county: req.body.county });
});

router.get("/reports/:id/export/json", validateParamId(), (req: Request, res: Response) => {
  const report = reports.get(req.params.id as string);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  const data = report.toJSON();
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${data.metadata.watershedName.replace(/\s+/g, "_")}_report.json"`
  );
  res.json(data);
});

router.get("/reports/:id/export/csv", validateParamId(), (req: Request, res: Response) => {
  const report = reports.get(req.params.id as string);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  const data = report.toJSON();
  const csv = reportToCSV(data);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${data.metadata.watershedName.replace(/\s+/g, "_")}_report.csv"`
  );
  res.send(csv);
});

router.delete("/reports/:id", validateParamId(), (req: Request, res: Response) => {
  const deleted = reports.delete(req.params.id as string);
  if (!deleted) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json({ message: "Report deleted" });
});

export default router;
