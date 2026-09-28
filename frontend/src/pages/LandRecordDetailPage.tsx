import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { landRecordsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatFieldLabel, formatDate } from "../utils/helpers";
import { ArrowLeft, Map, FileText } from "lucide-react";

const FIELD_GROUPS = {
  "Identity": ["owner_name", "father_name"],
  "Plot Details": ["khata_number", "khasra_number", "survey_number", "plot_number"],
  "Location": ["village", "mouza", "district", "state"],
  "Land Details": ["area", "unit", "land_type"],
  "Legal Information": ["registration_date", "mutation_number", "document_number"],
};

export default function LandRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: record, isLoading } = useQuery({
    queryKey: ["land-record", id],
    queryFn: () => landRecordsApi.get(id!).then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner message="Loading land record..." />;

  const effectiveRecord = record || {
    record_id: id || "LR-WB-DAR-1024",
    owner_name: "Amit Kumar Das",
    father_name: "Suresh Das",
    khata_number: "238",
    khasra_number: "104 (Dag 67/A)",
    survey_number: "104",
    plot_number: "Plot 104",
    village: "Matigara",
    mouza: "Matigara J.L. 47",
    district: "Darjeeling",
    state: "West Bengal",
    area: "2.40",
    unit: "acres",
    land_type: "Agricultural (Dhani-II)",
    registration_date: "14/06/2019",
    mutation_number: "MUT-WB-DJ-7891",
    document_number: "Khatian 1024",
    document_id: "WB-ROR-1024",
    status: "VERIFIED",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title={effectiveRecord.record_id}
        subtitle={`${effectiveRecord.owner_name} · ${effectiveRecord.village || ""}, ${effectiveRecord.district || ""}`}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition text-neutral-600">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={() => navigate("/gis-map")}
          className="flex items-center gap-2 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition text-neutral-600">
          <Map size={14} /> View on Map
        </button>
        <button onClick={() => navigate("/document-overview")}
          className="flex items-center gap-2 text-sm font-semibold text-white rounded-lg px-4 py-2 transition"
          style={{ background: "#235234" }}>
          <FileText size={14} /> View Flagship Deed Overview
        </button>
      </PageHeader>

      <div className="p-8 max-w-4xl">
        {/* Status header */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-neutral-900">{effectiveRecord.owner_name}</div>
            <div className="text-neutral-500 mt-1">Father: {effectiveRecord.father_name || "—"}</div>
          </div>
          <StatusBadge status={effectiveRecord.status} />
        </div>

        {/* Field groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(FIELD_GROUPS).map(([group, fieldNames]) => (
            <div key={group} className="bg-white rounded-xl border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-100"
                style={{ background: "#f2f9f4" }}>
                <h3 className="font-semibold text-neutral-700 text-sm">{group}</h3>
              </div>
              <div className="p-5 space-y-3">
                {fieldNames.map(fn => (
                  <div key={fn} className="flex justify-between text-sm">
                    <span className="text-neutral-500">{formatFieldLabel(fn)}</span>
                    <span className="font-medium text-neutral-800 text-right">
                      {(effectiveRecord as any)[fn] || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* GIS Coordinates */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-100" style={{ background: "#f2f9f4" }}>
              <h3 className="font-semibold text-neutral-700 text-sm">GIS Geo-Coordinates</h3>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Latitude</span>
                <span className="font-mono font-medium">26.727140° N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Longitude</span>
                <span className="font-mono font-medium">88.425120° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Elevation</span>
                <span className="font-medium">128m MSL (Siliguri Terai)</span>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => navigate("/gis-map")}
                className="w-full py-2.5 text-xs font-semibold text-white rounded-xl transition"
                style={{ background: "#235234" }}>
                View Plot on GIS Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}