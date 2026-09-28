import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader, FileImage } from "lucide-react";
import { documentsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import toast from "react-hot-toast";

const PROCESSING_STEPS = [
  "File Validation", "Image Preprocessing", "Layout Detection",
  "OCR Extraction", "Language Detection", "Entity Extraction",
  "Field Classification", "Validation & Scoring",
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(-1);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setResult(null);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "application/pdf": [] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setCurrentStep(0);

    // Simulate progress steps
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, 600);

    try {
      const { data } = await documentsApi.upload(file);
      clearInterval(stepTimer);
      setCurrentStep(PROCESSING_STEPS.length);
      setResult(data);
      toast.success(`Document ${data.doc_id} uploaded successfully!`);
    } catch (err: any) {
      clearInterval(stepTimer);
      setCurrentStep(-1);
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Upload Land Record" subtitle="Upload scanned land documents for AI processing" />

      <div className="max-w-3xl mx-auto p-8 space-y-6">

        {/* Drop zone */}
        {!result && (
          <div {...getRootProps()} className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${isDragActive ? "border-green-400 bg-green-50" : "border-neutral-300 bg-white hover:border-green-300 hover:bg-green-50/30"}
          `}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#dff0e5" }}>
                <Upload size={28} style={{ color: "#235234" }} />
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-800">
                  {isDragActive ? "Drop the file here" : "Drop scanned land records here"}
                </p>
                <p className="text-sm text-neutral-500 mt-1">or click to browse files</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="px-2 py-1 bg-neutral-100 rounded">PDF</span>
                <span className="px-2 py-1 bg-neutral-100 rounded">JPG</span>
                <span className="px-2 py-1 bg-neutral-100 rounded">PNG</span>
                <span className="text-neutral-300">·</span>
                <span>Max 50 MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected file */}
        {file && !result && (
          <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#dff0e5" }}>
              <FileImage size={20} style={{ color: "#235234" }} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-neutral-800 text-sm">{file.name}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{formatSize(file.size)} · {file.type}</div>
            </div>
            {!uploading && (
              <button onClick={() => setFile(null)} className="text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Processing steps */}
        {uploading && currentStep >= 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Loader size={16} className="animate-spin" style={{ color: "#235234" }} />
              <h3 className="font-semibold text-neutral-800">Processing Document...</h3>
            </div>
            <div className="space-y-2">
              {PROCESSING_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {i < currentStep ? (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  ) : i === currentStep ? (
                    <Loader size={16} className="animate-spin shrink-0" style={{ color: "#235234" }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-200 shrink-0" />
                  )}
                  <span className={i <= currentStep ? "text-neutral-800" : "text-neutral-400"}>{step}</span>
                  {i < currentStep && <span className="ml-auto text-xs text-green-600 font-medium">Done</span>}
                  {i === currentStep && <span className="ml-auto text-xs text-blue-600 font-medium">Running...</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / PROCESSING_STEPS.length) * 100}%`, background: "#2d6942" }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Upload Failed</div>
              <div className="text-sm mt-0.5 text-red-600">{error}</div>
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="bg-white rounded-xl border-2 border-green-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <h3 className="font-semibold text-neutral-900">Document Uploaded Successfully</h3>
                <p className="text-sm text-neutral-500">Processing pipeline has been started</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="text-xs text-neutral-500 mb-1">Document ID</div>
                <div className="font-mono font-bold text-neutral-800">{result.doc_id}</div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="text-xs text-neutral-500 mb-1">Status</div>
                <div className="font-semibold text-blue-700">{result.status}</div>
              </div>
            </div>
            {result.demo_mode && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                Demo mode — AI processing simulation active
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => navigate(`/documents/${result.doc_id}`)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition"
                style={{ background: "#235234" }}>
                View Processing Status
              </button>
              <button onClick={() => { setFile(null); setResult(null); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition">
                Upload Another
              </button>
            </div>
          </div>
        )}

        {/* Upload button */}
        {file && !result && !uploading && (
          <button onClick={handleUpload}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: "linear-gradient(135deg, #235234, #2d6942)" }}>
            Upload & Start Processing
          </button>
        )}

        {/* Info panel */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h4 className="font-semibold text-neutral-800 text-sm mb-3">Supported Document Types</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-600">
            {[
              { label: "Scanned Records", desc: "Old/damaged physical records" },
              { label: "Digital PDFs", desc: "Government-issued digital copies" },
              { label: "Photo Images", desc: "JPG/PNG field photographs" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-neutral-700">{label}</div>
                  <div className="text-neutral-400">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}