import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { GeographicArea } from "../types/extraction";

interface Props {
  areas: GeographicArea[];
}

const LAND_USE_COLORS: Record<string, string> = {
  cropland: "#eab308",
  pasture: "#84cc16",
  forest: "#15803d",
  wetlands: "#0891b2",
  urban: "#6b7280",
  other: "#a1a1aa",
  water: "#3b82f6",
};

export default function LandUseChart({ areas }: Props) {
  const primaryArea = areas[0];
  if (!primaryArea || Object.keys(primaryArea.landUse).length === 0) {
    return (
      <div className="card card-body">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3" style={{ fontSize: "var(--font-size-base)" }}>Land Use Distribution</h3>
        <p className="text-caption text-center py-6">No land use data extracted</p>
      </div>
    );
  }

  const data = Object.entries(primaryArea.landUse)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      key: name,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="card card-body">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3" style={{ fontSize: "var(--font-size-base)" }}>Land Use Distribution</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={35}
              label={({ name, value }) => `${name} ${value}%`}
              fontSize={10}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={LAND_USE_COLORS[entry.key] || "#a1a1aa"} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${value}%`} contentStyle={{ borderRadius: 4, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
