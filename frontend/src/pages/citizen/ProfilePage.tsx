import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { User, Mail, Phone, MapPin, Globe, CheckCircle, Edit2, Save, X } from "lucide-react";
import { formatDate } from "../../utils/helpers";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const LANGUAGES = ["English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese", "Urdu"];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    state: user?.state || "",
    district: user?.district || "",
    preferred_language: user?.preferred_language || "English",
  });
  const [saved, setSaved] = useState(false);

  const { data: freshUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const profile = freshUser || user;

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">My Profile</h1>

        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-5" style={{ background: "linear-gradient(135deg, #1d4731 0%, #265c40 100%)" }}>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "rgba(164, 211, 183, 0.3)" }}>
              {profile?.name?.charAt(0) || "C"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
              <p className="text-green-200 text-sm mt-0.5">{profile?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                  {profile?.role}
                </span>
                {profile?.onboarding_complete && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(164, 211, 183, 0.3)", color: "#a7f3d0" }}>
                    <CheckCircle size={11} /> Verified Account
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-900">Personal Information</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900 transition"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>

          {saved && (
            <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle size={16} /> Profile updated successfully
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Full Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Mobile Number</label>
                  <input
                    value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">State</label>
                  <select
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white outline-none focus:border-green-500"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">District</label>
                  <input
                    value={form.district}
                    onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Preferred Language</label>
                <select
                  value={form.preferred_language}
                  onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white outline-none focus:border-green-500"
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700">
                  <X size={14} /> Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#235234" }}>
                  <Save size={14} />
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-4">
              {[
                { icon: User, label: "Full Name", value: profile?.name },
                { icon: Mail, label: "Email Address", value: profile?.email },
                { icon: Phone, label: "Mobile Number", value: profile?.mobile || "Not provided" },
                { icon: MapPin, label: "Location", value: profile?.district && profile?.state ? `${profile.district}, ${profile.state}` : profile?.state || "Not provided" },
                { icon: Globe, label: "Preferred Language", value: profile?.preferred_language || "English" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-neutral-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#e8f5ee" }}>
                    <Icon size={15} style={{ color: "#235234" }} />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">{label}</div>
                    <div className="text-sm font-semibold text-neutral-800">{value}</div>
                  </div>
                </div>
              ))}
              {profile?.created_at && (
                <div className="text-xs text-neutral-400 pt-2">Account created: {formatDate(profile.created_at)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

