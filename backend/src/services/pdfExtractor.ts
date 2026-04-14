import pdfParse from "pdf-parse";
import fs from "fs";

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  let text = data.text;

  // Clean up common PDF artifacts
  text = text.replace(/\f/g, "\n\n");
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\n{4,}/g, "\n\n\n");
  text = text.replace(/^\s+$/gm, "");

  return text;
}

export function getPageCount(filePath: string): Promise<number> {
  const buffer = fs.readFileSync(filePath);
  return pdfParse(buffer).then((data) => data.numpages);
}
