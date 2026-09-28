import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { citizenApi } from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge";
import { useState } from "react";
import {
  ArrowLeft, Download, Edit3, Map, CheckCircle, Clock, AlertTriangle,
  Landmark, FileText, X, Send
} from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  owner_name: "Owner Name", father_name: "Father's Name", khata_number: "Khata Number",
  khasra_number: "Khasra Number", plot_number: "Plot Number", survey_number: "Survey Number",
  area: "Area", unit: "Unit", land_type: "Land Type", village: "Village",
  mouza: "Mouza", block: "Block", district: "District", state: "State",
  registration_date: "Registration Date", mutation_number: "Mutation Number",
  document_number: "Document Number"
};

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-0">
      <div className="text-xs text-neutral-500 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-neutral-900 font-mono">{value || "—"}</div>
    </div>
  );
}

const DEMO_CITIZEN_RECORDS = [
  {
    id: 1,
    record_id: "LR-WB-DAR-1024",
    owner_name: "Amit Kumar Das",
    father_name: "Late Sunil Kumar Das",
    khata_number: "238",
    khasra_number: "104",
    plot_number: "Plot 104 (Dag 67/A)",
    survey_number: "RS-89/104",
    document_number: "DEED/2024/0981",
    mutation_number: "MUT/DAR/2024/0042",
    area: "2.40",
    unit: "acres",
    land_type: "Agricultural (Dhani-II)",
    village: "Matigara",
    mouza: "Matigara",
    block: "Matigara-I",
    district: "Darjeeling",
    state: "West Bengal",
    registration_date: "14/03/2024",
    status: "VERIFIED",
    created_at: "2024-03-14T10:30:00Z",
  },
  {
    id: 2,
    record_id: "LR-WB-DAR-1025",
    owner_name: "Amit Kumar Das",
    father_name: "Late Sunil Kumar Das",
    khata_number: "238",
    khasra_number: "104/A",
    plot_number: "Plot 104/A (Homestead)",
    survey_number: "RS-89/104-A",
    document_number: "DEED/2024/0982",
    mutation_number: "MUT/DAR/2024/0043",
    area: "0.15",
    unit: "acres",
    land_type: "Residential (Bastu)",
    village: "Matigara",
    mouza: "Matigara",
    block: "Matigara-I",
    district: "Darjeeling",
    state: "West Bengal",
    registration_date: "10/02/2024",
    status: "VERIFIED",
    created_at: "2024-02-10T14:15:00Z",
  },
  {
    id: 3,
    record_id: "LR-WB-DAR-1026",
    owner_name: "Amit Kumar Das",
    father_name: "Late Sunil Kumar Das",
    khata_number: "482",
    khasra_number: "215/1",
    plot_number: "Plot 215/1",
    survey_number: "RS-92/215",
    document_number: "DEED/2024/1104",
    mutation_number: "MUT/DAR/2024/0089",
    area: "1.85",
    unit: "acres",
    land_type: "Agricultural",
    village: "Siliguri Rural",
    mouza: "Siliguri",
    block: "Siliguri-II",
    district: "Darjeeling",
    state: "West Bengal",
    registration_date: "20/01/2024",
    status: "PENDING_REVIEW",
    created_at: "2024-01-20T09:00:00Z",
  },
];

export default function CitizenRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    field_name: "owner_name",
    current_value: "",
    proposed_value: "",
    reason: "",
  });
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  const { data: record, isLoading } = useQuery({
    queryKey: ["citizen-record", id],
    queryFn: async () => {
      try {
        const res = await citizenApi.getMyRecord(id!);
        if (res.data) return res.data;
      } catch {
        // Fallback for offline demo
      }
      const demo = DEMO_CITIZEN_RECORDS.find(
        (r) => r.record_id === id || String(r.id) === id
      );
      return demo || null;
    },
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => citizenApi.submitCorrection(data),
    onSuccess: () => {
      setCorrectionSuccess(true);
      qc.invalidateQueries({ queryKey: ["citizen-my-corrections"] });
      setTimeout(() => {
        setShowCorrectionModal(false);
        setCorrectionSuccess(false);
      }, 2000);
    }
  });

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    mutation.mutate({
      land_record_id: record.id,
      field_name: correctionForm.field_name,
      current_value: correctionForm.current_value || (record as any)[correctionForm.field_name],
      proposed_value: correctionForm.proposed_value,
      reason: correctionForm.reason,
    });
  };

  const handleDownload = () => {
    if (!record) return;
    const content = `
DIGITAL LAND RECORD — OFFICIAL EXTRACT
=====================================
Platform: Digital Land Records, Government of India
Record ID: ${record.record_id}
Generated: ${new Date().toLocaleString("en-IN")}
=====================================

OWNER DETAILS
Owner Name:        ${record.owner_name}
Father's Name:     ${record.father_name || "—"}

LAND IDENTIFICATION
Khata Number:      ${record.khata_number || "—"}
Khasra Number:     ${record.khasra_number || "—"}
Plot Number:       ${record.plot_number || "—"}
Survey Number:     ${record.survey_number || "—"}
Document Number:   ${record.document_number || "—"}
Mutation Number:   ${record.mutation_number || "—"}

LOCATION
Village:           ${record.village || "—"}
Mouza:             ${record.mouza || "—"}
Block:             ${record.block || "—"}
District:          ${record.district || "—"}
State:             ${record.state || "—"}

LAND DETAILS
Area:              ${record.area ? `${record.area} ${record.unit}` : "—"}
Land Type:         ${record.land_type || "—"}
Registration Date: ${record.registration_date || "—"}

STATUS
Record Status:     ${record.status}

--- This is a digital extract. Please verify at your local land office. ---
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `land_record_${record.record_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center text-center bg-[#f0f4f8]">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-neutral-600">Loading land record details...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center text-center bg-[#f0f4f8]">
        <Landmark size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-lg font-bold text-neutral-800">Record Not Found</h2>
        <p className="text-sm text-neutral-500 mt-1 max-w-sm">
          We couldn't find the requested land record with ID "{id}".
        </p>
        <button
          onClick={() => navigate("/citizen/records")}
          className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
          style={{ background: "#235234" }}
        >
          Return to My Records
        </button>
      </div>
    );
  }

  const statusIcon = (record.status === "VERIFIED")
    ? <CheckCircle size={18} className="text-green-500" />
    : (record.status === "PENDING_REVIEW")
    ? <Clock size={18} className="text-amber-500" />
    : <AlertTriangle size={18} className="text-red-500" />;

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/citizen/records")}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition mb-6"
        >
          <ArrowLeft size={16} /> My Land Records
        </button>

        {/* Record Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-5">
          {/* Header */}
          <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1d4731 0%, #265c40 100%)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Landmark size={18} className="text-green-300" />
                  <span className="text-green-300 text-sm font-mono">{record.record_id}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{record.owner_name}</h2>
                <p className="text-green-200 text-sm mt-0.5">S/o {record.father_name || "—"}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  {statusIcon}
                  <span className="text-white text-sm font-semibold">{record.status.replace(/_/g, " ")}</span>
                </div>
                <div className="text-green-300 text-xs">
                  {record.area ? `${record.area} ${record.unit}` : ""} · {record.land_type}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Land Identification</h3>
                <DetailRow label="Khata Number" value={record.khata_number} />
                <DetailRow label="Khasra Number" value={record.khasra_number} />
                <DetailRow label="Plot Number" value={record.plot_number} />
                <DetailRow label="Survey Number" value={record.survey_number} />
                <DetailRow label="Document Number" value={record.document_number} />
                <DetailRow label="Mutation Number" value={record.mutation_number} />
                <DetailRow label="Registration Date" value={record.registration_date} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Location</h3>
                <DetailRow label="Village" value={record.village} />
                <DetailRow label="Mouza" value={record.mouza} />
                <DetailRow label="Block" value={record.block} />
                <DetailRow label="District" value={record.district} />
                <DetailRow label="State" value={record.state} />
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-4 mb-3">Land Details</h3>
                <DetailRow label="Area" value={record.area ? `${record.area} ${record.unit}` : undefined} />
                <DetailRow label="Land Type" value={record.land_type} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/gis-map")}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Map size={16} /> View on Map
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Download size={16} /> Download
          </button>
          <button
            onClick={() => {
              setCorrectionForm(f => ({ ...f, current_value: (record as any)[f.field_name] || "" }));
              setShowCorrectionModal(true);
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition"
            style={{ borderColor: "#235234", color: "#235234" }}
          >
            <Edit3 size={16} /> Request Correction
          </button>
        </div>
      </div>

      {/* Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-neutral-200 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FileText size={18} style={{ color: "#235234" }} />
                <span className="font-semibold text-neutral-900">Request Correction</span>
              </div>
              <button onClick={() => setShowCorrectionModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            </div>
            {correctionSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-neutral-900">Request Submitted!</h3>
                <p className="text-sm text-neutral-500 mt-1">An officer will review your request shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Field to Correct</label>
                  <select
                    value={correctionForm.field_name}
                    onChange={e => {
                      const fn = e.target.value;
                      setCorrectionForm(f => ({
                        ...f, field_name: fn,
                        current_value: (record as any)[fn] || ""
                      }));
                    }}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white outline-none focus:border-green-500"
                  >
                    {Object.entries(FIELD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Current Value</label>
                  <input
                    value={correctionForm.current_value}
                    readOnly
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Correct Value <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={correctionForm.proposed_value}
                    onChange={e => setCorrectionForm(f => ({ ...f, proposed_value: e.target.value }))}
                    placeholder="Enter the correct value"
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Reason</label>
                  <textarea
                    value={correctionForm.reason}
                    onChange={e => setCorrectionForm(f => ({ ...f, reason: e.target.value }))}
                    rows={3}
                    placeholder="Explain why this correction is needed..."
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:border-green-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: "#235234" }}
                >
                  <Send size={15} />
                  {mutation.isPending ? "Submitting..." : "Submit Correction Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

