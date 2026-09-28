import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Scale, Check, AlertTriangle,
  ArrowRight, ShieldCheck, X, Sparkles, Upload
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface ValidationRow {
  id: string;
  field: string;
  extractedValue: string;
  digitalValue: string;
  status: "match" | "mismatch" | "resolved";
}

const DEMO_ROWS: ValidationRow[] = [
  { id: "owner_name", field: "Owner Name", extractedValue: "Amit Kumar Das", digitalValue: "Amit Kumar Das", status: "match" },
  { id: "survey_number", field: "Survey Number", extractedValue: "104", digitalValue: "104", status: "match" },
  { id: "khata_number", field: "Khata Number", extractedValue: "238", digitalValue: "238", status: "match" },
  { id: "khasra_number", field: "Khasra / Dag No.", extractedValue: "104 (Dag 67/A)", digitalValue: "104 (Dag 67/A)", status: "match" },
  { id: "plot_area", field: "Plot Area", extractedValue: "2.40 acres", digitalValue: "2.10 acres", status: "mismatch" },
  { id: "village_mouza", field: "Village / Mouza", extractedValue: "Matigara", digitalValue: "Matigara", status: "match" },
  { id: "tehsil", field: "Tehsil / Block", extractedValue: "Siliguri Sub-Division", digitalValue: "Siliguri Sub-Division", status: "match" },
  { id: "district", field: "District", extractedValue: "Darjeeling", digitalValue: "Darjeeling", status: "match" },
  { id: "land_classification", field: "Land Classification", extractedValue: "Agricultural (Dhani-II)", digitalValue: "Agricultural (Dhani-II)", status: "match" },
  { id: "fathers_name", field: "Father's Name", extractedValue: "Suresh Das", digitalValue: "Suresh Das", status: "match" },
  { id: "mutation_number", field: "Mutation Case No.", extractedValue: "MUT-WB-DJ-7891", digitalValue: "MUT-WB-DJ-7891", status: "match" },
  { id: "registration_date", field: "Registration Date", extractedValue: "14/06/2019", digitalValue: "14/06/2019", status: "match" },
];

export default function RecordValidationPage() {
  const navigate = useNavigate();
  const { isDemoMode, setDemoMode, user } = useAuthStore();

  const [rows, setRows] = useState<ValidationRow[]>(DEMO_ROWS);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<"ACCEPT_EXTRACTED" | "KEEP_DIGITAL" | "CUSTOM">("ACCEPT_EXTRACTED");
  const [officerRemarks, setOfficerRemarks] = useState(
    "Verified original stamped deed Khatian 1024 dated 14/06/2019. Boundary expansion confirmed under mutation MUT-WB-DJ-7891."
  );
  const [isResolved, setIsResolved] = useState(false);

  // Stats calculation
  const totalFields = rows.length;
  const matchedFields = rows.filter((r) => r.status === "match" || r.status === "resolved").length;
  const reviewFields = rows.filter((r) => r.status === "mismatch").length;
  const matchRate = totalFields > 0 ? Math.round((matchedFields / totalFields) * 100) : 0;

  const handleResolveConflict = () => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === "plot_area") {
          return {
            ...r,
            digitalValue: selectedResolution === "ACCEPT_EXTRACTED" ? "2.40 acres" : r.digitalValue,
            status: "resolved",
          };
        }
        return r;
      })
    );
    setIsResolved(true);
    setShowConflictModal(false);
    toast.success("Conflict resolved! Digital record updated to 2.40 acres.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Indicates Demo Mode vs Live Mode */}
      {isDemoMode ? (
        <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Demo Preview Mode:</strong> Showing sample verification for <strong>Khatian 1024</strong>.
              Click "Review Conflict" to test official discrepancy resolution!
            </span>
          </div>
          <button
            onClick={() => {
              setDemoMode(false);
              toast("Switched to Live Mode — Displaying user-specific records.");
            }}
            className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition shrink-0"
          >
            Switch to Live Mode
          </button>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Live Mode:</strong> Real verification data. Discrepancies update based on user inputs.
            </span>
          </div>
          <button
            onClick={() => {
              setDemoMode(true);
              setRows(DEMO_ROWS);
              setIsResolved(false);
              toast.success("Loaded Khatian 1024 Demo Validation.");
            }}
            className="px-3 py-1 bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 font-bold rounded-lg transition shrink-0"
          >
            Preview Sample Conflict Demo
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
        <Link to="/dashboard" className="text-slate-600 hover:text-emerald-800 transition">
          Dashboard
        </Link>
        <span className="text-slate-300">›</span>
        <Link to="/document-overview" className="text-slate-600 hover:text-emerald-800 transition">
          Document Overview
        </Link>
        <span className="text-slate-300">›</span>
        <span className="text-emerald-900 font-bold">Record Validation</span>
      </div>

      {/* Page Header with Action Button & Illustration Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Record Validation
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Comparing AI-extracted values with existing digital record —{" "}
            <strong className="text-slate-800">
              {isDemoMode ? "Khatian_1024" : "Live Document Record"}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => navigate("/document-overview")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition shadow-2xs"
          >
            <ArrowLeft size={14} className="text-slate-500" />
            <span>Back to Extraction</span>
          </button>

          {/* Graphic Banner: Accurate Records Stronger Communities */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-100/60 border border-emerald-200/80 rounded-2xl shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-xs text-emerald-700 shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="m9 14 2 2 4-4" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <div className="text-emerald-950 font-bold text-xs leading-tight font-serif italic">
                Accurate Records,
              </div>
              <div className="text-emerald-800 font-extrabold text-xs leading-tight">
                Stronger Communities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b3320] text-white text-xs font-semibold tracking-wide">
                <th className="py-4 px-6 font-semibold w-1/4">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-emerald-300" />
                    <span>Field</span>
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-2xs" />
                    <span>AI Extracted Record</span>
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-2xs" />
                    <span>Existing Digital Record</span>
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Scale size={15} className="text-emerald-300" />
                    <span>Status</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((row, idx) => {
                const isMismatch = row.status === "mismatch";
                const isResolvedMatch = row.status === "resolved";

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isMismatch
                        ? "bg-rose-50/40 hover:bg-rose-50/70"
                        : idx % 2 === 0
                        ? "bg-white hover:bg-slate-50/80"
                        : "bg-slate-50/40 hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Field Name */}
                    <td className="py-4 px-6 font-semibold text-slate-800 text-xs sm:text-sm">
                      {row.field}
                    </td>

                    {/* AI Extracted Record */}
                    <td className="py-4 px-6 text-slate-700 text-xs sm:text-sm font-medium">
                      {isMismatch ? (
                        <span className="inline-block px-3 py-1 rounded-lg bg-rose-100/90 text-rose-700 font-extrabold border border-rose-200">
                          {row.extractedValue}
                        </span>
                      ) : (
                        <span>{row.extractedValue}</span>
                      )}
                    </td>

                    {/* Existing Digital Record */}
                    <td className="py-4 px-6 text-slate-700 text-xs sm:text-sm font-medium">
                      {isMismatch ? (
                        <span className="inline-block px-3 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 font-extrabold border border-emerald-200">
                          {row.digitalValue}
                        </span>
                      ) : isResolvedMatch ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-100/90 text-emerald-800 font-extrabold">
                          {row.digitalValue}
                          <Check size={13} className="text-emerald-700" />
                        </span>
                      ) : (
                        <span>{row.digitalValue}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-right">
                      {isMismatch ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#be123c] border border-rose-200 shadow-2xs">
                          <AlertTriangle size={13} />
                          <span>Mismatch</span>
                        </span>
                      ) : isResolvedMatch ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <Check size={13} />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f7ee] text-[#166534] border border-emerald-200 shadow-2xs">
                          <Check size={13} />
                          <span>Match</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Validation Summary + Conflict Attention Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Validation Summary Card (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-1 h-4">
                <span className="w-1 h-2 bg-emerald-600 rounded-xs" />
                <span className="w-1 h-3.5 bg-emerald-600 rounded-xs" />
                <span className="w-1 h-4 bg-emerald-700 rounded-xs" />
              </div>
              <h2 className="font-bold text-slate-900 text-base">Validation Summary</h2>
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 Metric Columns */}
          <div className="grid grid-cols-3 gap-4 pt-6 items-start">
            {/* Stat 1: Matched */}
            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 leading-none">
                {matchedFields}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-2">Fields matched</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Out of {totalFields} fields</div>
            </div>

            {/* Stat 2: Review */}
            <div className="border-l border-slate-100 pl-4">
              <div className={`text-3xl sm:text-4xl font-black leading-none ${reviewFields > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {reviewFields}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-2">
                {reviewFields > 0 ? "Requires review" : "Verified"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {reviewFields > 0 ? "Needs officer verification" : "Zero conflicts"}
              </div>
            </div>

            {/* Stat 3: Match Rate */}
            <div className="border-l border-slate-100 pl-4">
              <div className="text-xs font-bold text-slate-600 mb-1">Match rate</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                {matchRate}%
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${matchRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conflict Attention Card (6 Cols) */}
        <div
          className={`lg:col-span-6 rounded-2xl p-6 flex flex-col justify-between border transition-all ${
            isResolved
              ? "bg-emerald-50/70 border-emerald-200/90 shadow-xs"
              : "bg-[#fff1f2] border-[#fecdd3] shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              {isResolved ? (
                <>
                  <ShieldCheck size={18} className="text-emerald-700" />
                  <h3 className="font-bold text-emerald-950 text-base">
                    All conflicts resolved!
                  </h3>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-rose-600" />
                  <h3 className="font-bold text-rose-700 text-base">
                    {reviewFields} conflict{reviewFields !== 1 ? "s" : ""} requires attention
                  </h3>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 mt-2.5 leading-relaxed font-normal">
              {isResolved ? (
                <>
                  The Plot Area conflict has been successfully reviewed and resolved by Revenue Officer{" "}
                  <strong>{user?.name || "Rajiv Sharma"}</strong>. Digital Record #238 is now synchronized with the original deed (2.40 acres).
                </>
              ) : (
                <>
                  <strong>Plot Area</strong> differs by <strong className="text-rose-700 font-bold">0.30 acres</strong> between the extracted document (2.40 acres) and the existing digital record (2.10 acres). Manual verification by a revenue officer is required.
                </>
              )}
            </p>
          </div>

          <div className="pt-5">
            {isResolved ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white/70 py-2 px-3 rounded-xl border border-emerald-200">
                <ShieldCheck size={15} className="text-emerald-700" />
                <span>Verified by {user?.name || "Rajiv Sharma"} ({user?.district || "DRJ District"}) • Stored in Land Registry</span>
              </div>
            ) : (
              <button
                onClick={() => setShowConflictModal(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <span>Review Conflict</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Review & Resolution Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Plot Area Discrepancy Review</h3>
                  <p className="text-xs text-slate-500">Deed Record • Mouza Matigara • Plot 104</p>
                </div>
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-[11px] font-bold uppercase text-rose-700">AI Extracted (Deed)</div>
                <div className="text-2xl font-black text-rose-900 mt-1">2.40 acres</div>
                <div className="text-[11px] text-rose-600 mt-0.5">Physical deed scan</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] font-bold uppercase text-emerald-700">Existing Digital RoR</div>
                <div className="text-2xl font-black text-emerald-900 mt-1">2.10 acres</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Central database registry</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 mb-5">
              <strong>Variance:</strong> +0.30 acres (+14.28%). Deed mutation register shows consolidation of adjacent sub-parcel in 2019.
            </div>

            {/* Resolution Choices */}
            <div className="space-y-2.5 mb-5">
              <label className="block text-xs font-bold text-slate-800">
                Officer Resolution Decision:
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="resolution"
                  checked={selectedResolution === "ACCEPT_EXTRACTED"}
                  onChange={() => setSelectedResolution("ACCEPT_EXTRACTED")}
                  className="mt-1 text-emerald-700 focus:ring-emerald-700"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    Accept Extracted Value (2.40 acres)
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Update digital RoR based on physical verified stamped deed under Mutation MUT-WB-DJ-7891.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="resolution"
                  checked={selectedResolution === "KEEP_DIGITAL"}
                  onChange={() => setSelectedResolution("KEEP_DIGITAL")}
                  className="mt-1 text-emerald-700 focus:ring-emerald-700"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    Retain Existing Digital Value (2.10 acres)
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Reject deed area expansion; flag document for ground DGPS resurvey.
                  </div>
                </div>
              </label>
            </div>

            {/* Officer Remarks */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Verification Remarks (Official Record):
              </label>
              <textarea
                rows={2}
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            {/* Officer Digital Seal */}
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#133e29] text-white font-bold text-[10px] flex items-center justify-center">
                  {(user?.name || "RS").slice(0, 2).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-800">
                  {user?.name || "Rajiv Sharma"} (Revenue Officer)
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                Officer Seal Ready
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveConflict}
                className="px-5 py-2 bg-[#133e29] hover:bg-[#0d2e1e] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Resolution & Update Record
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Automated Validation Rules & Audit Engine Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Validation Rules & Audit Engine</h3>
                  <p className="text-xs text-slate-500">Official Land Registry Automated Cross-Verification Matrix</p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Target Document: </span>
                  <span className="font-mono text-emerald-800">Khatian 1024 (Matigara)</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Overall Rule Compliance: </span>
                  <span className="font-bold text-emerald-700">6/7 Passed (1 Discrepancy Flagged)</span>
                </div>
              </div>

              {[
                {
                  ruleId: "VAL-ID-001",
                  name: "Owner Identity & Succession Trace",
                  source: "Banglarbhumi Registry & Aadhaar Hash",
                  status: "PASS",
                  conf: "96.4%",
                  desc: "Verified Amit Kumar Das s/o Suresh Das. Successor title matches mutation register."
                },
                {
                  ruleId: "VAL-CAD-004",
                  name: "Survey & Dag Topology Consistency",
                  source: "Siliguri Cadastral GIS & Revenue Atlas",
                  status: "PASS",
                  conf: "99.1%",
                  desc: "Survey #104, Dag #67/A falls within valid Matigara Mouza J.L. No. 47."
                },
                {
                  ruleId: "VAL-AREA-009",
                  name: "Plot Area Tolerance Threshold",
                  source: "Central RoR Database vs Deed Schedule",
                  status: "FLAGGED",
                  conf: "87.0%",
                  desc: "Deed states 2.40 acres while Central DB states 2.10 acres. Variance (+0.30 acres) exceeds ±0.05 acre automated threshold."
                },
                {
                  ruleId: "VAL-MUT-014",
                  name: "Mutation Endorsement Verification",
                  source: "e-District WB Revenue Portal",
                  status: "PASS",
                  conf: "99.0%",
                  desc: "Case MUT-WB-DJ-7891 confirmed issued by Assistant Settlement Officer on 14/06/2019."
                },
                {
                  ruleId: "VAL-GEO-021",
                  name: "Administrative Boundary Alignment",
                  source: "Darjeeling District Revenue Circle",
                  status: "PASS",
                  conf: "100%",
                  desc: "Mouza Matigara correctly maps to Siliguri Sub-Division and Darjeeling Collectorate."
                },
                {
                  ruleId: "VAL-CLASS-003",
                  name: "Land Classification & Tax Schedule",
                  source: "West Bengal Land Reforms Rate Table",
                  status: "PASS",
                  conf: "95.2%",
                  desc: "Classified as Dhani-II (Agricultural lowland). Annual rent ₹142.50 verified."
                },
                {
                  ruleId: "VAL-SEAL-007",
                  name: "Sub-Registrar Digital Stamp Authenticity",
                  source: "State Directorate of Registrations PKI",
                  status: "PASS",
                  conf: "98.7%",
                  desc: "Physical revenue stamp and digital certificate verified against Sub-Registrar keys."
                }
              ].map((rule) => (
                <div key={rule.ruleId} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rule.ruleId}
                      </span>
                      <span className="font-bold text-slate-900">{rule.name}</span>
                    </div>
                    {rule.status === "PASS" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <Check size={11} /> Pass ({rule.conf})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle size={11} /> Review ({rule.conf})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{rule.desc}</p>
                  <div className="mt-2 text-[10px] text-slate-400 font-medium">Source: {rule.source}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 bg-[#133e29] hover:bg-[#0d2e1e] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
