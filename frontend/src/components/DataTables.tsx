import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ExtractedReport } from "../types/extraction";
import { formatCurrency } from "../utils/format";

interface CollapsibleProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Collapsible({ title, count, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="collapsible-header">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          <h3 className="collapsible-title">{title}</h3>
        </div>
        <span className="badge badge-gray">{count} items</span>
      </button>
      {open && <div className="border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

export function GoalsTable({ goals }: { goals: ExtractedReport["goals"] }) {
  return (
    <Collapsible title="Goals & TMDL Targets" count={goals.length} defaultOpen>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Pollutant</th>
              <th>Target Reduction</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((g) => (
              <tr key={g.id}>
                <td className="text-gray-900 dark:text-gray-200 max-w-md">{g.description}</td>
                <td><span className="badge badge-blue">{g.pollutant}</span></td>
                <td className="text-mono text-gray-700 dark:text-gray-300">{g.targetReduction}</td>
                <td>
                  <span className={`badge ${
                    g.status === "completed" ? "badge-green" :
                    g.status === "in-progress" ? "badge-yellow" :
                    "badge-gray"
                  }`}>
                    {g.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}

export function BMPTable({ bmps }: { bmps: ExtractedReport["bmps"] }) {
  return (
    <Collapsible title="Best Management Practices (BMPs)" count={bmps.length} defaultOpen>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Practice</th>
              <th>Category</th>
              <th className="text-right">Units</th>
              <th className="text-right">Unit Cost</th>
              <th className="text-right">Est. Cost</th>
              <th>Phase</th>
            </tr>
          </thead>
          <tbody>
            {bmps.map((b) => (
              <tr key={b.id}>
                <td className="text-gray-900 dark:text-gray-200 font-medium">{b.practiceName}</td>
                <td>
                  <span className={`badge ${
                    b.category === "structural" ? "badge-blue" :
                    b.category === "vegetative" ? "badge-green" :
                    b.category === "management" ? "badge-orange" :
                    "badge-gray"
                  }`}>
                    {b.category}
                  </span>
                </td>
                <td className="text-right font-mono text-gray-700 dark:text-gray-300">
                  {b.numberOfUnits.toLocaleString()} {b.unit}
                </td>
                <td className="text-right font-mono text-gray-700 dark:text-gray-300">{formatCurrency(b.unitCost)}</td>
                <td className="text-right font-mono font-medium text-gray-900 dark:text-gray-100">{formatCurrency(b.estimatedCost)}</td>
                <td className="text-caption">{b.phase}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right text-gray-700 dark:text-gray-300">Total</td>
              <td className="text-right font-mono text-gray-900 dark:text-gray-100">
                {formatCurrency(bmps.reduce((s, b) => s + b.estimatedCost, 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Collapsible>
  );
}

export function WaterQualityTable({ thresholds }: { thresholds: ExtractedReport["waterQualityThresholds"] }) {
  return (
    <Collapsible title="Water Quality Thresholds" count={thresholds.length}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Threshold</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map((t, i) => (
              <tr key={i}>
                <td className="font-medium text-gray-900 dark:text-gray-200">{t.parameter}</td>
                <td className="text-gray-700 dark:text-gray-300">{t.threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}

export function TMDLTable({ tmdls }: { tmdls: ExtractedReport["tmdls"] }) {
  return (
    <Collapsible title="TMDLs" count={tmdls.length}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pollutant</th>
              <th>Reduction Required</th>
              <th>Target Value</th>
            </tr>
          </thead>
          <tbody>
            {tmdls.map((t, i) => (
              <tr key={i}>
                <td className="font-medium text-gray-900 dark:text-gray-200">{t.pollutant}</td>
                <td className="font-mono text-red-600 dark:text-red-400">{t.reductionRequired}</td>
                <td className="text-gray-700 dark:text-gray-300">{t.targetValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}

export function ImplementationTable({ activities }: { activities: ExtractedReport["implementation"] }) {
  return (
    <Collapsible title="Implementation Schedule" count={activities.length}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Timeline</th>
              <th>Responsible</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => (
              <tr key={i}>
                <td className="text-gray-900 dark:text-gray-200 max-w-lg">{a.activity}</td>
                <td className="text-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">{a.timeline}</td>
                <td className="text-gray-500 dark:text-gray-400">{a.responsibleParty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}

export function MonitoringTable({ monitoring }: { monitoring: ExtractedReport["monitoring"] }) {
  return (
    <Collapsible title="Monitoring Stations" count={monitoring.length}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Station ID</th>
              <th>Water Body</th>
              <th>Years</th>
              <th>Agency</th>
              <th>Data Types</th>
            </tr>
          </thead>
          <tbody>
            {monitoring.map((m, i) => (
              <tr key={i}>
                <td className="font-mono text-gray-900 dark:text-gray-200">{m.stationId}</td>
                <td className="text-gray-700 dark:text-gray-300">{m.waterBody}</td>
                <td className="text-gray-500 dark:text-gray-400">{m.samplingYears}</td>
                <td className="text-gray-500 dark:text-gray-400">{m.agency}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {m.dataTypes.map((dt, j) => (
                      <span key={j} className="badge badge-gray">{dt}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}

export function OutreachTable({ outreach }: { outreach: ExtractedReport["outreach"] }) {
  return (
    <Collapsible title="Education & Outreach Activities" count={outreach.length}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Description</th>
              <th className="text-right">Budget</th>
              <th>Schedule</th>
            </tr>
          </thead>
          <tbody>
            {outreach.map((o, i) => (
              <tr key={i}>
                <td className="font-medium text-gray-900 dark:text-gray-200">{o.activity}</td>
                <td className="text-gray-700 dark:text-gray-300 max-w-sm">{o.description}</td>
                <td className="text-right font-mono text-gray-700 dark:text-gray-300">{o.budget > 0 ? formatCurrency(o.budget) : "—"}</td>
                <td className="text-gray-500 dark:text-gray-400">{o.schedule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}
