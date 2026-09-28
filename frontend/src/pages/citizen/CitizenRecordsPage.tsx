import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { citizenApi } from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge";
import { Landmark, ArrowRight, Search, Upload, BookOpen } from "lucide-react";
import { useState } from "react";

import { useAuthStore } from "../../store/authStore";

const DEMO_CITIZEN_RECORDS = [
  {
    id: "1",
    record_id: "LR-WB-DAR-1024",
    owner_name: "Amit Kumar Das",
    plot_number: "Plot 104 (Dag 67/A)",
    khata_number: "238",
    khasra_number: "104",
    village: "Matigara",
    district: "Darjeeling",
    area: "2.40",
    unit: "acres",
    land_type: "Agricultural (Dhani-II)",
    status: "VERIFIED",
    created_at: "2024-03-14T10:30:00Z",
  },
  {
    id: "2",
    record_id: "LR-WB-DAR-1025",
    owner_name: "Amit Kumar Das",
    plot_number: "Plot 104/A (Homestead)",
    khata_number: "238",
    khasra_number: "104/A",
    village: "Matigara",
    district: "Darjeeling",
    area: "0.15",
    unit: "acres",
    land_type: "Residential (Bastu)",
    status: "VERIFIED",
    created_at: "2024-02-10T14:15:00Z",
  },
  {
    id: "3",
    record_id: "LR-WB-DAR-1026",
    owner_name: "Amit Kumar Das",
    plot_number: "Plot 215/1",
    khata_number: "482",
    khasra_number: "215/1",
    village: "Siliguri Rural",
    district: "Darjeeling",
    area: "1.85",
    unit: "acres",
    land_type: "Agricultural",
    status: "PENDING_REVIEW",
    created_at: "2024-01-20T09:00:00Z",
  },
];

export default function CitizenRecordsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { isDemoMode } = useAuthStore();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["citizen-my-records"],
    queryFn: () => citizenApi.getMyRecords().then(r => r.data),
  });

  const effectiveRecords = (records && records.length > 0) ? records : DEMO_CITIZEN_RECORDS;

  const filtered = effectiveRecords.filter((r: any) =>
    !search ||
    r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.khata_number?.includes(search) ||
    r.khasra_number?.includes(search) ||
    r.plot_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.village?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Land Records</h1>
            <p className="text-sm text-neutral-500 mt-1">All land records associated with your account</p>
          </div>
          <button
            onClick={() => navigate("/citizen/upload")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: "#235234" }}
          >
            <Upload size={16} />
            Upload Document
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Khata No., Khasra, Plot, or Village..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-neutral-400">Loading your records...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-neutral-300" />
            {records.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No land records yet</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Upload your first land document to begin digitization.
                </p>
                <button
                  onClick={() => navigate("/citizen/upload")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#235234" }}
                >
                  <Upload size={16} />
                  Upload Document
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No matching records</h3>
                <p className="text-sm text-neutral-500">Try a different search term.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rec: any) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition cursor-pointer hover:border-green-300"
                onClick={() => navigate(`/citizen/records/${rec.record_id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#e8f5ee" }}>
                    <Landmark size={22} style={{ color: "#235234" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-neutral-900">{rec.owner_name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          S/o {rec.father_name || "—"}
                        </div>
                      </div>
                      <StatusBadge status={rec.status} size="sm" />
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Khata No.", value: rec.khata_number },
                        { label: "Khasra No.", value: rec.khasra_number },
                        { label: "Plot No.", value: rec.plot_number },
                        { label: "Area", value: rec.area ? `${rec.area} ${rec.unit}` : "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="text-xs text-neutral-400">{label}</div>
                          <div className="text-sm font-semibold text-neutral-800 font-mono">{value || "—"}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                      <span>📍 {rec.village}, {rec.mouza}</span>
                      <span>·</span>
                      <span>{rec.district}, {rec.state}</span>
                      <span>·</span>
                      <span className="capitalize">{rec.land_type}</span>
                    </div>
                  </div>

                  <ArrowRight size={18} className="text-neutral-300 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

