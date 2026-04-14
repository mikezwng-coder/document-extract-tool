export type Section =
  | "summary"
  | "goals"
  | "bmps"
  | "implementation"
  | "monitoring"
  | "outreach"
  | "water-quality"
  | "tmdls";

interface Props {
  active: Section;
  onChange: (section: Section) => void;
}

const TABS: { id: Section; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "goals", label: "Goals" },
  { id: "bmps", label: "Benchmarks" },
  { id: "implementation", label: "Implementation" },
  { id: "monitoring", label: "Monitoring" },
  { id: "outreach", label: "Outreach" },
  { id: "water-quality", label: "Wrias" },
  { id: "tmdls", label: "Charts" },
];

export default function TopTabs({ active, onChange }: Props) {
  return (
    <div className="tab-bar overflow-x-auto">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`tab-item ${active === id ? "active" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
