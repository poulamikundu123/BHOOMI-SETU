import { useQuery } from "@tanstack/react-query";
import { citizenApi } from "../../services/api";
import { Edit3, Clock, CheckCircle, XCircle, AlertTriangle, Info, MessageSquare } from "lucide-react";
import { formatDate } from "../../utils/helpers";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  SUBMITTED: { label: "Submitted", color: "#3b82f6", bg: "#eff6ff", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "#ca8a04", bg: "#fffbeb", icon: Clock },
  APPROVED: { label: "Approved", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "#dc2626", bg: "#fef2f2", icon: XCircle },
  NEEDS_MORE_INFORMATION: { label: "More Info Needed", color: "#7c3aed", bg: "#faf5ff", icon: Info },
};

const FIELD_LABELS: Record<string, string> = {
  owner_name: "Owner Name", father_name: "Father's Name", khata_number: "Khata No.",
  khasra_number: "Khasra No.", plot_number: "Plot No.", area: "Area",
  village: "Village", district: "District", land_type: "Land Type",
  registration_date: "Registration Date",
};

export default function CitizenCorrectionsPage() {
  const { data: corrections = [], isLoading } = useQuery({
    queryKey: ["citizen-my-corrections"],
    queryFn: () => citizenApi.getMyCorrections().then(r => r.data),
  });

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Correction Requests</h1>
          <p className="text-sm text-neutral-500 mt-1">Track the status of corrections you've submitted for your land records.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-neutral-400">Loading...</div>
        ) : corrections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
            <MessageSquare size={40} className="mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No correction requests</h3>
            <p className="text-sm text-neutral-500">
              You haven't submitted any correction requests yet.<br />
              Open a land record and click "Request Correction" to report an issue.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {corrections.map((cr: any) => {
              const cfg = STATUS_CONFIG[cr.status] || STATUS_CONFIG.SUBMITTED;
              const Icon = cfg.icon;
              return (
                <div key={cr.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Edit3 size={16} className="text-neutral-400" />
                      <span className="font-semibold text-neutral-900">
                        {FIELD_LABELS[cr.field_name] || cr.field_name}
                      </span>
                      <span className="text-xs text-neutral-400">— Correction #{cr.id}</span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <Icon size={12} />
                      {cfg.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-neutral-50 rounded-xl p-3">
                      <div className="text-xs text-neutral-500 mb-1">Current Value</div>
                      <div className="text-sm font-mono font-semibold text-neutral-700">{cr.current_value || "—"}</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="text-xs text-neutral-500 mb-1">Proposed Value</div>
                      <div className="text-sm font-mono font-semibold text-green-800">{cr.proposed_value}</div>
                    </div>
                  </div>

                  {cr.reason && (
                    <div className="mb-3 text-sm text-neutral-600 bg-neutral-50 rounded-xl p-3">
                      <span className="font-medium text-neutral-700">Reason: </span>{cr.reason}
                    </div>
                  )}

                  {cr.review_notes && (
                    <div className="mb-3 text-sm text-neutral-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <span className="font-medium text-amber-800">Officer's Note: </span>{cr.review_notes}
                    </div>
                  )}

                  <div className="text-xs text-neutral-400">
                    Submitted: {formatDate(cr.created_at)}
                    {cr.reviewed_at && ` · Reviewed: ${formatDate(cr.reviewed_at)}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

