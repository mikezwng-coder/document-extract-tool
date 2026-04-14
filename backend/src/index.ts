import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import uploadRouter from "./routes/upload";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// API routes
app.use("/api/upload", uploadRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    llmModel: process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o",
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    customBaseURL: !!process.env.OPENAI_BASE_URL || !!process.env.LLM_BASE_URL,
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o"}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? "configured" : "missing"}`);
  if (process.env.OPENAI_BASE_URL || process.env.LLM_BASE_URL) {
    console.log(`Custom Base URL: ${process.env.OPENAI_BASE_URL || process.env.LLM_BASE_URL}`);
  }
});

export default app;
