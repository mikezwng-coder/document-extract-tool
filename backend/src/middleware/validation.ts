import { Request, Response, NextFunction } from "express";

export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file provided" });
    return;
  }

  if (req.file.mimetype !== "application/pdf") {
    res.status(400).json({ error: "Only PDF files are allowed" });
    return;
  }

  if (req.file.size > 100 * 1024 * 1024) {
    res.status(400).json({ error: "File size exceeds 100MB limit" });
    return;
  }

  if (!req.file.originalname.toLowerCase().endsWith(".pdf")) {
    res.status(400).json({ error: "File must have .pdf extension" });
    return;
  }

  next();
}

export function validateParamId(paramName: string = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      res.status(400).json({ error: `Missing or invalid parameter: ${paramName}` });
      return;
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      res.status(400).json({ error: `Invalid ${paramName} format. Expected UUID.` });
      return;
    }

    next();
  };
}

export function validateCountySelection(req: Request, res: Response, next: NextFunction): void {
  const { county } = req.body;

  if (!county || typeof county !== "string") {
    res.status(400).json({ error: "county is required and must be a string" });
    return;
  }

  if (county.trim().length === 0) {
    res.status(400).json({ error: "county must not be empty" });
    return;
  }

  if (county.length > 200) {
    res.status(400).json({ error: "county name is too long" });
    return;
  }

  next();
}
