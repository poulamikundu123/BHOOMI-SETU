import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../services/api";
import { Bell, CheckCheck, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { formatDate } from "../../utils/helpers";

const TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  SUCCESS: { icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4" },
  WARNING: { icon: AlertTriangle, color: "#ca8a04", bg: "#fffbeb" },
  ERROR: { icon: XCircle, color: "#dc2626", bg: "#fef2f2" },
  INFO: { icon: Info, color: "#3b82f6", bg: "#eff6ff" },
};

export default function CitizenNotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then(r => r.data),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-header-list"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-header-list"] });
    },
  });

  const unread = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up."}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900 transition"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-neutral-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
            <Bell size={40} className="mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">You're all caught up!</h3>
            <p className="text-sm text-neutral-500">No notifications at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => {
              const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.INFO;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border p-4 transition cursor-pointer hover:shadow-sm ${
                    n.is_read ? "border-neutral-200 opacity-80" : "border-green-300 ring-1 ring-green-100"
                  }`}
                  onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <Icon size={17} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-sm font-semibold ${n.is_read ? "text-neutral-700" : "text-neutral-900"}`}>
                          {n.title}
                          {!n.is_read && <span className="ml-2 w-2 h-2 rounded-full bg-green-500 inline-block" />}
                        </div>
                        <div className="text-xs text-neutral-400 shrink-0">{formatDate(n.created_at)}</div>
                      </div>
                      <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">{n.message}</p>
                      {n.doc_id && (
                        <div className="mt-2">
                          <span className="text-xs font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                            {n.doc_id}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

