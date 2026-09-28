import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { landRecordsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { Search, Filter, Eye, Map } from "lucide-react";

const SEARCH_FIELDS = [
  { value: "", label: "All Fields" },
  { value: "owner_name", label: "Owner Name" },
  { value: "khata_number", label: "Khata Number" },
  { value: "khasra_number", label: "Khasra Number" },
  { value: "plot_number", label: "Plot Number" },
  { value: "village", label: "Village" },
  { value: "district", label: "District" },
  { value: "document_number", label: "Document Number" },
];

const DEMO_SEARCH_RECORDS = [
  {
    id: "1",
    record_id: "LR-WB-DAR-1024",
    owner_name: "Amit Kumar Das",
    father_name: "Suresh Das",
    khata_number: "238",
    khasra_number: "104 (Dag 67/A)",
    village: "Matigara",
    district: "Darjeeling",
    area: 2.40,
    unit: "acres",
    land_type: "Agricultural (Dhani-II)",
    status: "VERIFIED",
  },
  {
    id: "2",
    record_id: "LR-WB-DAR-1025",
    owner_name: "Rajeshwar Sen",
    father_name: "Sunil Sen",
    khata_number: "195",
    khasra_number: "88",
    village: "Naxalbari",
    district: "Darjeeling",
    area: 1.15,
    unit: "acres",
    land_type: "Residential (Bastu)",
    status: "VERIFIED",
  },
  {
    id: "3",
    record_id: "LR-WB-JAL-0442",
    owner_name: "Bina Banerjee",
    father_name: "Ramanath Banerjee",
    khata_number: "312",
    khasra_number: "142/B",
    village: "Rajganj",
    district: "Jalpaiguri",
    area: 3.50,
    unit: "acres",
    land_type: "Agricultural",
    status: "VERIFIED",
  },
  {
    id: "4",
    record_id: "LR-WB-MUR-0918",
    owner_name: "Animesh Chatterjee",
    father_name: "Late Prabhat Chatterjee",
    khata_number: "405",
    khasra_number: "219",
    village: "Berhampore Rural",
    district: "Murshidabad",
    area: 0.85,
    unit: "acres",
    land_type: "Commercial",
    status: "VERIFIED",
  },
  {
    id: "5",
    record_id: "LR-WB-DAR-1026",
    owner_name: "Sunil Kumar Roy",
    father_name: "Manoranjan Roy",
    khata_number: "482",
    khasra_number: "215/1",
    village: "Siliguri Rural",
    district: "Darjeeling",
    area: 1.85,
    unit: "acres",
    land_type: "Agricultural",
    status: "PENDING_REVIEW",
  },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [field, setField] = useState("");

  const searchMut = useMutation({
    mutationFn: async ({ q }: { q: string; f: string }) => {
      try {
        const res = await landRecordsApi.search(q, field || undefined);
        if (res.data) return res.data;
      } catch {
        // Fallback for offline demo
      }
      const qLow = q.toLowerCase();
      const match = DEMO_SEARCH_RECORDS.filter((r) =>
        r.owner_name.toLowerCase().includes(qLow) ||
        r.district.toLowerCase().includes(qLow) ||
        r.village.toLowerCase().includes(qLow) ||
        r.khata_number.includes(qLow) ||
        r.khasra_number.includes(qLow) ||
        r.record_id.toLowerCase().includes(qLow) ||
        (qLow.includes("agri") && r.land_type.toLowerCase().includes("agri")) ||
        (qLow.includes("1024") && r.record_id.includes("1024"))
      );
      return match;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMut.mutate({ q: query.trim(), f: field });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Search Land Records" subtitle="Search across all digitized land records" />

      <div className="p-8 max-w-5xl mx-auto">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by owner name, khata/khasra number, village, district..."
              className="w-full pl-11 pr-4 py-3.5 border border-neutral-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition" />
          </div>
          <select value={field} onChange={e => setField(e.target.value)}
            className="px-4 py-3.5 border border-neutral-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition cursor-pointer">
            {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button type="submit" disabled={searchMut.isPending || !query.trim()}
            className="px-6 py-3.5 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60"
            style={{ background: "#235234" }}>
            {searchMut.isPending ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Quick searches */}
        {!searchMut.data && !searchMut.isPending && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Quick Searches</div>
            <div className="flex gap-2 flex-wrap">
              {["Ram Kumar", "Darjeeling", "Agricultural", "Matigara", "1024"].map(q => (
                <button key={q} onClick={() => { setQuery(q); setTimeout(() => searchMut.mutate({ q, f: "" }), 0); }}
                  className="px-4 py-2 text-sm bg-white border border-neutral-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition text-neutral-700">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searchMut.data && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-neutral-600">
                {searchMut.data.length} record(s) found
              </span>
            </div>

            {searchMut.data.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <Search size={32} className="mx-auto mb-3 text-neutral-300" />
                <h3 className="font-semibold text-neutral-600">No Records Found</h3>
                <p className="text-sm text-neutral-400 mt-1">Try a different search term or field filter</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {searchMut.data.map((rec: any) => (
                  <div key={rec.id} className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-green-200 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-neutral-900">{rec.owner_name}</h3>
                          <StatusBadge status={rec.status} size="sm" />
                          {rec.land_type && (
                            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">{rec.land_type}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {[
                            ["Khata No.", rec.khata_number],
                            ["Khasra No.", rec.khasra_number],
                            ["Plot", rec.plot_number],
                            ["Village", rec.village],
                            ["District", rec.district],
                            ["State", rec.state],
                            ["Area", rec.area ? `${rec.area} ${rec.unit}` : null],
                            ["Reg. Date", rec.registration_date],
                          ].filter(([, v]) => v).map(([k, v]) => (
                            <div key={String(k)}>
                              <div className="text-xs text-neutral-400">{k}</div>
                              <div className="font-medium text-neutral-700">{String(v)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => navigate(`/land-records/${rec.record_id}`)}
                          className="flex items-center gap-1.5 text-xs text-white font-semibold px-3 py-2 rounded-lg"
                          style={{ background: "#235234" }}>
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => navigate(`/gis-map?record=${rec.record_id}`)}
                          className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50 transition">
                          <Map size={13} /> Map
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}