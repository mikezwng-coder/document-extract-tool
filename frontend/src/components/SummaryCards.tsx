import { Target, Leaf, DollarSign, MapPin } from "lucide-react";
import { ReportSummary, ReportMetadata } from "../types/extraction";
import { formatCurrency, formatNumber } from "../utils/format";

interface Props {
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export default function SummaryCards({ summary, metadata }: Props) {
  const cards = [
    {
      label: "Total Goals",
      value: summary.totalGoals.toString(),
      icon: Target,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Total BMPs",
      value: summary.totalBMPs.toString(),
      icon: Leaf,
      color: "text-green-600 bg-green-50 dark:bg-green-950",
    },
    {
      label: "Estimated Cost",
      value: formatCurrency(summary.totalEstimatedCost),
      sub: summary.phase1Cost > 0 ? `Phase 1: ${formatCurrency(summary.phase1Cost)}` : undefined,
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Watershed Area",
      value: metadata.totalAcreage > 0 ? `${formatNumber(metadata.totalAcreage)} ac` : "N/A",
      sub: metadata.county || undefined,
      icon: MapPin,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="card card-body hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-2">
            <div className={`p-2 ${card.color}`} style={{ borderRadius: "var(--radius)" }}>
              <card.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-caption uppercase tracking-wider">{card.label}</p>
              <p className="font-bold text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: "var(--font-size-lg)" }}>
                {card.value}
              </p>
              {card.sub && <p className="text-caption truncate">{card.sub}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
