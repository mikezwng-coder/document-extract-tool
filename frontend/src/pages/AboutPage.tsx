import { FileText, Cpu, BarChart3, Download } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "PDF Text Extraction",
    description: "Extracts raw text from any PDF document, handling multiple formats including 9-Key Element and chapter-based watershed plans.",
  },
  {
    icon: Cpu,
    title: "AI-Powered Analysis",
    description: "Uses GPT-4o to intelligently extract goals, BMPs, implementation schedules, outreach activities, and metadata from unstructured text.",
  },
  {
    icon: BarChart3,
    title: "Data Visualization",
    description: "Presents extracted data through interactive charts (cost breakdowns, land use distribution) and structured tables for easy analysis.",
  },
  {
    icon: Download,
    title: "Export & Share",
    description: "Export full reports as JSON or CSV for further analysis, integration with other tools, or sharing with stakeholders.",
  },
];

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-page-title">About PDFInsight</h2>
        <p className="text-body max-w-xl mx-auto">
          PDFInsight is an AI-powered document extraction tool designed to parse and analyze
          watershed management plans. It combines regex pattern matching with large language models
          for accurate, structured data extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="card card-body">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600" style={{ borderRadius: "var(--radius)" }}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--font-size-sm)" }}>{title}</h3>
                <p className="text-caption mt-1">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-body space-y-3">
        <h3 className="text-section-title" style={{ fontSize: "var(--font-size-lg)" }}>Technology Stack</h3>
        <div className="grid grid-cols-2 gap-2" style={{ fontSize: "var(--font-size-sm)" }}>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Frontend</p>
            <ul className="text-caption space-y-0.5 mt-1">
              <li>React + TypeScript</li>
              <li>Tailwind CSS v4</li>
              <li>Recharts</li>
              <li>Vite</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Backend</p>
            <ul className="text-caption space-y-0.5 mt-1">
              <li>Node.js + Express</li>
              <li>OpenAI GPT-4o</li>
              <li>pdf-parse</li>
              <li>TypeScript</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card card-body space-y-3">
        <h3 className="text-section-title" style={{ fontSize: "var(--font-size-lg)" }}>Supported Document Formats</h3>
        <div className="space-y-2" style={{ fontSize: "var(--font-size-sm)" }}>
          <div className="flex items-start gap-2">
            <span className="badge badge-blue">9-Key</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">9-Key Element Plans</p>
              <p className="text-caption">Plans structured around EPA's 9 minimum elements (a-i) for watershed-based plans.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="badge badge-green">Chapter</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Chapter-Based Plans</p>
              <p className="text-caption">Plans with Roman numeral chapters (I-XI) covering vision, watershed description, management actions, etc.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
