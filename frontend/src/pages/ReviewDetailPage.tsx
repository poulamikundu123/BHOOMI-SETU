import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatFieldLabel, formatConfidence } from "../utils/helpers";
import { CheckCircle, XCircle, Edit3, Save, X, ArrowLeft, AlertTriangle, Check } from "lucide-react";
import toast from "react-hot-toast";

const DEMO_REVIEW_DETAIL: Record<string, any> = {
  "WB-ROR-1024": {
    document: {
      doc_id: "WB-ROR-1024",
      filename: "Khatian_1024_Matigara.pdf",
      overall_confidence: 0.948,
      status: "REVIEW",
      language: "Bengali / English",
      ocr_text: `পশ্চিমবঙ্গ সরকার — খতিয়ান নং ১০২৪
মৌজা: মাটিগাড়া | জে.এল. নং: ৪৭ | ব্লক: শিলিগুড়ি
মালিকের নাম: অমিত কুমার দাস (Amit Kumar Das)
পিতা: সুরেশ দাস (Suresh Das)
খাতা নং: ২৩৮ | দাগ নং: ১০৪ (Dag 67/A)
মোট পরিমাণ: ২.৪০ একর (2.40 acres)
জমির শ্রেণি: ধানী-২ (Dhani-II Agricultural)
নামপত্তন কেস নং: MUT-WB-DJ-7891
তারিখ: ১৪/০৬/২০১৯ | রাজস্ব কর্মকর্তা মোহর সিলমোহরযুক্ত`,
    },
    fields: [
      { id: "1", field_name: "owner_name", field_value: "Amit Kumar Das", confidence: 0.96, status: "VALID" },
      { id: "2", field_name: "survey_number", field_value: "104", confidence: 0.99, status: "VALID" },
      { id: "3", field_name: "khata_number", field_value: "238", confidence: 0.98, status: "VALID" },
      { id: "4", field_name: "khasra_number", field_value: "104 (Dag 67/A)", confidence: 0.99, status: "VALID" },
      { id: "5", field_name: "plot_area", field_value: "2.40 acres", confidence: 0.87, status: "NEEDS_REVIEW" },
      { id: "6", field_name: "village_mouza", field_value: "Matigara", confidence: 0.94, status: "VALID" },
      { id: "7", field_name: "district", field_value: "Darjeeling", confidence: 0.96, status: "VALID" },
      { id: "8", field_name: "land_classification", field_value: "Agricultural (Dhani-II)", confidence: 0.95, status: "VALID" },
      { id: "9", field_name: "fathers_name", field_value: "Suresh Das", confidence: 0.98, status: "VALID" },
      { id: "10", field_name: "mutation_number", field_value: "MUT-WB-DJ-7891", confidence: 0.84, status: "NEEDS_REVIEW" },
      { id: "11", field_name: "registration_date", field_value: "14/06/2019", confidence: 0.99, status: "VALID" },
    ],
    reviews: [
      { field_name: "plot_area", old_value: "2.10 acres", new_value: "2.40 acres" }
    ],
  },
};

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editReason, setEditReason] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["review-detail", id],
    queryFn: () => reviewApi.getDetail(id!).then(r => r.data),
    retry: 1,
  });

  const correctMut = useMutation({
    mutationFn: (payload: any) => reviewApi.correctField(id!, payload),
    onSuccess: () => {
      toast.success("Field corrected successfully");
      setEditingField(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["review-queue"] });
    },
    onError: () => {
      // In offline/demo mode, show instant toast success
      toast.success(`Field updated to "${editValue}" (Demo simulated)`);
      setEditingField(null);
    },
  });

  const approveMut = useMutation({
    mutationFn: () => reviewApi.approve(id!),
    onSuccess: () => {
      toast.success("Document approved and verified!");
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      navigate("/review");
    },
    onError: () => {
      toast.success("Document approved and verified! (Demo simulated)");
      navigate("/review");
    },
  });

  const rejectMut = useMutation({
    mutationFn: () => reviewApi.reject(id!),
    onSuccess: () => {
      toast.success("Document rejected");
      navigate("/review");
    },
    onError: () => {
      toast.success("Document rejected (Demo simulated)");
      navigate("/review");
    },
  });

  if (isLoading) return <LoadingSpinner message="Loading document for review..." />;

  const fallbackData = DEMO_REVIEW_DETAIL[id || ""] || {
    document: {
      doc_id: id || "WB-ROR-1024",
      filename: `${id || "WB-ROR-1024"}.pdf`,
      overall_confidence: 0.92,
      status: "REVIEW",
      language: "Bengali / English",
      ocr_text: "पश्चिमবঙ্গ সরকার — খতিয়ান ও দাগ রেকর্ড\nমৌজা: মাটিগাড়া | মহকুমা: শিলিগুড়ি\nমালিক: অমিত কুমার দাস | পিতা: সুরেশ দাস\nদাগ নং ১০৪ | খাতা ২৩৮ | পরিমাণ: ২.৪০ একর",
    },
    fields: [
      { id: "1", field_name: "owner_name", field_value: "Amit Kumar Das", confidence: 0.96, status: "VALID" },
      { id: "2", field_name: "plot_area", field_value: "2.40 acres", confidence: 0.87, status: "NEEDS_REVIEW" },
      { id: "3", field_name: "khata_number", field_value: "238", confidence: 0.98, status: "VALID" },
      { id: "4", field_name: "dag_number", field_value: "104", confidence: 0.99, status: "VALID" },
    ],
    reviews: [],
  };

  const effectiveData = data || fallbackData;
  const { document: doc, fields, reviews } = effectiveData;

  const startEdit = (field: any) => {
    setEditingField(field.field_name);
    setEditValue(field.field_value || "");
    setEditReason("");
  };

  const saveEdit = () => {
    if (!editingField) return;
    correctMut.mutate({ field_name: editingField, new_value: editValue, reason: editReason });
  };

  const correctedFields = new Set(reviews.map((r: any) => r.field_name));

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title={`Review: ${doc.doc_id}`}
        subtitle={`${doc.filename} · Confidence: ${formatConfidence(doc.overall_confidence)}`}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition text-neutral-600">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={() => rejectMut.mutate()}
          disabled={rejectMut.isPending}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition">
          <XCircle size={14} /> Reject
        </button>
        <button onClick={() => approveMut.mutate()}
          disabled={approveMut.isPending}
          className="flex items-center gap-2 text-sm font-semibold text-white rounded-lg px-4 py-2 transition"
          style={{ background: "#235234" }}>
          <CheckCircle size={14} />
          {approveMut.isPending ? "Approving..." : "Approve Record"}
        </button>
      </PageHeader>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: OCR Text */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h3 className="font-semibold text-neutral-900">Original Document Text (OCR)</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Language: {doc.language || "—"}</p>
              </div>
              <pre className="p-6 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-auto"
                style={{ fontFamily: "'Noto Sans Devanagari', monospace", background: "#fdf8ef" }}>
                {doc.ocr_text || "OCR text not available for this document.\n\n[Demo mode: Text would appear here after processing]"}
              </pre>
            </div>

            {/* Review history */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900 text-sm">Corrections Made</h3>
                </div>
                <div className="divide-y divide-neutral-50">
                  {reviews.map((r: any, i: number) => (
                    <div key={i} className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        <span className="font-medium">{formatFieldLabel(r.field_name)}</span>
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        <span className="line-through text-red-400">{r.old_value}</span>
                        {" → "}
                        <span className="text-green-700 font-medium">{r.new_value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Fields */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900">Extracted Fields</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {fields.filter((f: any) => f.confidence < 0.75).length} low-confidence fields highlighted
                </p>
              </div>
            </div>
            <div className="divide-y divide-neutral-50 max-h-[600px] overflow-y-auto">
              {fields.map((field: any) => {
                const isLow = field.confidence < 0.75;
                const isEditing = editingField === field.field_name;
                const isCorrected = correctedFields.has(field.field_name);
                return (
                  <div key={field.id}
                    className={`px-6 py-4 ${isLow && !isCorrected ? "bg-amber-50/50" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            {formatFieldLabel(field.field_name)}
                          </span>
                          {isLow && !isCorrected && (
                            <AlertTriangle size={12} className="text-amber-500" />
                          )}
                          {isCorrected && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">Corrected</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                              placeholder="Enter corrected value..." autoFocus />
                            <input type="text" value={editReason} onChange={e => setEditReason(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-500 focus:outline-none"
                              placeholder="Reason for correction (optional)" />
                            <div className="flex gap-2">
                              <button onClick={saveEdit}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                                style={{ background: "#235234" }}>
                                <Save size={12} /> Save
                              </button>
                              <button onClick={() => setEditingField(null)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-neutral-800">
                            {field.field_value || <span className="text-neutral-300 italic">Not extracted</span>}
                          </div>
                        )}

                        <div className="mt-2">
                          <ConfidenceBar value={field.confidence} size="sm" />
                        </div>
                      </div>
                      {!isEditing && (
                        <button onClick={() => startEdit(field)}
                          className="shrink-0 text-neutral-400 hover:text-green-700 transition-colors p-1">
                          <Edit3 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}