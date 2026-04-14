import { useState } from "react";
import Navbar, { Page } from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import DashboardPage from "./pages/DashboardPage";
import { ExtractedReport } from "./types/extraction";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [currentReport, setCurrentReport] = useState<ExtractedReport | null>(null);

  const handleViewReport = (report: ExtractedReport) => {
    setCurrentReport(report);
  };

  const handleBack = () => {
    setCurrentReport(null);
    setPage("home");
  };

  const handleNavigate = (p: Page) => {
    setCurrentReport(null);
    setPage(p);
  };

  if (currentReport) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Navbar activePage={page} onNavigate={handleNavigate} />
        <DashboardPage report={currentReport} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar activePage={page} onNavigate={handleNavigate} />
      {page === "home" && <HomePage onViewReport={handleViewReport} />}
      {page === "about" && <AboutPage />}
      {page === "help" && <HelpPage />}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
        <p className="text-center text-caption">
          PDFInsight &mdash; AI-Powered Document Extraction
        </p>
      </footer>
    </div>
  );
}
