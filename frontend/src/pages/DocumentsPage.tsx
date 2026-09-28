import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { documentsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatDate, formatFileSize } from "../utils/helpers";
import { useAuthStore } from "../store/authStore";
import { Upload, Eye, FileText, Sparkles } from "lucide-react";

const DEMO_DOCUMENTS = [
  {
    id: "1",
    doc_id: "WB-ROR-1024",
    filename: "Khatian_1024_Matigara.pdf",
    status: "COMPLETED",
    language: "Bengali / English",
    overall_confidence: 0.96,
    file_size: 2450000,
    uploaded_at: "2024-03-14T10:30:00Z",
    is_demo: true,
  },
  {
    id: "2",
    doc_id: "WB-DEED-2023-884",
    filename: "SaleDeed_Siliguri_Plot104.pdf",
    status: "COMPLETED",
    language: "Bengali",
    overall_confidence: 0.98,
    file_size: 4120000,
    uploaded_at: "2023-11-10T14:15:00Z",
    is_demo: true,
  },
  {
    id: "3",
    doc_id: "WB-ROR-0891",
    filename: "Khatian_891_Naxalbari.pdf",
    status: "REVIEW",
    language: "Bengali",
    overall_confidence: 0.78,
    file_size: 1920000,
    uploaded_at: "2024-01-05T09:20:00Z",
    is_demo: true,
  },
  {
    id: "4",
    doc_id: "WB-MUT-7891",
    filename: "MutationCertificate_MUT7891.pdf",
    status: "COMPLETED",
    language: "English",
    overall_confidence: 0.99,
    file_size: 1240000,
    uploaded_at: "2019-06-18T16:45:00Z",
    is_demo: true,
  },
  {
    id: "5",
    doc_id: "WB-ROR-0945",
    filename: "Porcha_Phansidewa_Dag215.pdf",
    status: "COMPLETED",
    language: "Bengali",
    overall_confidence: 0.95,
    file_size: 3200000,
    uploaded_at: "2024-03-12T11:10:00Z",
    is_demo: true,
  },
  {
    id: "6",
    doc_id: "WB-CAD-104",
    filename: "Cadastral_Map_Sheet_12.pdf",
    status: "COMPLETED",
    language: "English",
    overall_confidence: 0.93,
    file_size: 8500000,
    uploaded_at: "2023-05-22T13:00:00Z",
    is_demo: true,
  },
  {
    id: "7",
    doc_id: "WB-ROR-1102",
    filename: "RecordOfRights_Rajganj_Khata310.pdf",
    status: "REVIEW",
    language: "Bengali",
    overall_confidence: 0.72,
    file_size: 2710000,
    uploaded_at: "2024-02-15T15:30:00Z",
    is_demo: true,
  },
];

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuthStore();
  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentsApi.list({ limit: 50 }).then(r => r.data),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSpinner message="Loading documents..." />;

  const effectiveDocs = (docs && docs.length > 0) ? docs : DEMO_DOCUMENTS;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Documents" subtitle={`${effectiveDocs?.length || 0} documents in the system`}>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <button
              onClick={() => navigate("/document-overview")}
              className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Flagship RoR Demo</span>
            </button>
          )}
          <button onClick={() => navigate("/documents/upload")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ background: "#235234" }}>
            <Upload size={14} /> Upload New
          </button>
        </div>
      </PageHeader>

      <div className="p-8">
        {!effectiveDocs?.length ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
            <FileText size={32} className="mx-auto mb-3 text-neutral-300" />
            <h3 className="font-semibold text-neutral-600">No Documents Yet</h3>
            <button onClick={() => navigate("/documents/upload")}
              className="mt-4 px-6 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: "#235234" }}>
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  <th className="px-6 py-3.5">Document</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Language</th>
                  <th className="px-6 py-3.5">Confidence</th>
                  <th className="px-6 py-3.5">Size</th>
                  <th className="px-6 py-3.5">Uploaded</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {effectiveDocs.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-mono text-xs text-neutral-800 font-semibold">{doc.doc_id}</div>
                      <div className="text-xs text-neutral-400 mt-0.5 max-w-48 truncate">{doc.filename}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={doc.status} size="sm" />
                      {doc.is_demo && <span className="ml-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Demo</span>}
                    </td>
                    <td className="px-6 py-3.5 text-neutral-600">{doc.language || "—"}</td>
                    <td className="px-6 py-3.5 w-36">
                      {doc.overall_confidence != null ? (
                        <ConfidenceBar value={doc.overall_confidence} size="sm" />
                      ) : (
                        <span className="text-xs text-neutral-300">Processing...</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-neutral-500 text-xs">{doc.file_size ? formatFileSize(doc.file_size) : "—"}</td>
                    <td className="px-6 py-3.5 text-neutral-500 text-xs">{formatDate(doc.uploaded_at)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/documents/${doc.doc_id}`)}
                          className="p-1.5 text-neutral-400 hover:text-green-700 transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        {doc.status === "REVIEW" && (
                          <button onClick={() => navigate(`/review/${doc.doc_id}`)}
                            className="text-xs text-amber-600 font-semibold hover:text-amber-800 transition">
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}