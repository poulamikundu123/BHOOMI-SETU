import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, Check } from "lucide-react";
import { formatDate } from "../utils/helpers";

const typeConfig: Record<string, { icon: any; bg: string; color: string }> = {
  SUCCESS: { icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
  WARNING: { icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-600" },
  ERROR: { icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
  INFO: { icon: Info, bg: "bg-blue-50", color: "text-blue-600" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then(r => r.data),
  });
  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-header-list"] });
    },
  });
  const markReadMut = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-header-list"] });
    },
  });

  if (isLoading) return <LoadingSpinner message="Loading notifications..." />;

  const unread = (notifications || []).filter((n: any) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Notifications" subtitle={`${unread} unread notifications`}>
        {unread > 0 && (
          <button onClick={() => markAllMut.mutate()}
            className="flex items-center gap-2 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100 transition text-neutral-600">
            <Check size={14} /> Mark All Read
          </button>
        )}
      </PageHeader>

      <div className="p-8 max-w-3xl">
        {!notifications?.length ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center">
            <Bell size={32} className="mx-auto mb-3 text-neutral-300" />
            <h3 className="font-semibold text-neutral-600">No Notifications</h3>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => {
              const cfg = typeConfig[n.type] || typeConfig.INFO;
              const Icon = cfg.icon;
              return (
                <div key={n.id}
                  className={`bg-white rounded-xl border ${n.is_read ? "border-neutral-200" : "border-l-4 border-l-green-500 border-neutral-200"} p-4 flex items-start gap-4 transition-all`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-sm text-neutral-800">{n.title}</div>
                      <div className="text-xs text-neutral-400 ml-4 shrink-0">{formatDate(n.created_at)}</div>
                    </div>
                    <p className="text-sm text-neutral-600 mt-0.5">{n.message}</p>
                    {n.doc_id && (
                      <span className="mt-1 inline-block text-xs font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                        {n.doc_id}
                      </span>
                    )}
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markReadMut.mutate(n.id)}
                      className="text-xs text-green-600 hover:text-green-800 shrink-0">
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}