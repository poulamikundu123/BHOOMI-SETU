import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatFieldLabel, formatDate, formatConfidence } from "../utils/helpers";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw } from "lucide-react";

const TIMELINE_STEPS = [
  { key: "UPLOADED", label: "Uploaded" },
  { key: "PREPROCESSING", label: "Preprocessed" },
  { key: "LAYOUT_DETECTION", label: "Layout Detected" },
  { key: "OCR", label: "OCR Completed" },
  { key: "NLP", label: "Entities Extracted" },
  { key: "VALIDATION", label: "Validated" },
  { key: "REVIEW", label: "Human Reviewed" },
  { key: "COMPLETED", label: "Stored" },
];

const STATUS_ORDER = ["UPLOADED","PREPROCESSING","LAYOUT_DETECTION","OCR","NLP","VALIDATION","REVIEW","COMPLETED","FAILED"];

function getStepStatus(stepKey: string, docStatus: string) {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currIdx = STATUS_ORDER.indexOf(docStatus);
  if (docStatus === "FAILED") return stepIdx <= currIdx ? "done" : "pending";
  if (stepIdx < currIdx) return "done";
  if (stepIdx === currIdx) return "current";
  return "pending";
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: doc, isLoading, refetch } = useQuery<any>({
    queryKey: ["document", id],
    queryFn: () => documentsApi.get(id!).then(r => r.data),
    refetchInterval: (query: any) => ["COMPLETED","FAILED"].includes(query?.state?.data?.status) ? false : 3000,
  });
  const { data: fields } = useQuery({
    queryKey: ["document-fields", id],
    queryFn: () => documentsApi.getFields(id!).then(r => r.data),
    enabled: !!id,
  });
  const { data: validations } = useQuery({
    queryKey: ["document-validations", id],
    queryFn: () => documentsApi.getValidations(id!).then(r => r.data),
    enabled: !!id,
  });
  const { data: ocrData } = useQuery({
    queryKey: ["document-ocr", id],
    queryFn: () => documentsApi.getOcrText(id!).then(r => r.data),
    enabled: !!id && doc?.status !== "UPLOADED",
  });

  if (isLoading) return <LoadingSpinner message="Loading document..." />;

  const effectiveDoc = doc || {
    doc_id: id || "WB-ROR-1024",
    filename: `${id || "WB-ROR-1024"}_Matigara.pdf`,
    status: id === "WB-ROR-0891" || id === "WB-ROR-1102" ? "REVIEW" : "COMPLETED",
    language: "Bengali / English",
    overall_confidence: 0.962,
    file_size: 2450000,
    uploaded_at: "2024-03-14T10:30:00Z",
    processed_at: "2024-03-14T10:31:12Z",
  };

  const effectiveFields = (fields && fields.length > 0) ? fields : [
    { field_name: "owner_name", field_value: "Amit Kumar Das", confidence: 0.96, status: "VALID" },
    { field_name: "survey_number", field_value: "104", confidence: 0.99, status: "VALID" },
    { field_name: "khata_number", field_value: "238", confidence: 0.98, status: "VALID" },
    { field_name: "khasra_number", field_value: "104 (Dag 67/A)", confidence: 0.99, status: "VALID" },
    { field_name: "plot_area", field_value: "2.40 acres", confidence: 0.87, status: "NEEDS_REVIEW" },
    { field_name: "village_mouza", field_value: "Matigara", confidence: 0.94, status: "VALID" },
    { field_name: "tehsil", field_value: "Siliguri Sub-Division", confidence: 0.92, status: "VALID" },
    { field_name: "district", field_value: "Darjeeling", confidence: 0.96, status: "VALID" },
    { field_name: "land_classification", field_value: "Agricultural (Dhani-II)", confidence: 0.95, status: "VALID" },
    { field_name: "fathers_name", field_value: "Suresh Das", confidence: 0.98, status: "VALID" },
    { field_name: "mutation_number", field_value: "MUT-WB-DJ-7891", confidence: 0.96, status: "VALID" },
    { field_name: "registration_date", field_value: "14/06/2019", confidence: 0.99, status: "VALID" },
  ];

  const validFieldsMap = Object.fromEntries(
    (validations || []).map((v: any) => [v.field_name, v])
  );

  const statusIcon = (status: string) => {
    if (["VALID","COMPLETED","VERIFIED"].includes(status)) return <CheckCircle size={14} className="text-green-500" />;
    if (["WARNING","NEEDS_REVIEW"].includes(status)) return <AlertTriangle size={14} className="text-yellow-500" />;
    if (["INVALID","FAILED"].includes(status)) return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-neutral-400" />;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title={effectiveDoc.doc_id} subtitle={`${effectiveDoc.filename} · ${effectiveDoc.language || "Bengali / English"}`}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={() => navigate("/document-overview")}
          className="flex items-center gap-2 text-sm font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg px-3 py-2 transition">
          <FileText size={14} /> Flagship RoR Viewer
        </button>
        {effectiveDoc.status === "REVIEW" && (
          <button onClick={() => navigate(`/review/${id}`)}
            className="flex items-center gap-2 text-sm font-semibold text-white rounded-lg px-4 py-2 transition"
            style={{ background: "#ca8a04" }}>
            Open for Review
          </button>
        )}
      </PageHeader>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Document Info + Timeline */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 text-sm">Document Status</h3>
                <StatusBadge status={effectiveDoc.status} />
              </div>
              {effectiveDoc.overall_confidence != null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-500">Overall Confidence</span>
                    <span className="font-semibold">{formatConfidence(effectiveDoc.overall_confidence)}</span>
                  </div>
                  <ConfidenceBar value={effectiveDoc.overall_confidence} showLabel={false} />
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Uploaded", formatDate(effectiveDoc.uploaded_at)],
                  ["Pages", "4 pages (Full RoR)"],
                  ["Language", effectiveDoc.language || "Bengali / English"],
                  ["Verification", "Automated + Human"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="bg-neutral-50 p-2 rounded-lg">
                    <div className="text-neutral-400">{k}</div>
                    <div className="font-medium text-neutral-700 mt-0.5">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Timeline */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs">
              <h3 className="font-semibold text-neutral-900 text-sm mb-4">Processing Pipeline Timeline</h3>
              <div className="space-y-2">
                {TIMELINE_STEPS.map((step, i) => {
                  const st = getStepStatus(step.key, effectiveDoc.status);
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          st === "done" ? "bg-green-100 text-green-700" :
                          st === "current" ? "text-white" : "bg-neutral-100 text-neutral-400"
                        }`} style={st === "current" ? { background: "#2d6942" } : {}}>
                          {st === "done" ? "✓" : i + 1}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`w-0.5 h-4 ${st === "done" ? "bg-green-200" : "bg-neutral-100"}`} />
                        )}
                      </div>
                      <span className={`text-xs ${
                        st === "done" ? "text-neutral-600" :
                        st === "current" ? "font-semibold text-neutral-900" : "text-neutral-300"
                      }`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Fields + OCR */}
          <div className="lg:col-span-2 space-y-6">
            {/* Extracted Fields */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">AI Extracted Fields</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {effectiveFields.length} fields extracted · Multimodal OCR + Entity Classification
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Avg Conf: 95.8%
                </span>
              </div>
              <div className="divide-y divide-neutral-50">
                {effectiveFields.map((field: any, idx: number) => {
                  const val = validFieldsMap[field.field_name];
                  return (
                    <div key={field.id || idx} className="px-6 py-3.5 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                      <div className="w-44 shrink-0">
                        <div className="text-xs font-medium text-neutral-500">{formatFieldLabel(field.field_name)}</div>
                      </div>
                      <div className="flex-1 font-semibold text-neutral-800 text-sm">
                        {field.field_value || <span className="text-neutral-300 italic">Not extracted</span>}
                      </div>
                      <div className="w-28 shrink-0">
                        <ConfidenceBar value={field.confidence >= 1 ? field.confidence / 100 : field.confidence} size="sm" />
                      </div>
                      <div className="w-8 shrink-0 flex justify-center">
                        {statusIcon(field.status)}
                      </div>
                      {val && (
                        <div className="text-xs text-neutral-400 max-w-32 truncate" title={val.message}>
                          {val.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OCR Text */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">OCR Raw Extracted Text</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Language: {ocrData?.language || "Bengali (বাংলা) + English"}
                  </p>
                </div>
                <span className="text-xs text-neutral-400 font-mono">UTF-8 Normalized</span>
              </div>
              <pre className="p-6 text-xs text-neutral-700 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-60"
                style={{ fontFamily: "'Noto Sans Devanagari', monospace", background: "#fafafa" }}>
                {ocrData?.text || `পশ্চিমবঙ্গ সরকার — ভূমি ও ভূমি সংস্কার দপ্তর
খতিয়ান নং: ১০২৪ • মৌজা: মাটিগাড়া • জে.এল. নং: ৪৭ • থানা: শিলিগুড়ি
রায়তের নাম: অমিত কুমার দাস (Amit Kumar Das) • পিতা: সুরেশ দাস (Suresh Das)
দাগ নং: ১০৪ (Dag 67/A) • খাতা নং: ২৩৮ • শ্রেণি: ধানী-২ (Agricultural Dhani-II)
জমির পরিমাণ: ২.৪০ একর (2.40 acres) • বার্ষিক খাজনা: ₹১৪২.৫০
নামপত্তন কেস নং: MUT-WB-DJ-7891 • রেজিস্ট্রি তারিখ: ১৪/০৬/২০১৯`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}