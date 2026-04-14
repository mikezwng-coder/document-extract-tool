import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { OutreachActivity } from "../types/extraction";
import { formatCurrency, CHART_COLORS } from "../utils/format";

interface Props {
  outreach: OutreachActivity[];
}

export default function OutreachChart({ outreach }: Props) {
  const data = outreach
    .filter((o) => o.budget > 0)
    .sort((a, b) => b.budget - a.budget)
    .map((o) => ({
      name: o.activity.length > 30 ? o.activity.substring(0, 30) + "..." : o.activity,
      fullName: o.activity,
      budget: o.budget,
    }));

  if (data.length === 0) {
    return (
      <div className="card card-body">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3" style={{ fontSize: "var(--font-size-base)" }}>Outreach Budget</h3>
        <p className="text-caption text-center py-6">No outreach budget data extracted</p>
      </div>
    );
  }

  return (
    <div className="card card-body">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3" style={{ fontSize: "var(--font-size-base)" }}>Outreach Budget Allocation</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} fontSize={10} />
            <YAxis type="category" dataKey="name" width={170} fontSize={10} tick={{ fill: '#6b7280' }} />
            <Tooltip
              formatter={(value: any) => [formatCurrency(Number(value)), "Budget"]}
              labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName || ""}
              contentStyle={{ borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11 }}
            />
            <Bar dataKey="budget" radius={[0, 3, 3, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
