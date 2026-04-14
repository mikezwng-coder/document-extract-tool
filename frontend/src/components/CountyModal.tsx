import { X, FileText } from "lucide-react";

interface Props {
  counties: string[];
  onSelect: (county: string) => void;
  onClose: () => void;
}

export default function CountyModal({ counties, onSelect, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="modal-title">Select County</h2>
          </div>
          <button onClick={onClose} className="btn btn-icon btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-caption mb-3">
            Multiple counties were detected in the document. Please select the correct county:
          </p>
          <div className="space-y-1">
            {counties.map((county) => (
              <button
                key={county}
                onClick={() => onSelect(county)}
                className="w-full text-left px-3 py-2 text-body hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                style={{ borderRadius: "var(--radius)" }}
              >
                {county}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
