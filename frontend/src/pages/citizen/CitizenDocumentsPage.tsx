import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { citizenApi } from "../../services/api";
import { FileText, CheckCircle, Clock, AlertTriangle, Upload, ExternalLink } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import StatusBadge from "../../components/ui/StatusBadge";

const PIPELINE_LABELS: Record<string, { label: string; color: string }> = {
  UPLOADED: { label: "Queued", color: "#6b7280" },
  PREPROCESSING: { label: "Preprocessing", color: "#3b82f6" },
  LAYOUT_DETECTION: { label: "Layout Detection", color: "#8b5cf6" },
  OCR: { label: "OCR Running", color: "#f59e0b" },
  NLP: { label: "NLP Processing", color: "#f59e0b" },
  VALIDATION: { label: "Validating", color: "#f59e0b" },
  REVIEW: { label: "Officer Review", color: "#ca8a04" },
  COMPLETED: { label: "Completed", color: "#16a34a" },
  FAILED: { label: "Failed", color: "#dc2626" },
};

import { useAuthStore } from "../../store/authStore";

const DEMO_CITIZEN_DOCS = [
  {
    id: 1,
    doc_id: "WB-ROR-1024",
    filename: "Khatian_1024_Matigara.pdf",
    uploaded_at: "2024-03-14T10:30:00Z",
    status: "COMPLETED",
    overall_confidence: 0.948,
  },
  {
    id: 2,
    doc_id: "WB-MUT-7891",
    filename: "MutationCertificate_MUT7891.pdf",
    uploaded_at: "2024-02-18T16:45:00Z",
    status: "COMPLETED",
    overall_confidence: 0.912,
  },
];

export default function CitizenDocumentsPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuthStore();

  const { data: rawDocs, isLoading } = useQuery({
    queryKey: ["citizen-my-docs"],
    queryFn: async () => {
      try {
        const res = await citizenApi.getMyDocuments();
        if (res.data && res.data.length > 0) return res.data;
      } catch {
        // Fallback for offline demo
      }
      return null;
    },
    refetchInterval: 15000,
  });

  const docs = (rawDocs && rawDocs.length > 0) ? rawDocs : (isDemoMode ? DEMO_CITIZEN_DOCS : []);

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Documents</h1>
            <p className="text-sm text-neutral-500 mt-1">Track the processing status of your submitted documents</p>
          </div>
          <button
            onClick={() => navigate("/citizen/upload")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#235234" }}
          >
            <Upload size={16} />
            Upload New
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-neutral-400">Loading your documents...</div>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
            <FileText size={48} className="mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No documents submitted</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Submit your first land document to begin the digitization and verification process.
            </p>
            <button
              onClick={() => navigate("/citizen/upload")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#235234" }}
            >
              <Upload size={16} /> Upload Document
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc: any) => {
              const statusCfg = PIPELINE_LABELS[doc.status] || PIPELINE_LABELS.UPLOADED;
              const isProcessing = ["UPLOADED", "PREPROCESSING", "LAYOUT_DETECTION", "OCR", "NLP", "VALIDATION"].includes(doc.status);

              return (
                <div key={doc.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e8f5ee" }}>
                      <FileText size={20} style={{ color: "#235234" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-neutral-900 text-sm font-mono">{doc.doc_id}</div>
                          <div className="text-xs text-neutral-500 mt-0.5 truncate">{doc.filename}</div>
                        </div>
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                          style={{ color: statusCfg.color, background: `${statusCfg.color}15` }}
                        >
                          {isProcessing && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusCfg.color }} />}
                          {doc.status === "COMPLETED" && <CheckCircle size={11} />}
                          {doc.status === "FAILED" && <AlertTriangle size={11} />}
                          {doc.status === "REVIEW" && <Clock size={11} />}
                          {statusCfg.label}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span>Submitted: {formatDate(doc.uploaded_at)}</span>
                        {doc.language && <span>Language: {doc.language}</span>}
                        {doc.overall_confidence != null && (
                          <span className="font-mono">
                            Confidence: {(doc.overall_confidence * 100).toFixed(1)}%
                          </span>
                        )}
                        {doc.file_size && (
                          <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                        )}
                      </div>

                      {/* OCR confidence breakdown */}
                      {doc.status === "COMPLETED" && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[
                            { label: "OCR", value: doc.ocr_confidence },
                            { label: "Extraction", value: doc.extraction_confidence },
                            { label: "Validation", value: doc.validation_confidence },
                          ].map(({ label, value }) => value != null && (
                            <div key={label} className="bg-neutral-50 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold" style={{ color: (value || 0) > 0.8 ? "#16a34a" : (value || 0) > 0.6 ? "#ca8a04" : "#dc2626" }}>
                                {((value || 0) * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-neutral-500">{label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

