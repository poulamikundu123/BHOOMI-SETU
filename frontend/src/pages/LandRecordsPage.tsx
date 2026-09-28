import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { landRecordsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuthStore } from "../store/authStore";
import { Eye, Map, BookOpen, Sparkles } from "lucide-react";

const DEMO_LAND_RECORDS = [
  {
    id: "1",
    record_id: "LR-WB-DAR-1024",
    owner_name: "Amit Kumar Das",
    khata_number: "238",
    khasra_number: "104 (Dag 67/A)",
    village: "Matigara",
    district: "Darjeeling",
    area: "2.40",
    unit: "acres",
    land_type: "Agricultural (Dhani-II)",
    status: "VERIFIED",
  },
  {
    id: "2",
    record_id: "LR-WB-DAR-1025",
    owner_name: "Rajeshwar Sen",
    khata_number: "195",
    khasra_number: "88",
    village: "Naxalbari",
    district: "Darjeeling",
    area: "1.15",
    unit: "acres",
    land_type: "Residential (Bastu)",
    status: "VERIFIED",
  },
  {
    id: "3",
    record_id: "LR-WB-JAL-0442",
    owner_name: "Bina Banerjee",
    khata_number: "312",
    khasra_number: "142/B",
    village: "Rajganj",
    district: "Jalpaiguri",
    area: "3.50",
    unit: "acres",
    land_type: "Agricultural",
    status: "VERIFIED",
  },
  {
    id: "4",
    record_id: "LR-WB-MUR-0918",
    owner_name: "Animesh Chatterjee",
    khata_number: "405",
    khasra_number: "219",
    village: "Berhampore Rural",
    district: "Murshidabad",
    area: "0.85",
    unit: "acres",
    land_type: "Commercial",
    status: "VERIFIED",
  },
  {
    id: "5",
    record_id: "LR-WB-DAR-1026",
    owner_name: "Sunil Kumar Roy",
    khata_number: "482",
    khasra_number: "215/1",
    village: "Siliguri Rural",
    district: "Darjeeling",
    area: "1.85",
    unit: "acres",
    land_type: "Agricultural",
    status: "PENDING_REVIEW",
  },
  {
    id: "6",
    record_id: "LR-WB-NAD-0782",
    owner_name: "Tapas Mondal",
    khata_number: "512",
    khasra_number: "99/A",
    village: "Krishnanagar Sadar",
    district: "Nadia",
    area: "1.20",
    unit: "acres",
    land_type: "Agricultural",
    status: "VERIFIED",
  },
];

export default function LandRecordsPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuthStore();
  const { data: records, isLoading } = useQuery({
    queryKey: ["land-records"],
    queryFn: () => landRecordsApi.list({ limit: 50 }).then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner message="Loading land records..." />;

  const effectiveRecords = (records && records.length > 0) ? records : DEMO_LAND_RECORDS;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Land Records" subtitle={`${effectiveRecords?.length || 0} records in the system`}>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <button
              onClick={() => navigate("/record-validation")}
              className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Validation Demo</span>
            </button>
          )}
          <button onClick={() => navigate("/search")}
            className="px-4 py-2 text-sm font-semibold border border-neutral-200 rounded-lg hover:bg-neutral-100 transition text-neutral-700">
            Advanced Search
          </button>
        </div>
      </PageHeader>

      <div className="p-8">
        {!effectiveRecords?.length ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
            <BookOpen size={32} className="mx-auto mb-3 text-neutral-300" />
            <h3 className="font-semibold text-neutral-600">No Land Records Yet</h3>
            <p className="text-sm text-neutral-400 mt-1">Upload and process land documents to see records here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Owner</th>
                  <th className="px-6 py-3.5">Khata/Khasra</th>
                  <th className="px-6 py-3.5">Village</th>
                  <th className="px-6 py-3.5">District</th>
                  <th className="px-6 py-3.5">Area</th>
                  <th className="px-6 py-3.5">Land Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {effectiveRecords.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-neutral-500">{rec.record_id}</span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-neutral-900">{rec.owner_name}</td>
                    <td className="px-6 py-3.5 text-neutral-600">
                      <span className="font-mono text-xs">{rec.khata_number || "—"} / {rec.khasra_number || "—"}</span>
                    </td>
                    <td className="px-6 py-3.5 text-neutral-600">{rec.village || "—"}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{rec.district || "—"}</td>
                    <td className="px-6 py-3.5 text-neutral-600">
                      {rec.area ? `${rec.area} ${rec.unit}` : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      {rec.land_type && (
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">{rec.land_type}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={rec.status} size="sm" /></td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/land-records/${rec.record_id}`)}
                          className="p-1.5 text-neutral-400 hover:text-green-700 transition-colors rounded" title="View Record">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => navigate(`/gis-map`)}
                          className="p-1.5 text-neutral-400 hover:text-green-700 transition-colors rounded" title="View on Map">
                          <Map size={15} />
                        </button>
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