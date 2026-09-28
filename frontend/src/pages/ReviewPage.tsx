import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { reviewApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatFieldLabel } from "../utils/helpers";
import { useAuthStore } from "../store/authStore";
import { ArrowRight, CheckSquare, AlertTriangle, Sparkles } from "lucide-react";

const DEMO_REVIEW_QUEUE = [
  { doc_id: "WB-ROR-1024", field_name: "plot_area", field_value: "2.40 acres", confidence: 0.87, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-1024", field_name: "mutation_number", field_value: "MUT-WB-DJ-7891", confidence: 0.84, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-0891", field_name: "dag_boundary_east", field_value: "PWD Road (24ft)", confidence: 0.78, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-0891", field_name: "co_sharer_share", field_value: "0.33 share", confidence: 0.82, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-1102", field_name: "owner_name", field_value: "Debabrata Sengupta", confidence: 0.72, status: "NEEDS_REVIEW" },
];

export default function ReviewPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuthStore();
  const { data: queue, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => reviewApi.getQueue().then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSpinner message="Loading verification queue..." />;

  const effectiveQueue = (queue && queue.length > 0) ? queue : DEMO_REVIEW_QUEUE;

  const grouped: Record<string, any[]> = {};
  effectiveQueue.forEach((item: any) => {
    if (!grouped[item.doc_id]) grouped[item.doc_id] = [];
    grouped[item.doc_id].push(item);
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Verification Queue"
        subtitle={`${effectiveQueue?.length || 0} fields across ${Object.keys(grouped).length} documents require human review`}>
        {isDemoMode && (
          <button
            onClick={() => navigate("/record-validation")}
            className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>Conflict Resolution Demo</span>
          </button>
        )}
      </PageHeader>

      <div className="p-8">
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
            <CheckSquare size={40} className="mx-auto mb-3 text-green-400" />
            <h3 className="font-semibold text-neutral-800">Queue is Empty</h3>
            <p className="text-sm text-neutral-500 mt-1">All documents have been processed or verified</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([docId, items]) => (
              <div key={docId} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100"
                  style={{ background: "#fdf8ef" }}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <div>
                      <span className="font-mono font-bold text-neutral-800">{docId}</span>
                      <span className="text-neutral-500 text-sm ml-3">{items.length} field(s) to review</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/review/${docId}`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
                    style={{ background: "#235234" }}>
                    Open Review <ArrowRight size={14} />
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                      <th className="px-6 py-2.5">Field</th>
                      <th className="px-6 py-2.5">Extracted Value</th>
                      <th className="px-6 py-2.5">Confidence</th>
                      <th className="px-6 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-neutral-700">{formatFieldLabel(item.field_name)}</td>
                        <td className="px-6 py-3 text-neutral-600 font-mono text-xs">{item.field_value || "—"}</td>
                        <td className="px-6 py-3 w-36">
                          <ConfidenceBar value={item.confidence} size="sm" />
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}