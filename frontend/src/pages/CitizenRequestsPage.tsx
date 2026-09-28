import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { citizenApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import {
  Edit3, CheckCircle, XCircle, AlertTriangle, Clock, Info,
  ChevronDown, ChevronUp, User
} from "lucide-react";
import { formatDate } from "../utils/helpers";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  SUBMITTED: { label: "Submitted", color: "#3b82f6", bg: "#eff6ff", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "#ca8a04", bg: "#fffbeb", icon: Clock },
  APPROVED: { label: "Approved", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "#dc2626", bg: "#fef2f2", icon: XCircle },
  NEEDS_MORE_INFORMATION: { label: "More Info Needed", color: "#7c3aed", bg: "#faf5ff", icon: Info },
};

const DEMO_CORRECTIONS = [
  {
    id: 1,
    land_record_id: 1,
    record_id: "LR-WB-DAR-1024",
    citizen_name: "Amit Kumar Das",
    citizen_email: "amit.das@example.com",
    field_name: "area",
    current_value: "2.40",
    proposed_value: "2.45",
    reason: "Deed survey report re-measured plot area after boundary canal clearance.",
    status: "SUBMITTED",
    created_at: "2024-03-20T11:20:00Z",
    reviewed_at: null,
    review_notes: null,
  },
  {
    id: 2,
    land_record_id: 2,
    record_id: "LR-WB-DAR-1025",
    citizen_name: "Amit Kumar Das",
    citizen_email: "amit.das@example.com",
    field_name: "father_name",
    current_value: "Sunil Das",
    proposed_value: "Late Sunil Kumar Das",
    reason: "Correction to include full name as per Aadhaar and Khatiyan extract.",
    status: "APPROVED",
    created_at: "2024-02-15T09:45:00Z",
    reviewed_at: "2024-02-16T14:30:00Z",
    review_notes: "Verified against supporting death certificate and legal heir documentation.",
  },
];

export default function CitizenRequestsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const { data: corrections = [], isLoading } = useQuery({
    queryKey: ["all-corrections"],
    queryFn: async () => {
      try {
        const res = await citizenApi.getAllCorrections();
        if (res.data && res.data.length > 0) return res.data;
      } catch {
        // Fallback for offline demo
      }
      return DEMO_CORRECTIONS;
    },
    enabled: ["ADMIN", "OFFICER", "REVIEWER"].includes(user?.role || ""),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: string; note?: string }) =>
      citizenApi.processCorrection(id, action, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-corrections"] }),
  });

  if (isLoading) return <div className="p-8 text-center text-neutral-400">Loading correction requests...</div>;

  const pending = corrections.filter((c: any) => ["SUBMITTED", "UNDER_REVIEW"].includes(c.status));
  const processed = corrections.filter((c: any) => !["SUBMITTED", "UNDER_REVIEW"].includes(c.status));

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Citizen Requests</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {pending.length} pending · {processed.length} processed
          </p>
        </div>

        {corrections.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
            <Edit3 size={40} className="mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No correction requests</h3>
            <p className="text-sm text-neutral-500">Citizens haven't submitted any correction requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...pending, ...processed].map((cr: any) => {
              const cfg = STATUS_CONFIG[cr.status] || STATUS_CONFIG.SUBMITTED;
              const Icon = cfg.icon;
              const isExpanded = expandedId === cr.id;
              const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(cr.status);

              return (
                <div key={cr.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-neutral-50 transition"
                    onClick={() => setExpandedId(isExpanded ? null : cr.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e8f5ee" }}>
                      <Edit3 size={16} style={{ color: "#235234" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 text-sm">{cr.field_name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                        <span className="text-xs text-neutral-400">· Record #{cr.record_id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                        <User size={11} />
                        <span>{cr.citizen_name}</span>
                        <span>·</span>
                        <span>{formatDate(cr.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        <Icon size={11} />
                        {cfg.label}
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-5 border-t border-neutral-100 pt-4">
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
                        <div className="mb-4 text-sm text-neutral-600 bg-neutral-50 rounded-xl p-3">
                          <span className="font-medium text-neutral-700">Reason: </span>{cr.reason}
                        </div>
                      )}

                      {isPending && (
                        <div className="space-y-3">
                          <textarea
                            rows={2}
                            value={notes[cr.id] || ""}
                            onChange={e => setNotes(n => ({ ...n, [cr.id]: e.target.value }))}
                            placeholder="Add review notes (optional)..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-green-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => processMutation.mutate({ id: cr.id, action: "APPROVED", note: notes[cr.id] })}
                              disabled={processMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                              style={{ background: "#16a34a" }}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => processMutation.mutate({ id: cr.id, action: "NEEDS_MORE_INFORMATION", note: notes[cr.id] })}
                              disabled={processMutation.isPending}
                              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 text-neutral-700"
                            >
                              More Info
                            </button>
                            <button
                              onClick={() => processMutation.mutate({ id: cr.id, action: "REJECTED", note: notes[cr.id] })}
                              disabled={processMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {cr.review_notes && (
                        <div className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <span className="font-medium text-amber-800">Review Notes: </span>{cr.review_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
