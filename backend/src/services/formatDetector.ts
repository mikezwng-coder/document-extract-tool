import { DocumentFormat, DocumentSection } from "../types/extraction";

const NINE_KEY_ELEMENT_PATTERNS = [
  /Element\s+[a-i]\s*[:\-\.]/i,
  /Element\s+[a-i]\s*\n/i,
  /9\s*Key\s*Element/i,
  /HUC\s+\d{12}/i,
  /GY\d{2}\s+Watershed/i,
];

const CHAPTER_BASED_PATTERNS = [
  /^I+\.\s+(Executive Summary|Vision Statement|Mission Statement)/im,
  /^V+I*\.\s+(Watershed Description|Stakeholder Interests|Water Resources)/im,
  /^VIII\.\s+Watershed Management/im,
  /^IX\.\s+Education\/Outreach/im,
  /Watershed Implementation Plan$/im,
];

export interface FormatDetectionResult {
  format: DocumentFormat;
  score: number;
  maxPossibleScore: number;
}

export function detectDocumentFormat(text: string): FormatDetectionResult {
  let nineKeyScore = 0;
  let chapterScore = 0;

  for (const pattern of NINE_KEY_ELEMENT_PATTERNS) {
    if (pattern.test(text)) nineKeyScore++;
  }

  for (const pattern of CHAPTER_BASED_PATTERNS) {
    if (pattern.test(text)) chapterScore++;
  }

  const maxScore = Math.max(nineKeyScore, chapterScore);
  const maxPossible = Math.max(NINE_KEY_ELEMENT_PATTERNS.length, CHAPTER_BASED_PATTERNS.length);

  if (maxScore <= 1) {
    return { format: "generic", score: maxScore, maxPossibleScore: maxPossible };
  }

  if (nineKeyScore >= chapterScore) {
    return { format: "9-key-element", score: nineKeyScore, maxPossibleScore: NINE_KEY_ELEMENT_PATTERNS.length };
  }
  return { format: "chapter-based", score: chapterScore, maxPossibleScore: CHAPTER_BASED_PATTERNS.length };
}

export function splitIntoSections(
  text: string,
  format: DocumentFormat
): DocumentSection[] {
  let sections: DocumentSection[] = [];

  if (format === "9-key-element") {
    sections = splitNineKeyElement(text);
  } else if (format === "chapter-based") {
    sections = splitChapterBased(text);
  }

  if (sections.length < 2) {
    sections = splitGeneric(text);
  }

  if (sections.length === 0) {
    sections = splitByLength(text);
  }

  return sections;
}

function splitNineKeyElement(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];

  const sectionMap: Record<string, string> = {
    a: "causes-and-sources",
    b: "expected-load-reduction",
    c: "proposed-management-measures",
    d: "technical-financial-assistance",
    e: "information-education",
    f: "implementation-schedule",
    g: "milestones-outcomes",
    h: "load-reduction-evaluation",
    i: "monitoring",
  };

  const sectionTitles: Record<string, string> = {
    a: "Identification of Causes and Sources of Impairment",
    b: "Expected Load Reduction",
    c: "Proposed Management Measures",
    d: "Technical and Financial Assistance",
    e: "Information and Education",
    f: "Implementation Schedule",
    g: "Milestones and Outcomes",
    h: "Load Reduction Evaluation",
    i: "Monitoring",
  };

  const elementRegex =
    /Element\s+([a-i])\s*[:\-\.]?\s*(.*?)(?=Element\s+[a-i]\s*[:\-\.]?|$)/gis;
  let match;

  while ((match = elementRegex.exec(text)) !== null) {
    const letter = match[1].toLowerCase();
    const content = match[2].trim();
    if (content.length > 50) {
      sections.push({
        title: sectionTitles[letter] || `Element ${letter}`,
        content,
        sectionType: sectionMap[letter] || letter,
      });
    }
  }

  if (sections.length < 3) {
    return splitNineKeyElementFallback(text);
  }

  const preambleMatch = text.match(
    /^([\s\S]*?)(?=Element\s+a\s*[:\-\.]?)/i
  );
  if (preambleMatch && preambleMatch[1].trim().length > 50) {
    sections.unshift({
      title: "Preamble",
      content: preambleMatch[1].trim(),
      sectionType: "preamble",
    });
  }

  return sections;
}

function splitNineKeyElementFallback(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = text.split("\n");

  const sectionMap: Record<string, string> = {
    a: "causes-and-sources",
    b: "expected-load-reduction",
    c: "proposed-management-measures",
    d: "technical-financial-assistance",
    e: "information-education",
    f: "implementation-schedule",
    g: "milestones-outcomes",
    h: "load-reduction-evaluation",
    i: "monitoring",
  };

  let currentSection: DocumentSection | null = null;

  for (const line of lines) {
    const elementMatch = line.match(/Element\s+([a-i])\s*[:\-\.]?\s*(.*)/i);
    if (elementMatch) {
      if (currentSection && currentSection.content.length > 50) {
        sections.push(currentSection);
      }
      const letter = elementMatch[1].toLowerCase();
      currentSection = {
        title: `Element ${letter}: ${elementMatch[2] || ""}`.trim(),
        content: "",
        sectionType: sectionMap[letter] || letter,
      };
    } else if (currentSection) {
      currentSection.content += line + "\n";
    }
  }

  if (currentSection && currentSection.content.length > 50) {
    sections.push(currentSection);
  }

  return sections;
}

function splitChapterBased(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];

  const chapterPatterns = [
    { pattern: /I\.\s*EXECUTIVE\s*SUMMARY([\s\S]*?)(?=II\.|$)/i, type: "executive-summary", title: "Executive Summary" },
    { pattern: /II\.\s*VISION\s*STATEMENT([\s\S]*?)(?=III\.|$)/i, type: "vision", title: "Vision Statement" },
    { pattern: /III\.\s*MISSION\s*STATEMENT([\s\S]*?)(?=IV\.|$)/i, type: "mission", title: "Mission Statement" },
    { pattern: /IV\.\s*WATERSHED\s*IMPLEMENTATION\s*TEAM([\s\S]*?)(?=V\.|$)/i, type: "implementation-team", title: "Watershed Implementation Team" },
    { pattern: /V\.\s*WATERSHED\s*DESCRIPTION([\s\S]*?)(?=VI\.|$)/i, type: "watershed-description", title: "Watershed Description" },
    { pattern: /VI\.\s*STAKEHOLDER\s*INTERESTS([\s\S]*?)(?=VII\.|$)/i, type: "stakeholder-interests", title: "Stakeholder Interests" },
    { pattern: /VII\.\s*Water\s*Resources([\s\S]*?)(?=VIII\.|$)/i, type: "water-resources", title: "Water Resources" },
    { pattern: /VIII\.\s*WATERSHED\s*MANAGEMENT([\s\S]*?)(?=IX\.|$)/i, type: "watershed-management", title: "Watershed Management Actions" },
    { pattern: /IX\.\s*EDUCATION\/OUTREACH([\s\S]*?)(?=X\.|$)/i, type: "education-outreach", title: "Education/Outreach Activities" },
    { pattern: /X\.\s*EVALUATION([\s\S]*?)(?=XI\.|$)/i, type: "evaluation", title: "Evaluation" },
    { pattern: /XI\.\s*PLAN\s*REVISION([\s\S]*?)(?=XII\.|Appendix|$)/i, type: "plan-revision", title: "Plan Revision" },
  ];

  for (const { pattern, type, title } of chapterPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 30) {
      sections.push({
        title,
        content: match[1].trim(),
        sectionType: type,
      });
    }
  }

  const appendixB = text.match(
    /Appendix\s*B[\s\S]*?(?:Funded\s+319\s+Project\s+Proposal)([\s\S]*?)(?=Appendix\s*C|$)/i
  );
  if (appendixB && appendixB[1].trim().length > 100) {
    sections.push({
      title: "319 Project Proposal (Appendix B)",
      content: appendixB[1].trim(),
      sectionType: "appendix-b-proposal",
    });
  }

  return sections;
}

/**
 * Generic section splitter that uses common heading patterns (numbered, bold, capitalized)
 * as a fallback when the document matches neither known format.
 */
function splitGeneric(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];

  const headingRegex = /^(?:\d+[\.\)]\s+|[A-Z][A-Z\s]{5,}$|Chapter\s+\d+|Section\s+\d+)/gm;
  const headings: { index: number; title: string }[] = [];
  let m;
  while ((m = headingRegex.exec(text)) !== null) {
    headings.push({ index: m.index, title: m[0].trim() });
  }

  if (headings.length < 2) return [];

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index + headings[i].title.length;
    const end = i + 1 < headings.length ? headings[i + 1].index : text.length;
    const content = text.substring(start, end).trim();
    if (content.length > 50) {
      const sectionType = inferSectionType(headings[i].title, content);
      sections.push({
        title: headings[i].title,
        content,
        sectionType,
      });
    }
  }

  return sections;
}

/**
 * Last-resort fallback: split long text into overlapping chunks so the LLM
 * can still process the entire document.
 */
function splitByLength(text: string): DocumentSection[] {
  const CHUNK_SIZE = 8000;
  const OVERLAP = 500;
  const sections: DocumentSection[] = [];

  for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
    const chunk = text.substring(i, i + CHUNK_SIZE);
    if (chunk.trim().length > 100) {
      sections.push({
        title: `Document Part ${sections.length + 1}`,
        content: chunk,
        sectionType: inferSectionType("", chunk),
      });
    }
  }

  return sections;
}

/**
 * Infer a semantic section type from a heading or content keywords.
 * Used by generic/fallback splitters so the pipeline can still route sections
 * to the correct LLM extractors.
 */
function inferSectionType(heading: string, content: string): string {
  const combined = (heading + " " + content.substring(0, 2000)).toLowerCase();

  if (/best management|bmp|cost\s+table|practice\s+name|unit\s+cost/i.test(combined)) return "technical-financial-assistance";
  if (/education|outreach|information\s+and|public\s+awareness/i.test(combined)) return "information-education";
  if (/implementation\s+schedule|timeline|milestones?/i.test(combined)) return "implementation-schedule";
  if (/impairment|causes?\s+and\s+sources|pollutant|tmdl|303\s*\(d\)|sediment/i.test(combined)) return "causes-and-sources";
  if (/load\s+reduction|nutrient\s+reduction|expected\s+reduction/i.test(combined)) return "expected-load-reduction";
  if (/monitoring|station|sampling|water\s+quality\s+data/i.test(combined)) return "monitoring";
  if (/executive\s+summary|overview|abstract/i.test(combined)) return "executive-summary";
  if (/watershed\s+description|land\s+use|acreage|geographic/i.test(combined)) return "watershed-description";
  if (/water\s+resources?|hydrology|stream|impaired/i.test(combined)) return "water-resources";
  if (/watershed\s+management|action|strategy|management\s+measures/i.test(combined)) return "watershed-management";

  return "general";
}
