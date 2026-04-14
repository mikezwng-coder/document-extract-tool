import { ProcessingStatus } from "../types/extraction";

export class ProcessingJobModel {
  private data: ProcessingStatus;

  constructor(id: string, filename: string) {
    this.data = {
      id,
      filename,
      status: "uploading",
      progress: 5,
      message: "File uploaded, starting extraction...",
    };
  }

  get id(): string { return this.data.id; }
  get status(): ProcessingStatus["status"] { return this.data.status; }

  update(status: ProcessingStatus["status"], progress: number, message: string): void {
    this.data.status = status;
    this.data.progress = progress;
    this.data.message = message;
  }

  complete(reportId: string, detectedCounties?: string[]): void {
    this.data.status = "complete";
    this.data.progress = 100;
    this.data.message = "Extraction complete";
    if (detectedCounties && detectedCounties.length > 0) {
      this.data.detectedCounties = detectedCounties;
    }
  }

  fail(error: string): void {
    this.data.status = "error";
    this.data.progress = 0;
    this.data.message = error;
    this.data.error = error;
  }

  setResult(result: ProcessingStatus["result"]): void {
    this.data.result = result;
  }

  toJSON(): ProcessingStatus {
    return { ...this.data };
  }
}
