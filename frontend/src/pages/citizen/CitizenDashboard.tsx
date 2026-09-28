import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { dashboardApi, citizenApi } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import {
  BookOpen, Upload, FileText, Bell, ArrowRight, CheckCircle,
  Clock, AlertTriangle, Plus, Search, Download, Map, Edit3,
  FileX, Landmark
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import StatusBadge from "../../components/ui/StatusBadge";

function CitizenStatCard({ icon: Icon, label, value, color, onClick }: any) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200 p-5 flex items-start gap-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5`}
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-3xl font-bold text-neutral-900">{value}</div>
        <div className="text-sm font-medium text-neutral-600 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

const DEMO_CITIZEN_RECORDS = [
  {
    id: "1",
    record_id: "LR-WB-DAR-1024",
    plot_number: "Plot 104 (Dag 67/A)",
    khata_number: "238",
    village: "Matigara",
    district: "Darjeeling",
    area: "2.40",
    unit: "acres",
    status: "VERIFIED",
    created_at: "2024-03-14T10:30:00Z",
  },
  {
    id: "2",
    record_id: "LR-WB-DAR-1025",
    plot_number: "Plot 104/A (Homestead)",
    khata_number: "238",
    village: "Matigara",
    district: "Darjeeling",
    area: "0.15",
    unit: "acres",
    status: "VERIFIED",
    created_at: "2024-02-10T14:15:00Z",
  },
  {
    id: "3",
    record_id: "LR-WB-DAR-1026",
    plot_number: "Plot 215/1",
    khata_number: "482",
    village: "Siliguri Rural",
    district: "Darjeeling",
    area: "1.85",
    unit: "acres",
    status: "PENDING_REVIEW",
    created_at: "2024-01-20T09:00:00Z",
  },
];

const DEMO_CITIZEN_DOCS = [
  {
    id: "1",
    doc_id: "WB-ROR-1024",
    filename: "Khatian_1024_Matigara.pdf",
    uploaded_at: "2024-03-14T10:30:00Z",
    status: "COMPLETED",
  },
  {
    id: "2",
    doc_id: "WB-MUT-7891",
    filename: "MutationCertificate_MUT7891.pdf",
    uploaded_at: "2024-02-18T16:45:00Z",
    status: "COMPLETED",
  },
];

export default function CitizenDashboard() {
  const { user, isDemoMode } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["citizen-dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: myRecords } = useQuery({
    queryKey: ["citizen-my-records"],
    queryFn: () => citizenApi.getMyRecords().then(r => r.data),
  });

  const { data: myDocs } = useQuery({
    queryKey: ["citizen-my-docs"],
    queryFn: () => citizenApi.getMyDocuments().then(r => r.data),
  });

  const firstName = user?.name?.split(" ")[0] || "Citizen";
  const records = (myRecords && myRecords.length > 0) ? myRecords : DEMO_CITIZEN_RECORDS;
  const docs = (myDocs && myDocs.length > 0) ? myDocs : DEMO_CITIZEN_DOCS;

  const recentActivity = [
    ...(records.slice(0, 3).map((r: any) => ({
      type: "record",
      label: r.status === "VERIFIED" ? "Land record verified" : r.status === "PENDING_REVIEW" ? "Record under review" : "Record updated",
      detail: `Plot ${r.plot_number || "—"}, ${r.village || "—"}`,
      time: r.created_at,
      icon: r.status === "VERIFIED" ? CheckCircle : Clock,
      color: r.status === "VERIFIED" ? "#16a34a" : "#ca8a04"
    }))),
    ...(docs.slice(0, 2).map((d: any) => ({
      type: "doc",
      label: "Document submitted",
      detail: d.doc_id,
      time: d.uploaded_at,
      icon: FileText,
      color: "#3b82f6"
    }))),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #1d4731 0%, #265c40 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium mb-1">Welcome back,</p>
              <h1 className="text-3xl font-bold text-white">{firstName}</h1>
              <p className="text-green-200 text-sm mt-1">
                Manage your land records and applications
                {user?.district && user?.state ? ` · ${user.district}, ${user.state}` : ""}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/citizen/upload")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-2 border-white/30 hover:bg-white/10 transition"
              >
                <Upload size={16} />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CitizenStatCard
            icon={BookOpen}
            label="My Land Records"
            value={stats?.total_land_records ?? records.length}
            color="#235234"
            onClick={() => navigate("/citizen/records")}
          />
          <CitizenStatCard
            icon={Clock}
            label="Pending Review"
            value={stats?.pending_review ?? records.filter((r: any) => r.status === "PENDING_REVIEW").length}
            color="#ca8a04"
            onClick={() => navigate("/citizen/records?status=PENDING_REVIEW")}
          />
          <CitizenStatCard
            icon={FileText}
            label="Documents Submitted"
            value={stats?.total_documents ?? docs.length}
            color="#3b82f6"
            onClick={() => navigate("/citizen/documents")}
          />
          <CitizenStatCard
            icon={Bell}
            label="Notifications"
            value={stats?.unread_notifications ?? 0}
            color="#7c3aed"
            onClick={() => navigate("/citizen/notifications")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Land Records */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">My Land Records</h2>
              <button
                onClick={() => navigate("/citizen/records")}
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "#235234" }}
              >
                View All <ArrowRight size={14} />
              </button>
            </div>

            {records.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen size={40} className="mx-auto mb-4 text-neutral-300" />
                <h3 className="font-semibold text-neutral-900 mb-2">No land records yet</h3>
                <p className="text-sm text-neutral-500 mb-5">
                  Upload your first land document to begin the digitization process.
                </p>
                <button
                  onClick={() => navigate("/citizen/upload")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#235234" }}
                >
                  <Upload size={16} />
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {records.slice(0, 4).map((rec: any) => (
                  <div
                    key={rec.id}
                    className="px-6 py-4 hover:bg-neutral-50 transition cursor-pointer flex items-center gap-4"
                    onClick={() => navigate(`/citizen/records/${rec.record_id}`)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e8f5ee" }}>
                      <Landmark size={18} style={{ color: "#235234" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 text-sm">{rec.plot_number} · {rec.village}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Khata {rec.khata_number} · {rec.district}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={rec.status} size="sm" />
                      <div className="text-xs text-neutral-400 mt-1">{rec.area} {rec.unit}</div>
                    </div>
                    <ArrowRight size={16} className="text-neutral-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="font-semibold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Upload, label: "Upload Document", color: "#235234", path: "/citizen/upload" },
                  { icon: Search, label: "Search Land Record", color: "#3b82f6", path: "/search" },
                  { icon: Edit3, label: "Request Correction", color: "#ca8a04", path: "/citizen/corrections" },
                  { icon: Map, label: "View GIS Map", color: "#7c3aed", path: "/gis-map" },
                  { icon: Download, label: "Download Records", color: "#16a34a", path: "/citizen/records" },
                ].map(({ icon: Icon, label, color, path }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition text-sm font-medium text-neutral-700"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    {label}
                    <ChevronRight size={14} className="ml-auto text-neutral-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="font-semibold text-neutral-900 mb-4">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <div className="text-center py-4">
                  <Clock size={24} className="mx-auto mb-2 text-neutral-300" />
                  <p className="text-xs text-neutral-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                        <item.icon size={14} style={{ color: item.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-800">{item.label}</div>
                        <div className="text-xs text-neutral-500">{item.detail}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{formatDate(item.time)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return <ArrowRight size={size} className={className} />;
}

