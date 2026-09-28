import { NavLink, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet, ShieldCheck, Map, LayoutDashboard,
  FileText, BookOpen, Search, CheckCircle2, BarChart2,
  Settings, LogOut, Activity, UserCheck, Bell, Users
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const CORE_MODULES = [
  { to: "/document-overview", label: "Document Overview", icon: FileSpreadsheet },
  { to: "/record-validation", label: "Record Validation", icon: ShieldCheck },
  { to: "/gis-map", label: "Map View", icon: Map },
];

export default function Sidebar() {
  const { user, isDemoMode, logout } = useAuthStore();
  const navigate = useNavigate();

  const officerName = user?.name || (isDemoMode ? "Rajiv Sharma" : "User");
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    OFFICER: "Revenue Officer",
    REVIEWER: "Verification Officer",
    CITIZEN: "Citizen / Land Owner",
  };
  const officerRole = roleLabels[user?.role || ""] || user?.role || "Citizen";
  const officerDistrict = user?.district || (isDemoMode ? "Darjeeling" : "Local Office");
  const initials = officerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US";

  const navigationItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/documents", label: "Documents", icon: FileText },
    { to: "/land-records", label: "Land Records", icon: BookOpen },
    { to: "/search", label: "Search", icon: Search },
    { to: "/review", label: "Verification", icon: CheckCircle2 },
    { to: "/citizen-requests", label: "Citizen Requests", icon: UserCheck },
    { to: "/processing-monitor", label: "Processing Monitor", icon: Activity },
    { to: "/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/notifications", label: "Notifications", icon: Bell },
    ...(user?.role === "ADMIN" ? [{ to: "/users", label: "User Management", icon: Users }] : []),
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/90 flex flex-col z-40 shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <img
          src="/logo_nobg.png"
          alt="BhoomiSetu Logo"
          className="w-12 h-12 object-contain shrink-0 drop-shadow-sm"
        />
        <div className="min-w-0">
          <div className="text-slate-900 font-extrabold text-[15px] leading-tight tracking-tight flex items-center gap-1.5">
            BhoomiSetu
          </div>
          <div className="text-slate-500 text-xs font-medium tracking-wide">
            Land Intelligence
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Core Modules */}
        <div>
          <div className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          <div className="space-y-1">
            {CORE_MODULES.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-[#0d3826] text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={17}
                        className={
                          isActive
                            ? "text-emerald-300 shrink-0"
                            : "text-slate-500 group-hover:text-slate-800 shrink-0"
                        }
                      />
                      <span className="truncate">{label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <div className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <div className="space-y-1">
            {navigationItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-[#0d3826] text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={17}
                        className={
                          isActive
                            ? "text-emerald-300 shrink-0"
                            : "text-slate-500 group-hover:text-slate-800 shrink-0"
                        }
                      />
                      <span className="truncate">{label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl mb-1.5 bg-white border border-slate-200/60 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-[#133e29] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-900 text-xs font-bold truncate leading-tight">
              {officerName}
            </div>
            <div className="text-slate-500 text-[11px] truncate leading-tight">
              {officerRole}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[11px]">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium border text-[10.5px] ${
            isDemoMode
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDemoMode ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {isDemoMode ? "Demo Mode" : `Live · ${officerDistrict}`}
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition text-[11px] font-medium"
            title="Sign out"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}