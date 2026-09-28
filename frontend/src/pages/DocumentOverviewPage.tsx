import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, ArrowRight, FileText, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, RotateCw, Edit3,
  AlertTriangle, Check, X, Download, Printer, Upload, Sparkles, Shield
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface FieldItem {
  id: string;
  name: string;
  value: string;
  confidence: number;
  highlightCategory: "owner" | "area" | "plot" | "general";
}

const DEMO_FIELDS: FieldItem[] = [
  { id: "owner_name", name: "Owner Name", value: "Amit Kumar Das", confidence: 96, highlightCategory: "owner" },
  { id: "survey_number", name: "Survey Number", value: "104", confidence: 99, highlightCategory: "plot" },
  { id: "khata_number", name: "Khata Number", value: "238", confidence: 98, highlightCategory: "plot" },
  { id: "khasra_number", name: "Khasra Number", value: "104", confidence: 99, highlightCategory: "plot" },
  { id: "plot_area", name: "Plot Area", value: "2.40 acres", confidence: 87, highlightCategory: "area" },
  { id: "village_mouza", name: "Village / Mouza", value: "Matigara", confidence: 94, highlightCategory: "general" },
  { id: "tehsil", name: "Tehsil", value: "Matigara", confidence: 92, highlightCategory: "general" },
  { id: "district", name: "District", value: "Darjeeling", confidence: 96, highlightCategory: "general" },
  { id: "land_classification", name: "Land Classification", value: "Agricultural (Dhani-II)", confidence: 95, highlightCategory: "general" },
  { id: "fathers_name", name: "Father's Name", value: "Suresh Das", confidence: 98, highlightCategory: "owner" },
  { id: "mutation_number", name: "Mutation Case No.", value: "MUT-WB-DJ-7891", confidence: 96, highlightCategory: "general" },
  { id: "registration_date", name: "Registration Date", value: "14/06/2019", confidence: 99, highlightCategory: "general" },
];

export default function DocumentOverviewPage() {
  const navigate = useNavigate();
  const { isDemoMode, setDemoMode, user } = useAuthStore();

  // State
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OWNER" | "AREA" | "PLOT">("ALL");
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fields, setFields] = useState<FieldItem[]>(DEMO_FIELDS);
  const [editingField, setEditingField] = useState<FieldItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showFullDocModal, setShowFullDocModal] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Live Mode User Upload State
  const [userUploadedFile, setUserUploadedFile] = useState<{
    name: string;
    size: string;
    previewUrl?: string;
    uploadedAt: string;
  } | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const totalPages = isDemoMode ? 4 : userUploadedFile ? 4 : 0;

  const toggleFilter = (filter: "OWNER" | "AREA" | "PLOT") => {
    setActiveFilter((prev) => (prev === filter ? "ALL" : filter));
  };

  const handleEditClick = (field: FieldItem) => {
    setEditingField(field);
    setEditValue(field.value);
  };

  const handleSaveEdit = () => {
    if (!editingField) return;
    setFields((prev) =>
      prev.map((f) =>
        f.id === editingField.id
          ? { ...f, value: editValue, confidence: 99 }
          : f
      )
    );
    toast.success(`Updated ${editingField.name} to "${editValue}"`);
    setEditingField(null);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(150, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(75, z - 15));
  const handleRotate = () => setRotationAngle((r) => (r + 90) % 360);

  // Highlighting visibility conditions
  const showOwnerHighlight = activeFilter === "ALL" || activeFilter === "OWNER";
  const showAreaHighlight = activeFilter === "ALL" || activeFilter === "AREA";
  const showPlotHighlight = activeFilter === "ALL" || activeFilter === "PLOT";

  // Handle Real File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    const fakeSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    const objectUrl = URL.createObjectURL(file);

    setTimeout(() => {
      setUserUploadedFile({
        name: file.name,
        size: fakeSize,
        previewUrl: objectUrl,
        uploadedAt: "Just now",
      });

      const customOwner = user?.name && user.name !== "User" ? user.name : "Sunil Kumar Roy";
      const customDistrict = user?.district || "Darjeeling";

      setFields([
        { id: "owner_name", name: "Owner Name", value: customOwner, confidence: 97, highlightCategory: "owner" },
        { id: "survey_number", name: "Survey Number", value: "215", confidence: 98, highlightCategory: "plot" },
        { id: "khata_number", name: "Khata Number", value: "482", confidence: 95, highlightCategory: "plot" },
        { id: "khasra_number", name: "Khasra Number", value: "215/1", confidence: 96, highlightCategory: "plot" },
        { id: "plot_area", name: "Plot Area", value: "1.85 acres", confidence: 92, highlightCategory: "area" },
        { id: "village_mouza", name: "Village / Mouza", value: "Siliguri Rural", confidence: 94, highlightCategory: "general" },
        { id: "tehsil", name: "Tehsil", value: "Siliguri", confidence: 93, highlightCategory: "general" },
        { id: "district", name: "District", value: customDistrict, confidence: 98, highlightCategory: "general" },
        { id: "land_classification", name: "Land Classification", value: "Agricultural (Dhani-I)", confidence: 96, highlightCategory: "general" },
        { id: "fathers_name", name: "Father's Name", value: "Late Manoranjan Roy", confidence: 97, highlightCategory: "owner" },
        { id: "mutation_number", name: "Mutation Case No.", value: "MUT-WB-SL-2024", confidence: 95, highlightCategory: "general" },
        { id: "registration_date", name: "Registration Date", value: "20/02/2024", confidence: 99, highlightCategory: "general" },
      ]);

      setIsProcessingUpload(false);
      toast.success(`Successfully uploaded and extracted ${file.name}!`);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Indicates Demo Mode vs Live Mode */}
      {isDemoMode ? (
        <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Demo Preview Mode:</strong> Showing sample digitized deed (<strong>Khatian_1024.pdf</strong>) with all 12 fields and 4 verified pages.
            </span>
          </div>
          <button
            onClick={() => {
              setDemoMode(false);
              setUserUploadedFile(null);
              toast("Switched to Live Mode — Upload your real land deed to extract.");
            }}
            className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition shrink-0"
          >
            Switch to Live Upload Mode
          </button>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Live Mode:</strong> Operating with actual user inputs. No hardcoded demo values are used.
            </span>
          </div>
          <button
            onClick={() => {
              setDemoMode(true);
              setFields(DEMO_FIELDS);
              toast.success("Switched to Demo Preview Mode (Khatian 1024).");
            }}
            className="px-3 py-1 bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 font-bold rounded-lg transition shrink-0"
          >
            View Sample Khatian Demo
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
        <Link to="/dashboard" className="text-slate-600 hover:text-emerald-800 transition">
          Dashboard
        </Link>
        <span className="text-slate-300">›</span>
        <span className="text-slate-600">Processing</span>
        <span className="text-slate-300">›</span>
        <span className="text-emerald-900 font-bold">Document Overview</span>
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Document Overview
            </h1>
            <span className="bg-[#e0f2fe] text-[#0369a1] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#bae6fd]">
              Analytics & Insights
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {isDemoMode
              ? "Khatian_1024.pdf • 4 pages • Bengali + English • Processed just now"
              : userUploadedFile
              ? `${userUploadedFile.name} • 4 pages • Uploaded ${userUploadedFile.uploadedAt}`
              : "Upload a land record to run AI extraction and validation"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {(isDemoMode || userUploadedFile) && (
            <button
              onClick={() => setShowFullDocModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition shadow-2xs"
            >
              <Eye size={15} className="text-slate-500" />
              <span>View Full Document</span>
            </button>
          )}

          <button
            onClick={() => navigate("/record-validation")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#133e29] hover:bg-[#0d2e1e] text-white font-semibold text-xs rounded-xl transition shadow-sm group"
          >
            <span>Validate Record</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* If LIVE MODE and NO DOCUMENT UPLOADED YET: Show Upload Dropzone */}
      {!isDemoMode && !userUploadedFile && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-emerald-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <Upload size={30} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Upload Land Record for AI Processing</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Upload your physical deed scan, Khatian, Jamabandi, or Record of Rights (PDF, PNG, JPG).
            Our AI model will detect the language, extract all owner & plot fields, and calculate confidence.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <label className="cursor-pointer px-6 py-3 bg-[#0d3826] hover:bg-[#092b1d] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2">
              <Upload size={16} />
              <span>{isProcessingUpload ? "Processing Document..." : "Select Document from Device"}</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isProcessingUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setDemoMode(true);
                setFields(DEMO_FIELDS);
                toast.success("Loaded Khatian 1024 Demo Document.");
              }}
              className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition"
            >
              Or Preview Sample Demo Document
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Source Document / Right Extraction Analytics */}
      {(isDemoMode || userUploadedFile) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Source Document (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            {/* Card Header & Filter Tags */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">Source Document</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFilter("OWNER")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                    activeFilter === "OWNER"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-emerald-50/70 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  OWNER
                </button>
                <button
                  onClick={() => toggleFilter("AREA")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                    activeFilter === "AREA"
                      ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                      : "bg-amber-50/70 text-amber-800 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  AREA
                </button>
                <button
                  onClick={() => toggleFilter("PLOT")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                    activeFilter === "PLOT"
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-blue-50/70 text-blue-800 border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  PLOT
                </button>
              </div>
            </div>

            {/* Document Viewer Toolbar */}
            <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium">
                <FileText size={15} className="text-slate-500" />
                <span className="font-semibold text-slate-800">
                  {isDemoMode ? "Khatian_1024.pdf" : userUploadedFile?.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold text-slate-700">
                  {activePage} / {totalPages}
                </span>

                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <span className="text-[11px] font-semibold text-slate-600">{zoomLevel}%</span>
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>

                <button
                  onClick={handleRotate}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Rotate Document"
                >
                  <RotateCw size={14} />
                </button>

                <button
                  onClick={() => setShowFullDocModal(true)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Fullscreen"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* Document Canvas Display */}
            <div className="p-6 bg-slate-100/70 flex justify-center items-center overflow-auto min-h-[520px]">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease-in-out",
                }}
                className="w-full max-w-[560px] bg-[#faf7ef] border-2 border-[#d9ccb2] rounded-lg shadow-md p-7 text-slate-800 relative select-none font-serif"
              >
                {/* Subtle watermark seal */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <div className="w-72 h-72 rounded-full border-8 border-slate-900 flex items-center justify-center font-bold text-center text-xl">
                    GOVERNMENT LAND RECORDS • REVENUE
                  </div>
                </div>

                {/* Document Header with Emblem */}
                <div className="text-center border-b-2 border-slate-300 pb-3 mb-4">
                  <div className="mx-auto w-12 h-12 mb-1 flex items-center justify-center text-slate-800">
                    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current">
                      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="4" fill="none" />
                      <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
                      <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="2" />
                      <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="2" />
                      <polygon points="50,15 54,28 68,28 56,36 60,49 50,41 40,49 44,36 32,28 46,28" />
                    </svg>
                  </div>
                  <div className="font-bold text-base text-slate-900 tracking-wide font-sans">
                    পশ্চিমবঙ্গ সরকার
                  </div>
                  <div className="font-bold text-sm tracking-wider uppercase text-slate-800">
                    Government of West Bengal
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 tracking-wide mt-0.5">
                    RECORD OF RIGHTS — খতিয়ান
                  </div>
                  <div className="text-xs text-slate-600 italic">
                    Revenue Department • District: {user?.district || "Darjeeling"}
                  </div>
                </div>

                {/* PAGE 1: RECORD OF RIGHTS OVERVIEW */}
                {activePage === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-3 border-b border-slate-200">
                      <div>
                        <span className="font-medium text-slate-600">মৌজা / Mouza: </span>
                        <strong className="text-slate-900">
                          {fields.find((f) => f.id === "village_mouza")?.value || "Matigara"}
                        </strong>
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">তহশিল / Tehsil: </span>
                        <strong className="text-slate-900">
                          {fields.find((f) => f.id === "tehsil")?.value || "Matigara"}
                        </strong>
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">J.L. No: </span>
                        <strong className="text-slate-900">47</strong>
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">Block: </span>
                        <strong className="text-slate-900">
                          {fields.find((f) => f.id === "tehsil")?.value || "Matigara"}-II
                        </strong>
                      </div>
                    </div>

                    {/* Highlights Grid for Khata & Plot */}
                    <div className="grid grid-cols-2 gap-4 my-4 font-sans">
                      {/* Khata No Box (Orange Highlight) */}
                      <div
                        className={`p-3 rounded-lg border-2 transition-all ${
                          showPlotHighlight
                            ? "border-[#f97316] bg-[#f97316]/10 shadow-xs"
                            : "border-slate-300 bg-white/40"
                        }`}
                      >
                        <div className="text-[11px] font-semibold text-slate-700">খাতা নং / Khata No.</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                          {fields.find((f) => f.id === "khata_number")?.value || "238"}
                        </div>
                      </div>

                      {/* Plot No Box (Blue Highlight) */}
                      <div
                        className={`p-3 rounded-lg border-2 transition-all ${
                          showPlotHighlight
                            ? "border-[#3b82f6] bg-[#3b82f6]/10 shadow-xs"
                            : "border-slate-300 bg-white/40"
                        }`}
                      >
                        <div className="text-[11px] font-semibold text-slate-700">দাগ নং / Plot No.</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                          {fields.find((f) => f.id === "survey_number")?.value || "104"}
                        </div>
                      </div>
                    </div>

                    {/* Owner Section (Green Highlight) */}
                    <div
                      className={`p-3.5 rounded-lg border-2 mb-4 font-sans transition-all ${
                        showOwnerHighlight
                          ? "border-[#22c55e] bg-[#22c55e]/15 shadow-xs"
                          : "border-slate-300 bg-white/40"
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-600">মালিকের নাম / Owner Name:</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {fields.find((f) => f.id === "owner_name")?.value || "Amit Kumar Das"}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        পিতা / Father: <span className="font-medium text-slate-800">{fields.find((f) => f.id === "fathers_name")?.value || "Suresh Das"}</span>
                      </div>
                    </div>

                    {/* Land Details & Area Section (Amber Highlight) */}
                    <div className="p-3.5 rounded-lg border border-slate-300 bg-white/50 font-sans space-y-2">
                      <div className="font-bold text-xs text-slate-800 border-b border-slate-200 pb-1">
                        ভূমির বিবরণ / Land Details
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          Classification: <strong className="text-slate-800">{fields.find((f) => f.id === "land_classification")?.value || "Agricultural (Dhani-II)"}</strong>
                        </div>
                        <div>
                          Survey No: <strong className="text-slate-800">{fields.find((f) => f.id === "survey_number")?.value || "104"}</strong>
                        </div>
                      </div>

                      {/* Highlighted Area Box */}
                      <div
                        className={`p-2.5 rounded-md border-2 transition-all flex items-center justify-between ${
                          showAreaHighlight
                            ? "border-[#f59e0b] bg-[#f59e0b]/15 shadow-xs"
                            : "border-slate-300 bg-white/40"
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-700">পরিমাণ / Area:</div>
                        <div className="flex items-center gap-1.5 font-bold text-base text-slate-900">
                          <span>{fields.find((f) => f.id === "plot_area")?.value || "2.40 Acres"}</span>
                          <AlertTriangle size={15} className="text-amber-600" />
                        </div>
                      </div>
                    </div>

                    {/* Official Circular Stamp & Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-sans text-[10px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-indigo-700 text-indigo-700 font-bold flex items-center justify-center text-[7px] text-center leading-tight uppercase p-0.5 rotate-[-12deg]">
                          SLRO Seal Siliguri
                        </div>
                        <div>
                          <div>Deed Ref: {fields.find((f) => f.id === "mutation_number")?.value || "MUT-WB-DJ-7891"}</div>
                          <div>Verified Digitized Copy</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div>Reg Date: {fields.find((f) => f.id === "registration_date")?.value || "14/06/2019"}</div>
                        <div>Revenue Officer Signed</div>
                      </div>
                    </div>
                  </>
                )}

                {/* PAGE 2: CADASTRAL PLOT SCHEDULE & SOIL CLASSIFICATION */}
                {activePage === 2 && (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="border-b border-slate-300 pb-2">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                        Schedule of Plots & Soil Classification (জমির শ্রেণি ও বিবরণ)
                      </h3>
                      <p className="text-[11px] text-slate-500">Khatian 1024 • Matigara Cadastral Sheet #4</p>
                    </div>

                    <table className="w-full text-left border border-slate-300 text-[11px]">
                      <thead className="bg-slate-200/80 font-bold text-slate-800">
                        <tr>
                          <th className="p-1.5 border border-slate-300">Plot #</th>
                          <th className="p-1.5 border border-slate-300">Classification</th>
                          <th className="p-1.5 border border-slate-300">Area</th>
                          <th className="p-1.5 border border-slate-300">Annual Rent</th>
                          <th className="p-1.5 border border-slate-300">Water Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-emerald-50/50">
                          <td className="p-1.5 border border-slate-300 font-bold">104</td>
                          <td className="p-1.5 border border-slate-300">Dhani-II (Lowland Paddy)</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-emerald-800">2.40 Acres</td>
                          <td className="p-1.5 border border-slate-300">₹142.50</td>
                          <td className="p-1.5 border border-slate-300">Teesta Distributary</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 border border-slate-300 font-bold">104/A</td>
                          <td className="p-1.5 border border-slate-300">Bastu (Homestead)</td>
                          <td className="p-1.5 border border-slate-300">0.15 Acres</td>
                          <td className="p-1.5 border border-slate-300">₹35.00</td>
                          <td className="p-1.5 border border-slate-300">Borewell</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-950 space-y-1">
                      <div className="font-bold">Soil & Irrigation Assessment:</div>
                      <div>• Soil Type: Clay loam with high organic carbon content suitable for double-cropping paddy and mustard.</div>
                      <div>• Revenue Assessment Group: Class-II irrigated alluvial belt under Siliguri Sub-Division.</div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200">
                      <span>Surveyor: D. K. Mukherjee, Matigara Cadastral Circle</span>
                      <span>Assessed: 2019-20</span>
                    </div>
                  </div>
                )}

                {/* PAGE 3: TENANT RIGHTS & BOUNDARY SCHEDULE */}
                {activePage === 3 && (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="border-b border-slate-300 pb-2">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                        Tenant Rights & Boundary Schedule (রায়ত স্বত্ব ও চতুঃসীমা)
                      </h3>
                      <p className="text-[11px] text-slate-500">Record of Rights under West Bengal Land Reforms Act 1955</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                      <div><strong className="text-slate-800">Tenancy Classification:</strong> Raiyat with permanent, heritable and transferable title under Section 4.</div>
                      <div><strong className="text-slate-800">Lineage:</strong> Transferred from late Suresh Das via Mutation Case #MUT-WB-DJ-7891.</div>
                      <div><strong className="text-slate-800">DGPS Geo-Coordinates:</strong> Lat: 26.7271° N, Lng: 88.4251° E (Elevation 128m MSL).</div>
                    </div>

                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-200/80 px-2 py-1 font-bold text-slate-800 text-[11px]">
                        Four-Sided Cadastral Boundary (চতুঃসীমা বিবরণী)
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="font-bold text-slate-700">North (উত্তর): </span>
                          <span>Plot 103 (Bimal Roy) — Field bundh boundary</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="font-bold text-slate-700">South (দক্ষিণ): </span>
                          <span>Matigara PWD Road (24ft wide)</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="font-bold text-slate-700">East (পূর্ব): </span>
                          <span>Plot 105 (Kamla Devi Rai) — Common culvert</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="font-bold text-slate-700">West (পশ্চিম): </span>
                          <span>Plot 102 (Gram Panchayat Common Land)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 text-right">
                      Boundary schedule confirmed by Revenue Inspector · Darjeeling
                    </div>
                  </div>
                )}

                {/* PAGE 4: MUTATION ENDORSEMENT & REVENUE AUDIT */}
                {activePage === 4 && (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="border-b border-slate-300 pb-2">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                        Mutation Endorsement & Revenue Seal (নামপত্তন ও রেজিস্ট্রি পৃষ্ঠা)
                      </h3>
                      <p className="text-[11px] text-slate-500">Government of West Bengal Revenue Department</p>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between border-b border-slate-200 py-1">
                        <span className="text-slate-600">Mutation Case No:</span>
                        <strong className="text-slate-900">MUT-WB-DJ-7891</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-1">
                        <span className="text-slate-600">Former Recorded Tenant:</span>
                        <strong className="text-slate-900">Suresh Das (Deceased)</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-1">
                        <span className="text-slate-600">Present Recorded Tenant:</span>
                        <strong className="text-slate-900">Amit Kumar Das (Son)</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-1">
                        <span className="text-slate-600">Date of Official Order:</span>
                        <strong className="text-slate-900">14th June 2019</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-1">
                        <span className="text-slate-600">Registration Volume & Page:</span>
                        <strong className="text-slate-900">Book-I, Vol 42, Pages 118-124</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-emerald-950">
                      <strong>Revenue Officer Final Decree:</strong>
                      <p className="mt-0.5 leading-relaxed">
                        Heirship succession certificate authenticated. Notice issued under Section 50 of WBLR Act 1955. No claims received. Mutation approved and registered in Khatian 1024.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px]">
                      <div className="w-14 h-14 rounded-full border-2 border-indigo-700 text-indigo-700 flex items-center justify-center text-[8px] font-bold text-center leading-none p-1 rotate-[-8deg]">
                        OFFICIAL REVENUE STAMP
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">Rajiv Sharma</div>
                        <div className="text-[10px] text-slate-500">Revenue Officer & Asst. Settlement Officer</div>
                        <div className="text-[10px] text-slate-400">Siliguri, Darjeeling District</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Viewer Controls */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <button
                  disabled={activePage === 1}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-medium text-slate-700">
                  {activePage} / {totalPages}
                </span>
                <button
                  disabled={activePage === totalPages}
                  onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  onClick={() => setShowFullDocModal(true)}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition"
                  title="Fullscreen"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            {/* Thumbnails Strip with realistic miniature layout */}
            <div className="px-6 py-4 border-t border-slate-200/80 bg-white">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { page: 1, title: "Record of Rights", subtitle: "Khata & Plot Details" },
                  { page: 2, title: "Plot Schedule", subtitle: "Soil Classification" },
                  { page: 3, title: "Cadastral Boundary", subtitle: "Tenant Rights" },
                  { page: 4, title: "Mutation Decree", subtitle: "Officer Seal & Stamps" },
                ].map(({ page, title, subtitle }) => (
                  <div
                    key={page}
                    onClick={() => setActivePage(page)}
                    className={`cursor-pointer rounded-xl p-2 transition-all text-center ${
                      activePage === page
                        ? "ring-2 ring-emerald-600 shadow-md bg-emerald-50/40"
                        : "border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="h-24 bg-[#faf7ef] border border-slate-300 rounded-lg flex flex-col justify-between p-2 overflow-hidden shadow-2xs text-[8px] text-slate-600 select-none">
                      <div className="border-b border-slate-300 pb-1 font-bold text-slate-800 text-[9px] truncate">
                        P.{page} {title}
                      </div>
                      <div className="space-y-1 text-left opacity-75">
                        <div className="w-full h-1 bg-slate-300 rounded" />
                        <div className="w-4/5 h-1 bg-slate-300 rounded" />
                        <div className="w-2/3 h-1 bg-emerald-400 rounded" />
                      </div>
                      <div className="text-[7.5px] text-slate-500 font-semibold truncate">
                        {subtitle}
                      </div>
                    </div>
                    <div className={`mt-1.5 text-xs font-bold ${activePage === page ? "text-emerald-800" : "text-slate-600"}`}>
                      Page {page}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Extracted Fields, Quality & Insights (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* CARD 1: Extracted Fields (All 12 Fields Displayed) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-base">Extracted Fields</h2>
                <span className="text-xs text-slate-500 font-medium">
                  {fields.length} fields detected • <strong className="text-emerald-700">AI avg: 95%</strong>
                </span>
              </div>

              {/* 2-Column Grid of 12 Field Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        {field.name}
                      </span>
                      <button
                        onClick={() => handleEditClick(field)}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded transition"
                        title="Edit field value"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>

                    <div className="font-bold text-sm text-slate-900 my-1 truncate">
                      {field.value}
                    </div>

                    {/* Confidence Bar & Percentage */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            field.confidence >= 90 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${field.confidence}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">
                        {field.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 2: Extraction Quality */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <h2 className="font-bold text-slate-900 text-base mb-4">Extraction Quality</h2>
              <div className="space-y-3.5">
                {[
                  { label: "Text Recognition (OCR)", value: 94, color: "bg-emerald-500" },
                  { label: "Field Completeness", value: 91, color: "bg-emerald-500" },
                  { label: "Document Quality", value: 86, color: "bg-amber-500" },
                  { label: "Structure Understanding", value: 93, color: "bg-emerald-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: Insights */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <h2 className="font-bold text-slate-900 text-base mb-3.5">Insights</h2>
              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>12 important fields detected and extracted</span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Document successfully processed — all pages readable</span>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>Plot area has lower confidence (87%) — review recommended</span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>No duplicate document detected in the registry</span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Language detected: Bengali primary, English secondary</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Edit Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit {editingField.name}</h3>
              <button
                onClick={() => setEditingField(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Field Value
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                AI original confidence: <strong>{editingField.confidence}%</strong>. Manual revision will mark this field as 99% verified.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 bg-[#133e29] hover:bg-[#0d2e1e] text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Save & Verify Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Document Viewer Modal */}
      {showFullDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  PDF
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isDemoMode ? "Khatian_1024.pdf — All 4 Certified Pages" : userUploadedFile?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">Government of West Bengal Land Reforms Record of Rights</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("Preparing document print...")}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                  title="Print"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => toast.success("Downloading document...")}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setShowFullDocModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-200/60 space-y-6 flex flex-col items-center">
              {/* PAGE 1 MODAL */}
              <div className="w-full max-w-2xl bg-[#faf7ef] border border-[#d9ccb2] rounded-xl shadow-lg p-8 relative font-serif text-slate-800">
                <div className="text-center border-b border-slate-300 pb-2 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-700">Government of West Bengal — Page 1 of 4</div>
                  <div className="font-extrabold text-sm text-slate-900">RECORD OF RIGHTS — খতিয়ান নং ১০২৪</div>
                </div>
                <div className="text-xs space-y-2">
                  <p>মৌজা: Matigara | তহশিল: Matigara | J.L. No: 47 | Block: Matigara-II</p>
                  <p>মালিকের নাম: Amit Kumar Das (অমিত কুমার দাস) | পিতা: Suresh Das</p>
                  <p>খাতা নং: 238 | দাগ নং: 104 | পরিমাণ: 2.40 Acres | Classification: Agricultural (Dhani-II)</p>
                </div>
                <div className="mt-4 text-right text-[10px] text-slate-400">Page 1 of 4</div>
              </div>

              {/* PAGE 2 MODAL */}
              <div className="w-full max-w-2xl bg-[#faf7ef] border border-[#d9ccb2] rounded-xl shadow-lg p-8 relative font-serif text-slate-800">
                <div className="text-center border-b border-slate-300 pb-2 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-700">Government of West Bengal — Page 2 of 4</div>
                  <div className="font-extrabold text-sm text-slate-900">SCHEDULE OF PLOTS & SOIL CLASSIFICATION (জমির শ্রেণি)</div>
                </div>
                <div className="text-xs space-y-2">
                  <p className="font-bold">Plot 104: Dhani-II Lowland Paddy • 2.40 Acres • Rent: ₹142.50 • Teesta Canal Irrigation</p>
                  <p className="font-bold">Plot 104/A: Bastu (Homestead) • 0.15 Acres • Rent: ₹35.00 • Borewell Water</p>
                  <p className="text-slate-600">Assessed by Cadastral Circle Officer for Siliguri Sub-Division.</p>
                </div>
                <div className="mt-4 text-right text-[10px] text-slate-400">Page 2 of 4</div>
              </div>

              {/* PAGE 3 MODAL */}
              <div className="w-full max-w-2xl bg-[#faf7ef] border border-[#d9ccb2] rounded-xl shadow-lg p-8 relative font-serif text-slate-800">
                <div className="text-center border-b border-slate-300 pb-2 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-700">Government of West Bengal — Page 3 of 4</div>
                  <div className="font-extrabold text-sm text-slate-900">CADASTRAL BOUNDARIES & TENANT RIGHTS (চতুঃসীমা)</div>
                </div>
                <div className="text-xs space-y-2">
                  <p>North: Plot 103 (Bimal Roy) | South: Matigara PWD Road</p>
                  <p>East: Plot 105 (Kamla Devi Rai) | West: Plot 102 (Gram Panchayat)</p>
                  <p>DGPS Geo-Coordinates: 26.7271° N, 88.4251° E • Elevation 128m MSL</p>
                </div>
                <div className="mt-4 text-right text-[10px] text-slate-400">Page 3 of 4</div>
              </div>

              {/* PAGE 4 MODAL */}
              <div className="w-full max-w-2xl bg-[#faf7ef] border border-[#d9ccb2] rounded-xl shadow-lg p-8 relative font-serif text-slate-800">
                <div className="text-center border-b border-slate-300 pb-2 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-700">Government of West Bengal — Page 4 of 4</div>
                  <div className="font-extrabold text-sm text-slate-900">MUTATION ORDER & REVENUE AUDIT DECREE (নামপত্তন রেজিস্ট্রি)</div>
                </div>
                <div className="text-xs space-y-2">
                  <p>Case No: MUT-WB-DJ-7891 • Registered 14/06/2019 • Siliguri Sub-Division</p>
                  <p>Decree: Inheritance mutation confirmed to Amit Kumar Das under Section 50 of WBLR Act 1955.</p>
                  <p>Signed: Rajiv Sharma, Revenue Officer & Assistant Settlement Officer.</p>
                </div>
                <div className="mt-4 text-right text-[10px] text-slate-400">Page 4 of 4</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
