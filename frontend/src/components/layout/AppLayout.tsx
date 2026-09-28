import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import { Search, Bell, ChevronDown, CheckCircle2, AlertTriangle, FileText, User as UserIcon, LogOut, Info } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { notificationsApi } from "../../services/api";

export default function AppLayout() {
  const { user, isDemoMode, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const officerName = user?.name || (isDemoMode ? "Rajiv Sharma" : "User");
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    OFFICER: "Revenue Officer",
    REVIEWER: "Verification Officer",
    CITIZEN: "Citizen",
  };
  const officerRole = roleLabels[user?.role || ""] || user?.role || "Citizen";
  const initials = officerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        return res.data?.unread_count ?? 0;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  const { data: liveNotifs } = useQuery({
    queryKey: ["notifications-header-list"],
    queryFn: async () => {
      try {
        const res = await notificationsApi.list();
        return res.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  const unreadCount = unreadData ?? (isDemoMode ? 3 : 0);

  const sampleNotifications = [
    {
      id: 1,
      title: "Khatian_1024.pdf processed",
      time: "Just now",
      desc: "12 fields detected with 95% avg AI confidence",
      type: "success",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
      doc_id: null,
    },
    {
      id: 2,
      title: "Conflict Attention: Plot Area",
      time: "5m ago",
      desc: "Plot Area mismatch (2.40 vs 2.10 acres) requires verification",
      type: "warning",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
      doc_id: null,
    },
    {
      id: 3,
      title: "New document upload ready",
      time: "24m ago",
      desc: "Khasra_89_Jalpaiguri.pdf queued for OCR extraction",
      type: "info",
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
      doc_id: null,
    },
  ];

  const displayNotifications = (liveNotifs && liveNotifs.length > 0)
    ? liveNotifs.slice(0, 5).map((n: any) => {
        let icon = FileText;
        let color = "text-blue-600 bg-blue-50";
        if (n.type === "SUCCESS") {
          icon = CheckCircle2;
          color = "text-emerald-600 bg-emerald-50";
        } else if (n.type === "WARNING" || n.type === "CONFLICT") {
          icon = AlertTriangle;
          color = "text-amber-600 bg-amber-50";
        } else if (n.type === "ERROR") {
          icon = AlertTriangle;
          color = "text-red-600 bg-red-50";
        }
        return {
          id: n.id,
          title: n.title,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          desc: n.message,
          type: n.type,
          icon,
          color,
          doc_id: n.doc_id,
        };
      })
    : sampleNotifications;

  return (
    <div className="flex min-h-screen bg-[#f8faf8]">
      <Sidebar />

      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-[#f8faf8]/95 backdrop-blur-md border-b border-slate-200/70 px-8 py-3.5 flex items-center justify-between">
          {/* Centered Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, owner, plot number, village..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition shadow-2xs"
              />
            </div>
          </form>

          {/* Right: Notifications & User Avatar */}
          <div className="flex items-center gap-4 ml-6">
            {/* Notifications Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/60 transition shadow-2xs"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popup */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Notifications</span>
                    {unreadCount > 0 ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        All Caught Up
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                    {displayNotifications.map((notif: any) => {
                      const Icon = notif.icon;
                      return (
                        <div
                          key={notif.id}
                          className="px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer flex gap-3"
                          onClick={() => {
                            setShowNotifications(false);
                            if (notif.doc_id) navigate(`/documents/${notif.doc_id}`);
                            else if (notif.id === 1) navigate("/document-overview");
                            else if (notif.id === 2) navigate("/record-validation");
                            else navigate("/notifications");
                          }}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${notif.color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-800 flex justify-between">
                              <span className="truncate">{notif.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal shrink-0">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{notif.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/notifications");
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-white border border-transparent hover:border-slate-200/60 transition shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-full bg-[#133e29] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 leading-tight">
                    {officerName}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {officerRole}
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 ml-0.5" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900">{officerName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email || "officer@dlr.gov.in"}</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1">Darjeeling Revenue Division</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <UserIcon size={14} /> Profile & Office Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}