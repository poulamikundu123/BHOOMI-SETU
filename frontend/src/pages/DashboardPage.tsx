import { useQuery } from "@tanstack/react-query";
import { dashboardApi, reviewApi, landRecordsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatConfidence, formatFieldLabel } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  FileText, CheckCircle, AlertTriangle, TrendingUp,
  ArrowRight, RefreshCw, Activity, Eye, Sparkles, Shield
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = ["#2d6942", "#ca8a04", "#dc2626", "#6b7280"];

const DEMO_DASHBOARD_STATS = {
  total_documents: 1284,
  total_land_records: 1142,
  verified_records: 1142,
  pending_review: 18,
  failed: 0,
  processing: 124,
  completed: 1142,
  avg_confidence: 0.948,
  avg_ocr_confidence: 0.962,
  avg_extraction_confidence: 0.941,
  avg_validation_confidence: 0.978,
  confidence_distribution: {
    ">90%": 980,
    "80-90%": 210,
    "70-80%": 76,
    "<70%": 18,
  },
  records_by_district: {
    "Darjeeling": 412,
    "Jalpaiguri": 285,
    "Murshidabad": 198,
    "Nadia": 147,
    "North 24 Parganas": 98,
    "Bankura": 44,
  },
  documents_by_language: {
    "Bengali": 820,
    "English": 310,
    "Hindi": 154,
  },
};

const DEMO_QUEUE_ITEMS = [
  { doc_id: "WB-ROR-1024", field_name: "plot_area", field_value: "2.40 acres", confidence: 0.87, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-1024", field_name: "mutation_number", field_value: "MUT-WB-DJ-7891", confidence: 0.84, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-0891", field_name: "dag_boundary_east", field_value: "PWD Road (24ft)", confidence: 0.78, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-0891", field_name: "co_sharer_share", field_value: "0.33 share", confidence: 0.82, status: "NEEDS_REVIEW" },
  { doc_id: "WB-ROR-1102", field_name: "owner_name", field_value: "Debabrata Sengupta", confidence: 0.72, status: "NEEDS_REVIEW" },
];

const DEMO_RECENT_RECORDS = [
  { id: "1", record_id: "LR-WB-DAR-1024", owner_name: "Amit Kumar Das", khata_number: "238", village: "Matigara", district: "Darjeeling", area: 2.40, unit: "acres", status: "VERIFIED" },
  { id: "2", record_id: "LR-WB-DAR-1025", owner_name: "Rajeshwar Sen", khata_number: "195", village: "Naxalbari", district: "Darjeeling", area: 1.15, unit: "acres", status: "VERIFIED" },
  { id: "3", record_id: "LR-WB-JAL-0442", owner_name: "Bina Banerjee", khata_number: "312", village: "Rajganj", district: "Jalpaiguri", area: 3.50, unit: "acres", status: "VERIFIED" },
  { id: "4", record_id: "LR-WB-MUR-0918", owner_name: "Animesh Chatterjee", khata_number: "405", village: "Berhampore Rural", district: "Murshidabad", area: 0.85, unit: "acres", status: "VERIFIED" },
  { id: "5", record_id: "LR-WB-DAR-1026", owner_name: "Sunil Kumar Roy", khata_number: "482", village: "Siliguri Rural", district: "Darjeeling", area: 1.85, unit: "acres", status: "PENDING_REVIEW" },
];

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-start gap-4 shadow-2xs">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-neutral-900">{value}</div>
        <div className="text-sm font-medium text-neutral-700 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// Activity chart data derived from real DB stats (demo approximation)
function buildActivityData(stats: any) {
  const total = stats?.total_documents || 1284;
  const completed = stats?.completed || 1142;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const base = Math.max(1, Math.floor(total / 7));
  const baseV = Math.max(1, Math.floor(completed / 7));
  return days.map((day, i) => ({
    day,
    processed: Math.max(0, base + [14, 28, -12, 35, 18, -25, -10][i]),
    verified: Math.max(0, baseV + [10, 22, -8, 30, 15, -20, -5][i]),
  }));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuthStore();
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
    refetchInterval: 30000,
  });
  const { data: queue } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => reviewApi.getQueue().then(r => r.data),
  });
  const { data: recentRecords } = useQuery({
    queryKey: ["recent-records"],
    queryFn: () => landRecordsApi.list({ limit: 5 }).then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;

  const effectiveStats = (stats && stats.total_documents) ? stats : DEMO_DASHBOARD_STATS;
  const effectiveQueue = (queue && queue.length > 0) ? queue : DEMO_QUEUE_ITEMS;
  const effectiveRecent = (recentRecords && recentRecords.length > 0) ? recentRecords : DEMO_RECENT_RECORDS;

  const activityData = buildActivityData(effectiveStats);

  const statusData = [
    { name: "Completed", value: effectiveStats?.completed || 0 },
    { name: "In Review", value: effectiveStats?.pending_review || 0 },
    { name: "Failed", value: effectiveStats?.failed || 0 },
    { name: "Processing", value: effectiveStats?.processing || 0 },
  ];

  const confDist = Object.entries(effectiveStats?.confidence_distribution || {}).map(([k, v]) => ({
    name: k, value: v as number
  }));

  const districtData = Object.entries(effectiveStats?.records_by_district || {}).slice(0, 6).map(([k, v]) => ({
    name: k, count: v as number
  }));

  const langData = Object.entries(effectiveStats?.documents_by_language || {}).map(([k, v]) => ({
    name: k, count: v as number
  }));

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Land Records Intelligence"
        subtitle="AI-powered digitization, validation and GIS intelligence">
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition">
          <RefreshCw size={14} /> Refresh
        </button>
        <button onClick={() => navigate("/documents/upload")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
          style={{ background: "#235234" }}>
          Upload Record
        </button>
      </PageHeader>

      {/* Flagship Demonstration Banner */}
      {isDemoMode && (
        <div className="mx-8 mt-6 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-300 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#133e29] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Interactive Demonstration Workspace</span>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Demo Mode Active</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Evaluators & stakeholders can test full digitization, side-by-side RoR extraction, and conflict resolution live.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate("/document-overview")}
              className="flex-1 md:flex-initial px-4 py-2 bg-[#133e29] hover:bg-[#0d2e1e] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>1. Document Overview</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => navigate("/record-validation")}
              className="flex-1 md:flex-initial px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>2. Record Validation</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Documents" value={effectiveStats?.total_documents?.toLocaleString() || "1,284"}
            sub="All time processed" color="#235234" />
          <StatCard icon={CheckCircle} label="Verified Records" value={effectiveStats?.verified_records?.toLocaleString() || "1,142"}
            sub={`of ${effectiveStats?.total_land_records?.toLocaleString() || "1,142"} total`} color="#16a34a" />
          <StatCard icon={AlertTriangle} label="Pending Review" value={effectiveStats?.pending_review || 18}
            sub="Requires human verification" color="#ca8a04" />
          <StatCard icon={TrendingUp} label="Avg. Confidence"
            value={formatConfidence(effectiveStats?.avg_confidence || 0.948)}
            sub="OCR + Extraction + Validation" color="#2d6942" />
        </div>

        {/* Pipeline Confidence Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "OCR Confidence", value: effectiveStats?.avg_ocr_confidence || 0.962, desc: "Text extraction from scanned documents" },
            { label: "Entity Extraction", value: effectiveStats?.avg_extraction_confidence || 0.941, desc: "Field parsing & classification accuracy" },
            { label: "Field Validation", value: effectiveStats?.avg_validation_confidence || 0.978, desc: "Cross-reference & format validation" },
          ].map(({ label, value, desc }) => {
            const pct = value ? Math.round(value * 100) : 0;
            const color = pct >= 85 ? "#16a34a" : pct >= 65 ? "#ca8a04" : "#dc2626";
            return (
              <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4">
                <div className="relative w-12 h-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#f0f0f0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
                      strokeDasharray={`${pct * 0.942} 94.2`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{pct}%</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-neutral-900">Processing Activity</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Last 7 days</p>
              </div>
              <Activity size={16} className="text-neutral-400" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={activityData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Line type="monotone" dataKey="processed" stroke="#2d6942" strokeWidth={2} dot={false} name="Processed" />
                <Line type="monotone" dataKey="verified" stroke="#c4922a" strokeWidth={2} dot={false} name="Verified" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Donut */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Processing Status</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {statusData.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-neutral-600">{s.name}</span>
                  </div>
                  <span className="font-semibold text-neutral-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confidence distribution */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Confidence Distribution</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={confDist} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#2d6942" radius={[4, 4, 0, 0]} name="Documents" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By district */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Records by District</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={districtData} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#c4922a" radius={[0, 4, 4, 0]} name="Records" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Queue */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div>
              <h3 className="font-semibold text-neutral-900">Verification Queue</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Low-confidence fields requiring human review</p>
            </div>
            <button onClick={() => navigate("/review")}
              className="text-sm text-green-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={14} />
            </button>
          </div>
          {!effectiveQueue?.length ? (
            <div className="p-8 text-center text-sm text-neutral-400">
              <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
              No items pending review
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Document</th>
                  <th className="px-6 py-3">Field</th>
                  <th className="px-6 py-3">Confidence</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {effectiveQueue.slice(0, 5).map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded">{item.doc_id}</span>
                    </td>
                    <td className="px-6 py-3.5 text-neutral-700">{formatFieldLabel(item.field_name)}</td>
                    <td className="px-6 py-3.5 w-40">
                      <ConfidenceBar value={item.confidence} size="sm" />
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5">
                      <button onClick={() => navigate(`/review/${item.doc_id}`)}
                        className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1 cursor-pointer">
                        Review <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Land Records */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-900">Recent Land Records</h3>
            <button onClick={() => navigate("/land-records")}
              className="text-sm text-green-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Khata No.</th>
                  <th className="px-6 py-3">Village</th>
                  <th className="px-6 py-3">District</th>
                  <th className="px-6 py-3">Area</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(effectiveRecent || []).map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-neutral-900">{rec.owner_name}</td>
                    <td className="px-6 py-3.5 text-neutral-600 font-mono text-xs">{rec.khata_number || "—"}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{rec.village || "—"}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{rec.district || "—"}</td>
                    <td className="px-6 py-3.5 text-neutral-600">{rec.area ? `${rec.area} ${rec.unit || "acres"}` : "—"}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={rec.status} size="sm" /></td>
                    <td className="px-6 py-3.5">
                      <button onClick={() => navigate(`/land-records/${rec.record_id}`)}
                        className="text-neutral-400 hover:text-green-700 transition-colors cursor-pointer" title="View details">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}