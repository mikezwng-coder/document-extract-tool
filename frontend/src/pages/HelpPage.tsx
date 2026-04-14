import { Upload, Clock, BarChart3, Download, AlertCircle } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "1. Upload your PDF",
    description: "Drag and drop a PDF file onto the upload area, or click to browse. The tool accepts Mississippi Watershed Plans up to 100MB.",
  },
  {
    icon: Clock,
    title: "2. Wait for processing",
    description: "The tool extracts text, detects the document format, runs regex and AI extraction, then merges and validates the results. This typically takes 30-60 seconds.",
  },
  {
    icon: BarChart3,
    title: "3. Explore the dashboard",
    description: "Browse extracted data through tabs: Summary, Goals, Benchmarks, Implementation, Monitoring, Outreach, and Charts. Each section provides tables and visualizations.",
  },
  {
    icon: Download,
    title: "4. Export your data",
    description: "Download the extracted report as JSON for programmatic use, or CSV for spreadsheet analysis. Use the export buttons in the dashboard.",
  },
];

const FAQS = [
  {
    q: "What types of PDFs are supported?",
    a: "The tool is optimized for Mississippi MDEQ watershed management plans in either 9-Key Element or chapter-based format. Other PDFs may produce limited results.",
  },
  {
    q: "Why is extraction taking a long time?",
    a: "AI extraction sends multiple sections to GPT-4o for analysis. Complex documents with many sections may take 60-90 seconds.",
  },
  {
    q: "My report shows no BMPs or goals.",
    a: "The document may be image-based (scanned). The tool requires text-based PDFs. Try OCR software first, then re-upload.",
  },
  {
    q: "Can I re-process a document?",
    a: "Yes. Delete the existing report from the home page and re-upload the PDF.",
  },
  {
    q: "Where is my data stored?",
    a: "Reports are stored in-memory on the backend server. They will be lost when the server restarts. Export important reports before stopping the server.",
  },
];

export default function HelpPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-page-title">Help & Guide</h2>
        <p className="text-body max-w-xl mx-auto">
          Learn how to use PDFInsight to extract structured data from your PDF documents.
        </p>
      </div>

      <div className="card card-body space-y-4">
        <h3 className="text-section-title" style={{ fontSize: "var(--font-size-lg)" }}>Getting Started</h3>
        <div className="space-y-3">
          {STEPS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 shrink-0" style={{ borderRadius: "var(--radius)" }}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--font-size-sm)" }}>{title}</p>
                <p className="text-caption mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-body space-y-4">
        <h3 className="text-section-title" style={{ fontSize: "var(--font-size-lg)" }}>Frequently Asked Questions</h3>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--font-size-sm)" }}>{q}</p>
              <p className="text-caption mt-0.5">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-body flex items-start gap-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200" style={{ fontSize: "var(--font-size-sm)" }}>Need help?</p>
          <p className="text-caption text-amber-700 dark:text-amber-300">
            If you encounter issues, ensure the backend server is running (<code className="font-mono">npm run dev</code>) and your <code className="font-mono">OPENAI_API_KEY</code> is configured in the <code className="font-mono">.env</code> file.
          </p>
        </div>
      </div>
    </main>
  );
}
