import OpenAI from "openai";
import { Goal, ImplementationActivity, OutreachActivity, BMP, ReportMetadata } from "../types/extraction";

// ---------------------------------------------------------------------------
// Multi-model configuration
// ---------------------------------------------------------------------------

interface ModelProfile {
  contextChars: number;
  maxOutputTokens: number;
  supportsJsonMode: boolean;
  /** Newer models (gpt-5, o-series) require max_completion_tokens instead of max_tokens */
  useMaxCompletionTokens: boolean;
  /** Some models (o-series reasoning) don't support the temperature parameter */
  supportsTemperature: boolean;
}

const MODEL_PROFILES: Record<string, ModelProfile> = {
  "gpt-4o":           { contextChars: 100000, maxOutputTokens: 4096,  supportsJsonMode: true,  useMaxCompletionTokens: false, supportsTemperature: true },
  "gpt-4o-mini":      { contextChars:  80000, maxOutputTokens: 4096,  supportsJsonMode: true,  useMaxCompletionTokens: false, supportsTemperature: true },
  "gpt-4-turbo":      { contextChars:  80000, maxOutputTokens: 4096,  supportsJsonMode: true,  useMaxCompletionTokens: false, supportsTemperature: true },
  "gpt-4":            { contextChars:  20000, maxOutputTokens: 4096,  supportsJsonMode: true,  useMaxCompletionTokens: false, supportsTemperature: true },
  "gpt-3.5-turbo":    { contextChars:  12000, maxOutputTokens: 4096,  supportsJsonMode: true,  useMaxCompletionTokens: false, supportsTemperature: true },
  "gpt-5":            { contextChars: 120000, maxOutputTokens: 8192,  supportsJsonMode: true,  useMaxCompletionTokens: true,  supportsTemperature: false },
  "gpt-5-mini":       { contextChars: 100000, maxOutputTokens: 8192,  supportsJsonMode: true,  useMaxCompletionTokens: true,  supportsTemperature: false },
  "o3":               { contextChars: 150000, maxOutputTokens: 8192,  supportsJsonMode: true,  useMaxCompletionTokens: true,  supportsTemperature: false },
  "o3-mini":          { contextChars: 100000, maxOutputTokens: 4096,  supportsJsonMode: true,  useMaxCompletionTokens: true,  supportsTemperature: false },
  "o3-pro":           { contextChars: 150000, maxOutputTokens: 8192,  supportsJsonMode: true,  useMaxCompletionTokens: true,  supportsTemperature: false },
  "o4-mini":          { contextChars: 150000, maxOutputTokens: 8192,  supportsJsonMode: true,  useMaxCompletionTokens: true,  supportsTemperature: false },
  "o1":               { contextChars: 100000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: true,  supportsTemperature: false },
  "o1-mini":          { contextChars:  80000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: true,  supportsTemperature: false },
  "o1-pro":           { contextChars: 100000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: true,  supportsTemperature: false },
  "claude-3-opus":    { contextChars: 150000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: false, supportsTemperature: true },
  "claude-3-sonnet":  { contextChars: 150000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: false, supportsTemperature: true },
  "claude-3-haiku":   { contextChars: 150000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: false, supportsTemperature: true },
  "claude-3.5-sonnet":{ contextChars: 150000, maxOutputTokens: 4096,  supportsJsonMode: false, useMaxCompletionTokens: false, supportsTemperature: true },
  "claude-4-sonnet":  { contextChars: 150000, maxOutputTokens: 8192,  supportsJsonMode: false, useMaxCompletionTokens: false, supportsTemperature: true },
  "claude-4-opus":    { contextChars: 150000, maxOutputTokens: 8192,  supportsJsonMode: false, useMaxCompletionTokens: false, supportsTemperature: true },
};

const DEFAULT_PROFILE: ModelProfile = {
  contextChars: 40000,
  maxOutputTokens: 4096,
  supportsJsonMode: true,
  useMaxCompletionTokens: false,
  supportsTemperature: true,
};

function getModelProfile(model: string): ModelProfile {
  if (MODEL_PROFILES[model]) return MODEL_PROFILES[model];

  for (const [key, profile] of Object.entries(MODEL_PROFILES)) {
    if (model.startsWith(key)) return profile;
  }

  return DEFAULT_PROFILE;
}

function getConfiguredModel(): string {
  return process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o";
}

// ---------------------------------------------------------------------------
// Client initialization — supports OpenAI, Azure, and any OpenAI-compatible API
// ---------------------------------------------------------------------------

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required (also used for OpenAI-compatible providers)");

  const baseURL = process.env.OPENAI_BASE_URL || process.env.LLM_BASE_URL || undefined;

  client = new OpenAI({ apiKey, baseURL });
  return client;
}

// ---------------------------------------------------------------------------
// Error tracking
// ---------------------------------------------------------------------------

export interface LLMExtractionError {
  section: string;
  error: string;
}

const llmErrors: LLMExtractionError[] = [];

export function getLLMErrors(): LLMExtractionError[] {
  return [...llmErrors];
}

export function clearLLMErrors(): void {
  llmErrors.length = 0;
}

// ---------------------------------------------------------------------------
// Core LLM call with model-aware settings
// ---------------------------------------------------------------------------

async function callLLM(systemPrompt: string, userContent: string, sectionLabel: string): Promise<string> {
  const openai = getClient();
  const model = getConfiguredModel();
  const profile = getModelProfile(model);

  let truncated = userContent;
  if (userContent.length > profile.contextChars) {
    truncated = smartTruncate(userContent, profile.contextChars);
  }

  const jsonInstruction = profile.supportsJsonMode
    ? ""
    : "\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation — just the JSON object.";

  try {
    const params: Record<string, any> = {
      model,
      messages: [
        { role: "system", content: systemPrompt + jsonInstruction },
        { role: "user", content: truncated },
      ],
    };

    if (profile.supportsTemperature) {
      params.temperature = 0.1;
    }

    if (profile.useMaxCompletionTokens) {
      params.max_completion_tokens = profile.maxOutputTokens;
    } else {
      params.max_tokens = profile.maxOutputTokens;
    }

    if (profile.supportsJsonMode) {
      params.response_format = { type: "json_object" };
    }

    const response = await openai.chat.completions.create(params as OpenAI.ChatCompletionCreateParamsNonStreaming);
    const raw = response.choices[0]?.message?.content || "{}";

    return extractJSON(raw);
  } catch (err: any) {
    const errorMsg = err.message || "Unknown LLM error";
    llmErrors.push({ section: sectionLabel, error: errorMsg });
    console.error(`[LLM Error][${sectionLabel}][${model}] ${errorMsg}`);
    return "{}";
  }
}

/**
 * Extract JSON from a response that may be wrapped in markdown fences or
 * contain extra prose (common with models that lack json_object mode).
 */
function extractJSON(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{")) return trimmed;

  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  return trimmed;
}

/**
 * Truncate text to maxLen while preserving the beginning (often metadata/headers)
 * and end (often summary/totals) of the document, with a middle bridge.
 */
function smartTruncate(text: string, maxLen: number): string {
  const headSize = Math.floor(maxLen * 0.6);
  const tailSize = Math.floor(maxLen * 0.35);
  const head = text.substring(0, headSize);
  const tail = text.substring(text.length - tailSize);
  return head + "\n\n...[middle section omitted for length]...\n\n" + tail;
}

// ---------------------------------------------------------------------------
// Extraction functions
// ---------------------------------------------------------------------------

export async function extractMetadataWithLLM(
  preambleText: string,
  fullTextSnippet: string
): Promise<Partial<ReportMetadata>> {
  const systemPrompt = `You are a document metadata extractor. Extract metadata from the beginning of a Mississippi Watershed Plan document.
Return JSON with these fields:
{
  "documentTitle": "full title of the plan",
  "watershedName": "name of the watershed",
  "hucCode": "HUC code (12-digit or 8-digit)",
  "county": "county name(s)",
  "planYear": year as number,
  "totalAcreage": total watershed acreage as number
}
Only include fields you can confidently extract. Use null for uncertain fields.`;

  const text = (preambleText + "\n\n" + fullTextSnippet.substring(0, 5000)).trim();
  if (text.length < 20) return {};

  const result = await callLLM(systemPrompt, text, "metadata");

  try {
    return JSON.parse(result);
  } catch {
    return {};
  }
}

export async function extractGoalsWithLLM(
  sectionText: string
): Promise<Goal[]> {
  if (sectionText.trim().length < 30) return [];

  const systemPrompt = `You extract watershed management goals from environmental plan documents.
Return JSON: { "goals": [...] } where each goal has:
{
  "id": "goal-1",
  "description": "clear goal description",
  "targetReduction": "e.g. 77-97% sediment reduction",
  "pollutant": "sediment|nutrients|nitrogen|phosphorus|fecal coliform|biological",
  "status": "planned|in-progress|completed"
}

Focus on:
- TMDL reduction targets (e.g. "77-97% reduction in sediment")
- Nutrient reduction goals (TN, TP percentages)
- Water quality improvement goals
- Delisting from 303(d) list goals
Do NOT invent goals. Only extract what is explicitly stated.`;

  const result = await callLLM(systemPrompt, sectionText, "goals");
  try {
    const parsed = JSON.parse(result);
    return (parsed.goals || []).map((g: any, i: number) => ({
      id: g.id || `goal-${i + 1}`,
      description: g.description || "",
      targetReduction: g.targetReduction || "",
      pollutant: g.pollutant || "unknown",
      status: g.status || "planned",
    }));
  } catch {
    return [];
  }
}

export async function extractBMPsWithLLM(
  sectionText: string,
  phase: string = "full"
): Promise<Partial<BMP>[]> {
  if (sectionText.trim().length < 30) return [];

  const systemPrompt = `You extract Best Management Practices (BMPs) from watershed plan cost tables.
Return JSON: { "bmps": [...] } where each BMP has:
{
  "practiceName": "exact name from document",
  "unit": "ac|ft|ea|cu yd|sq ft|gal|each|acres|feet|structures",
  "numberOfUnits": number,
  "unitCost": number (dollars),
  "estimatedCost": number (dollars),
  "category": "structural|vegetative|management"
}

Categories:
- structural: grade stabilization structures, sediment basins, diversions, ponds, dams, terraces, underground outlets, pipelines, stream crossings, water control structures, reservoirs
- vegetative: cover crops, filter strips, field borders, grassed waterways, tree/shrub planting, forest improvements, prescribed burning, forage planting, biomass, brush management, weed management, pasture, hay land
- management: fencing, nutrient management, prescribed grazing, watering facilities, heavy use areas, livestock management, firebreak, habitat, land clearing, critical area planting

CRITICAL: Extract EXACT numbers from the document. Do not estimate or calculate. Each row in a cost table is one BMP entry.
If the table uses "Area Affected" instead of "No of Units", that column is the numberOfUnits.
If the table uses "BMP Cost" instead of "Unit Cost", that column is the unitCost.
Skip rows that are project management, monitoring, education, or technical assistance (marked with *).`;

  const result = await callLLM(systemPrompt, sectionText, "bmps");
  try {
    const parsed = JSON.parse(result);
    return (parsed.bmps || []).map((b: any) => ({
      ...b,
      phase,
    }));
  } catch {
    return [];
  }
}

export async function extractImplementationWithLLM(
  sectionText: string
): Promise<ImplementationActivity[]> {
  if (sectionText.trim().length < 30) return [];

  const systemPrompt = `You extract implementation schedule activities from watershed plan documents.
Return JSON: { "activities": [...] } where each activity has:
{
  "phase": "Phase 1|Phase 2|Phase 3|Overall",
  "activity": "description of the activity",
  "timeline": "e.g. Month 1, Months 1-6, Months 3-36",
  "responsibleParty": "MDEQ|MSWCC|NRCS|SWCD|USGS|WIT|Multiple"
}

Look for numbered lists with month ranges in parentheses. Extract each numbered item as an activity.
Also look for tables with columns like Activity | Timeline | Responsible Party.`;

  const result = await callLLM(systemPrompt, sectionText, "implementation");
  try {
    const parsed = JSON.parse(result);
    return (parsed.activities || []).map((a: any) => ({
      phase: a.phase || "Overall",
      activity: a.activity || "",
      timeline: a.timeline || "",
      responsibleParty: a.responsibleParty || "Multiple",
    }));
  } catch {
    return [];
  }
}

export async function extractOutreachWithLLM(
  sectionText: string
): Promise<OutreachActivity[]> {
  if (sectionText.trim().length < 30) return [];

  const systemPrompt = `You extract education and outreach activities from watershed plan documents.
Return JSON: { "activities": [...] } where each activity has:
{
  "activity": "name of the activity",
  "description": "brief description",
  "budget": number in dollars (0 if not specified),
  "indicators": "how success is measured",
  "schedule": "when it occurs"
}

Common activities include:
- Water Model Presentations/Enviroscapes
- Teacher Workshops
- Adopt-A-Stream
- Watershed Harmony Mobile Classroom/Puppet Show
- Storm Drain Marking
- Train the Trainer
- Waste Pesticide Disposal
- County Fair exhibits
- Signage/signs
- Landowner meetings/Field days
- Fact sheets
- Radio advertisements
- Water Bill Mailers
- Presentations

Extract EXACT budget amounts. Do not estimate.`;

  const result = await callLLM(systemPrompt, sectionText, "outreach");
  try {
    const parsed = JSON.parse(result);
    return (parsed.activities || []).map((a: any) => ({
      activity: a.activity || "",
      description: a.description || "",
      budget: typeof a.budget === "number" ? a.budget : 0,
      indicators: a.indicators || "",
      schedule: a.schedule || "",
    }));
  } catch {
    return [];
  }
}

export async function extractMilestonesWithLLM(
  sectionText: string
): Promise<{ milestone: string; outcome: string; completionDate: string }[]> {
  if (sectionText.trim().length < 30) return [];

  const systemPrompt = `You extract milestones from watershed plan documents.
Return JSON: { "milestones": [...] } where each milestone has:
{
  "milestone": "description of the milestone",
  "outcome": "expected outcome",
  "completionDate": "e.g. Months 1-2, Months 3-36"
}

These are typically in a table with Milestone | Outcome | Probable Completion Date columns.`;

  const result = await callLLM(systemPrompt, sectionText, "milestones");
  try {
    const parsed = JSON.parse(result);
    return parsed.milestones || [];
  } catch {
    return [];
  }
}

/**
 * Full-document LLM extraction: used as last resort when section splitting
 * produces insufficient results. Asks the LLM to extract all data types at once.
 */
export async function extractAllWithLLM(fullText: string): Promise<{
  goals: Goal[];
  bmps: Partial<BMP>[];
  implementation: ImplementationActivity[];
  outreach: OutreachActivity[];
}> {
  if (fullText.trim().length < 100) {
    return { goals: [], bmps: [], implementation: [], outreach: [] };
  }

  const systemPrompt = `You are an expert data extractor for Mississippi Watershed Plan documents.
Extract ALL of the following from the document and return as a single JSON object:

{
  "goals": [{ "id": "goal-1", "description": "...", "targetReduction": "...", "pollutant": "...", "status": "planned" }],
  "bmps": [{ "practiceName": "...", "unit": "...", "numberOfUnits": 0, "unitCost": 0, "estimatedCost": 0, "category": "structural|vegetative|management" }],
  "implementation": [{ "phase": "...", "activity": "...", "timeline": "...", "responsibleParty": "..." }],
  "outreach": [{ "activity": "...", "description": "...", "budget": 0, "indicators": "...", "schedule": "..." }]
}

RULES:
- Extract EXACT text and numbers from the document. Never estimate.
- For BMPs, each row in a cost table is one entry.
- For goals, focus on TMDL reduction targets.
- For implementation, look for numbered activity lists with timelines.
- For outreach, look for education activities with budgets.
- Return empty arrays for sections you cannot find data for.`;

  const result = await callLLM(systemPrompt, fullText, "full-document");
  try {
    const parsed = JSON.parse(result);
    const goals = (parsed.goals || []).map((g: any, i: number) => ({
      id: g.id || `goal-${i + 1}`,
      description: g.description || "",
      targetReduction: g.targetReduction || "",
      pollutant: g.pollutant || "unknown",
      status: g.status || "planned",
    }));
    const bmps = (parsed.bmps || []).map((b: any) => ({
      ...b,
      phase: b.phase || "full",
    }));
    const implementation = (parsed.implementation || parsed.activities || []).map((a: any) => ({
      phase: a.phase || "Overall",
      activity: a.activity || "",
      timeline: a.timeline || "",
      responsibleParty: a.responsibleParty || "Multiple",
    }));
    const outreach = (parsed.outreach || []).map((a: any) => ({
      activity: a.activity || "",
      description: a.description || "",
      budget: typeof a.budget === "number" ? a.budget : 0,
      indicators: a.indicators || "",
      schedule: a.schedule || "",
    }));
    return { goals, bmps, implementation, outreach };
  } catch {
    return { goals: [], bmps: [], implementation: [], outreach: [] };
  }
}
