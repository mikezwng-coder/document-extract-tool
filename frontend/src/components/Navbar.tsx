import { Sun, Moon, FileText } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export type Page = "home" | "about" | "help";

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_LINKS: { id: Page; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "help", label: "Help" },
];

export default function Navbar({ activePage, onNavigate }: Props) {
  const { dark, toggle } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-brand cursor-pointer" onClick={() => onNavigate("home")}>
        <FileText className="w-5 h-5 text-blue-600" />
        <h1>PDFInsight</h1>
      </div>
      <div className="flex items-center gap-1">
        <div className="navbar-links">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`navbar-link ${activePage === id ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={toggle} className="btn btn-icon btn-ghost ml-1" title="Toggle theme">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </nav>
  );
}
