import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Activity, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "../utils/helpers";

const PROGRESS_MAP: Record<string, number> = {
  UPLOADED: 5, PREPROCESSING: 20, LAYOUT_DETECTION: 35,
  OCR: 50, NLP: 65, VALIDATION: 80, REVIEW: 90, COMPLETED: 100, FAILED: 100
};

const STEP_LABELS = ["Upload", "Preprocess", "Layout", "OCR", "NLP", "Validate", "Review", "Complete"];

export default function ProcessingMonitorPage() {
  const navigate = useNavigate();
  const { data: docs, isLoading, refetch } = useQuery({
    queryKey: ["processing-docs"],
    queryFn: () => documentsApi.list({ limit: 30 }).then(r => r.data),
    refetchInterval: 5000,
  });

  if (isLoading) return <LoadingSpinner message="Loading monitor..." />;

  const active = (docs || []).filter((d: any) => !["COMPLETED","FAILED"].includes(d.status));
  const completed = (docs || []).filter((d: any) => ["COMPLETED","FAILED"].includes(d.status));

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Processing Monitor" subtitle="Real-time document processing pipeline status">
        <button onClick={() => refetch()}
          className="flex items-center gap-2 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition text-neutral-600">
          <RefreshCw size={14} /> Refresh
        </button>
      </PageHeader>

      <div className="p-8 space-y-6">
        {/* Active jobs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-green-600" />
            <h3 className="font-semibold text-neutral-800">Active Jobs ({active.length})</h3>
            {active.length > 0 && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>

          {active.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-400">
              <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
              <div className="text-sm">No active processing jobs</div>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((doc: any) => {
                const progress = PROGRESS_MAP[doc.status] || 0;
                const stepIdx = Object.keys(PROGRESS_MAP).indexOf(doc.status);
                return (
                  <div key={doc.id} className="bg-white rounded-xl border border-neutral-200 p-5"
                    onClick={() => navigate(`/documents/${doc.doc_id}`)} style={{ cursor: "pointer" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-neutral-800">{doc.doc_id}</span>
                        <StatusBadge status={doc.status} size="sm" />
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#235234" }}>{progress}%</span>
                    </div>
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%`, background: "linear-gradient(90deg, #235234, #4f9e67)" }} />
                    </div>
                    <div className="flex gap-1">
                      {STEP_LABELS.map((step, i) => (
                        <div key={step} className="flex-1 text-center">
                          <div className={`h-1.5 rounded-full mb-1 ${i * 14 <= progress ? "bg-green-400" : "bg-neutral-200"}`} />
                          <div className="text-xs text-neutral-400" style={{ fontSize: 9 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed jobs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-neutral-500" />
            <h3 className="font-semibold text-neutral-800">Recent Completed ({completed.length})</h3>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs text-neutral-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Document</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Confidence</th>
                  <th className="px-6 py-3">Language</th>
                  <th className="px-6 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {completed.slice(0, 10).map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => navigate(`/documents/${doc.doc_id}`)}>
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-neutral-700">{doc.doc_id}</td>
                    <td className="px-6 py-3"><StatusBadge status={doc.status} size="sm" /></td>
                    <td className="px-6 py-3 text-sm">
                      {doc.overall_confidence != null
                        ? `${Math.round(doc.overall_confidence * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-neutral-500">{doc.language || "—"}</td>
                    <td className="px-6 py-3 text-neutral-400 text-xs">{formatDate(doc.processed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}