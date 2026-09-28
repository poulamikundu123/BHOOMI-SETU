import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "../../services/api";
import { Upload, FileText, CheckCircle, Clock, AlertTriangle, X, ArrowLeft } from "lucide-react";

type Stage = "idle" | "uploading" | "preprocessing" | "ocr" | "extraction" | "validation" | "review" | "done" | "error";

const STAGES: { key: Stage; label: string; desc: string }[] = [
  { key: "uploading", label: "Document Uploaded", desc: "File received by server" },
  { key: "preprocessing", label: "Image Preprocessed", desc: "Deskew, denoise, enhance" },
  { key: "ocr", label: "OCR Completed", desc: "Text extracted from scan" },
  { key: "extraction", label: "Entities Extracted", desc: "Fields parsed and classified" },
  { key: "validation", label: "Fields Validated", desc: "Cross-referencing databases" },
  { key: "review", label: "Awaiting Officer Review", desc: "Low-confidence fields flagged" },
];

const STAGE_ORDER: Stage[] = ["uploading", "preprocessing", "ocr", "extraction", "validation", "review", "done"];

export default function CitizenUploadPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [docId, setDocId] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const simulatePipeline = async (stages: Stage[]) => {
    for (const s of stages) {
      setStage(s);
      await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
    }
  };

  const mutation = useMutation({
    mutationFn: (f: File) => documentsApi.upload(f),
    onSuccess: async (res) => {
      setDocId(res.data.doc_id);
      await simulatePipeline(["preprocessing", "ocr", "extraction", "validation", "review"]);
      setStage("done");
      qc.invalidateQueries({ queryKey: ["citizen-my-docs"] });
      qc.invalidateQueries({ queryKey: ["citizen-dashboard-stats"] });
    },
    onError: (err: any) => {
      setStage("error");
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    }
  });

  const handleFile = useCallback((f: File) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type. Please upload PDF, JPG, or PNG.`);
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum allowed is 20 MB.");
      return;
    }
    setError("");
    setFile(f);
  }, []);

  const handleUpload = () => {
    if (!file) return;
    setStage("uploading");
    mutation.mutate(file);
  };

  const currentStageIdx = STAGE_ORDER.indexOf(stage);

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-2xl mx-auto px-8 py-8">
        <button onClick={() => navigate("/citizen/dashboard")} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition mb-6">
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Upload Land Document</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Submit your scanned land record for AI-powered digitization and verification.
          </p>
        </div>

        {stage === "idle" && (
          <>
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragOver ? "border-green-500 bg-green-50" : "border-neutral-300 bg-white hover:border-green-400 hover:bg-neutral-50"
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f5ee" }}>
                <Upload size={28} style={{ color: "#235234" }} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {file ? file.name : "Drop your document here"}
              </h3>
              <p className="text-sm text-neutral-500">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Ready to upload`
                  : "PDF, JPG, PNG · Maximum 20 MB"}
              </p>
              {!file && (
                <button className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold border-2 transition" style={{ borderColor: "#235234", color: "#235234" }}>
                  Browse Files
                </button>
              )}
            </div>

            {file && (
              <div className="mt-4 bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#e8f5ee" }}>
                  <FileText size={20} style={{ color: "#235234" }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-900">{file.name}</div>
                  <div className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                <button onClick={() => setFile(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={18} />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Accepted documents info */}
            <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Accepted Document Types</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                {[
                  "Patta / Land Title Deed", "Khatiyan / Jamabandi",
                  "Sale Deed", "Mutation Document",
                  "Survey Map", "Inheritance / Succession Document",
                  "Government-Issued Land Certificate", "RoR (Record of Rights)"
                ].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={!file}
              onClick={handleUpload}
              className="mt-5 w-full py-3.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: file ? "#235234" : "#94a3b8" }}
            >
              {file ? "Submit for Processing →" : "Select a file to continue"}
            </button>
          </>
        )}

        {stage !== "idle" && stage !== "error" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8">
            <div className="text-center mb-8">
              {stage === "done" ? (
                <>
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <h2 className="text-xl font-bold text-neutral-900">Document Submitted Successfully</h2>
                  <p className="text-sm text-neutral-500 mt-2">
                    Your document <span className="font-mono font-semibold">{docId}</span> has entered the verification pipeline.
                    An officer will review low-confidence fields.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full border-4 border-green-200 border-t-green-600 animate-spin mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-neutral-900">Processing Your Document</h2>
                  <p className="text-sm text-neutral-500 mt-1">This may take a few moments...</p>
                </>
              )}
            </div>

            {/* Pipeline stages */}
            <div className="space-y-3">
              {STAGES.map((s, i) => {
                const stageIdx = STAGE_ORDER.indexOf(s.key);
                const isDone = currentStageIdx > stageIdx || stage === "done";
                const isCurrent = STAGE_ORDER[currentStageIdx] === s.key && stage !== "done";

                return (
                  <div key={s.key} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isCurrent ? "bg-green-50 border border-green-200" : "bg-neutral-50"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? "bg-green-500" : isCurrent ? "bg-amber-500" : "bg-neutral-200"
                    }`}>
                      {isDone
                        ? <CheckCircle size={16} className="text-white" />
                        : isCurrent
                        ? <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        : <Clock size={14} className="text-neutral-400" />
                      }
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isDone ? "text-neutral-900" : isCurrent ? "text-amber-800" : "text-neutral-400"}`}>
                        {s.label}
                      </div>
                      <div className="text-xs text-neutral-500">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {stage === "done" && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/citizen/documents")}
                  className="py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition"
                >
                  View My Documents
                </button>
                <button
                  onClick={() => navigate("/citizen/records")}
                  className="py-2.5 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: "#235234" }}
                >
                  View Land Records →
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "error" && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertTriangle size={40} className="mx-auto mb-3 text-red-500" />
            <h3 className="font-semibold text-neutral-900 mb-2">Upload Failed</h3>
            <p className="text-sm text-red-600 mb-5">{error}</p>
            <button
              onClick={() => { setStage("idle"); setError(""); setFile(null); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#235234" }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

