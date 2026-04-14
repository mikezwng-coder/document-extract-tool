export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const CHART_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c",
  "#16a34a", "#0891b2", "#ca8a04", "#dc2626",
  "#4f46e5", "#059669", "#d97706", "#9333ea",
  "#e11d48", "#0d9488", "#c026d3", "#65a30d",
];

export const CATEGORY_COLORS: Record<string, string> = {
  structural: "#2563eb",
  vegetative: "#16a34a",
  management: "#ea580c",
  other: "#6b7280",
};
