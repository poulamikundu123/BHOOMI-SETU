import { useQuery } from "@tanstack/react-query";
import { authApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatDate } from "../utils/helpers";
import { Users, Shield, User } from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  OFFICER: "bg-blue-100 text-blue-800",
  REVIEWER: "bg-amber-100 text-amber-800",
  VIEWER: "bg-neutral-100 text-neutral-600",
};

const DEMO_USERS = [
  { id: 1, name: "System Administrator", email: "admin@dlr.gov.in", role: "ADMIN", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: 2, name: "Rajiv Sharma", email: "officer@dlr.gov.in", role: "OFFICER", is_active: true, created_at: "2024-01-05T00:00:00Z" },
  { id: 3, name: "Sunita Roy", email: "reviewer@dlr.gov.in", role: "REVIEWER", is_active: true, created_at: "2024-01-10T00:00:00Z" },
  { id: 4, name: "Animesh Chatterjee", email: "animesh@citizen.in", role: "CITIZEN", is_active: true, created_at: "2024-01-15T00:00:00Z" },
  { id: 5, name: "Ramesh Kumar Sinha", email: "ramesh@citizen.in", role: "CITIZEN", is_active: true, created_at: "2024-02-01T00:00:00Z" },
];

export default function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const res = await authApi.listUsers();
        if (res.data && res.data.length > 0) return res.data;
      } catch {
        // Fallback for offline demo
      }
      return DEMO_USERS;
    },
  });

  if (isLoading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="User Management" subtitle={`${users?.length || 0} registered users`} />
      <div className="p-8">
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr className="text-left text-xs text-neutral-400 uppercase tracking-wide">
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {(users || []).map((u: any) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: "#2d6942" }}>
                        {u.name?.charAt(0)}
                      </div>
                      <span className="font-medium text-neutral-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-neutral-600">{u.email}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[u.role] || "bg-neutral-100 text-neutral-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-neutral-400 text-xs">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}