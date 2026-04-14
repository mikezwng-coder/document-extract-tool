import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import type { BMP } from "../types/extraction";
import { formatCurrency, CATEGORY_COLORS, CHART_COLORS } from "../utils/format";
import { useState } from "react";

interface Props {
  bmps: BMP[];
}

export default function BMPChart({ bmps }: Props) {
  const [view, setView] = useState<"bar" | "pie" | "category">("bar");

  const barData = [...bmps]
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, 10)
    .map((b) => ({
      name: b.practiceName.length > 25 ? b.practiceName.substring(0, 25) + "..." : b.practiceName,
      fullName: b.practiceName,
      cost: b.estimatedCost,
      category: b.category,
    }));

  const categoryData = Object.entries(
    bmps.reduce<Record<string, number>>((acc, b) => {
      const cat = b.category || "other";
      acc[cat] = (acc[cat] || 0) + b.estimatedCost;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--font-size-base)" }}>BMP Cost Breakdown</h3>
        <div className="tab-bar">
          {(["bar", "pie", "category"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`tab-item ${view === v ? "active" : ""}`}
            >
              {v === "bar" ? "Top BMPs" : v === "pie" ? "By Practice" : "By Category"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        {view === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={10} />
              <YAxis type="category" dataKey="name" width={150} fontSize={10} tick={{ fill: '#6b7280' }} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), "Cost"]}
                labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName || ""}
                contentStyle={{ borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11 }}
              />
              <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {view === "pie" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={barData}
                dataKey="cost"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={9}
              >
                {barData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 4, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {view === "category" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                fontSize={10}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 4, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
