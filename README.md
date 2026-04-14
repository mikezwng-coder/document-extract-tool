# Watershed Plan Extraction Tool

A full-stack PDF document extraction tool that parses Mississippi agricultural/environmental watershed plans and extracts structured data using a hybrid regex + LLM approach.

## Features

- **Drag-and-drop PDF upload** with real-time processing status
- **Dual format support**: 9 Key Element Plans (2019-2020) and Chapter-based Plans (2012)
- **Hybrid extraction pipeline**: Regex for high-confidence tabular data + GPT-4o-mini for unstructured content
- **Interactive dashboard** with charts (Recharts), tables, and sidebar navigation
- **Export** to JSON and CSV
- **Dark/light mode** toggle
- **Responsive design** for mobile and desktop

## Architecture

```
┌──────────────┐     PDF upload      ┌──────────────────────────────────────┐
│   React UI   │ ──────────────────> │  Express API                        │
│  (Vite + TS) │ <── status polling  │                                     │
│  Tailwind    │ <── report JSON     │  1. pdf-parse → raw text            │
│  Recharts    │                     │  2. Format detection (regex)        │
└──────────────┘                     │  3. Section splitting               │
                                     │  4. Regex extraction (tables/nums)  │
                                     │  5. LLM extraction (OpenAI GPT-4o)  │
                                     │  6. Merge & validate                │
                                     └──────────────────────────────────────┘
```

## Tech Stack

| Layer    | Technology                                       |
|----------|--------------------------------------------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts     |
| Backend  | Node.js, Express, pdf-parse, OpenAI SDK          |
| Build    | Vite, TSC                                        |
| Deploy   | Vercel / Railway / Docker                        |

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key (GPT-4o-mini)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd home-task
npm run install:all

# 2. Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start development servers
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

## Usage

1. Open `http://localhost:5173` in your browser
2. Drag and drop a Mississippi Watershed Plan PDF onto the upload zone
3. Wait for extraction to complete (typically 15-45 seconds)
4. Browse extracted data via the sidebar: Goals, BMPs, Implementation Schedule, Monitoring, Outreach, Water Quality, TMDLs
5. Export results as JSON or CSV

## Supported Document Formats

### Format A: 9 Key Element Plans (2019-2020)
- Element a through Element i sections
- Examples: Broken Pumpkin Creek, Carmichael Creek, Owl Creek

### Format B: Chapter-Based Plans (2012)
- Roman numeral chapters (I-XII)
- Examples: Tarebreeches Creek, Bell Creek-Muddy Creek

## Data Extracted

| Category              | Details                                         |
|-----------------------|-------------------------------------------------|
| Metadata              | Watershed name, HUC code, county, year, acreage |
| Goals                 | TMDL targets, reduction percentages              |
| BMPs                  | Practice name, units, costs, categories          |
| Implementation        | Schedule activities with timelines               |
| Monitoring            | Station IDs, water bodies, data types            |
| Outreach              | Education activities with budgets                |
| Water Quality         | Parameter thresholds (DO, pH, TSS, etc.)         |
| TMDLs                 | Pollutant reductions and targets                 |
| Geographic            | Land use percentages, acreage                    |

## Project Structure

```
home-task/
├── frontend/              # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/    # UI components (UploadZone, Charts, Tables, Sidebar)
│   │   ├── services/      # API client
│   │   ├── hooks/         # Custom hooks (useTheme)
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Formatting utilities
│   └── ...
├── backend/               # Node.js + Express
│   ├── src/
│   │   ├── routes/        # Express routes (upload, export)
│   │   ├── services/      # Core logic (PDF, regex, LLM, pipeline)
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # CSV export
│   └── ...
├── README.md
├── EXTRACTION_LOGIC.md
├── TESTING.md
├── ANALYTICS.md
├── DEPLOYMENT.md
└── .env.example
```

## Environment Variables

| Variable           | Required | Description                       |
|--------------------|----------|-----------------------------------|
| `OPENAI_API_KEY`   | Yes      | OpenAI API key for GPT-4o-mini    |
| `PORT`             | No       | Backend port (default: 3001)      |
| `FRONTEND_URL`     | No       | CORS origin (default: localhost)  |
| `NODE_ENV`         | No       | Environment (development/production) |
