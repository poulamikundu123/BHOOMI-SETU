import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Upload, FileText, Edit3,
  Map, Bell, User, LogOut, Landmark, ChevronRight
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "../../services/api";

const CITIZEN_NAV = [
  { to: "/citizen/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/citizen/records", label: "My Land Records", icon: BookOpen },
  { to: "/citizen/upload", label: "Upload Document", icon: Upload },
  { to: "/citizen/documents", label: "My Documents", icon: FileText },
  { to: "/citizen/corrections", label: "Correction Requests", icon: Edit3 },
  { to: "/citizen/gis-map", label: "GIS Map", icon: Map },
  { to: "/citizen/notifications", label: "Notifications", icon: Bell },
  { to: "/citizen/profile", label: "My Profile", icon: User },
];

export default function CitizenSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: countData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => notificationsApi.getUnreadCount().then(r => r.data),
    refetchInterval: 30000,
  });

  const unreadCount = countData?.count || 0;

  return (
    <aside
      className="fixed inset-y-0 left-0 w-64 flex flex-col z-40"
      style={{ background: "linear-gradient(180deg, #0d1f13 0%, #163526 50%, #1d4731 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img
          src="/logo_nobg.png"
          alt="BhoomiSetu Logo"
          className="w-11 h-11 object-contain shrink-0 drop-shadow-sm"
        />
        <div>
          <div className="text-white font-bold text-sm leading-tight">BhoomiSetu</div>
          <div className="text-green-300 text-xs">Citizen Portal</div>
        </div>
      </div>

      {/* Citizen badge */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(164, 211, 183, 0.1)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#3a8050" }}>
            {user?.name?.charAt(0) || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-green-400 text-xs">Citizen</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {CITIZEN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/citizen/dashboard"}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon size={16} />
            <span>{label}</span>
            {to === "/citizen/notifications" && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="sidebar-link w-full text-red-300 hover:text-red-200"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
