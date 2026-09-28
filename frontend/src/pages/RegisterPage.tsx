import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Landmark, Eye, EyeOff, AlertCircle, CheckCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const LANGUAGES = [
  "English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati",
  "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese", "Urdu"
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
    preferred_language: "English",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await authApi.registerCitizen({
        name: form.name,
        email: form.email,
        mobile: form.mobile || undefined,
        password: form.password,
        state: form.state || undefined,
        district: form.district || undefined,
        preferred_language: form.preferred_language,
      });

      // Auto-login after registration
      const { data } = await authApi.login(form.email, form.password);
      setAuth(data.user, data.access_token);
      setSuccess(true);
      setTimeout(() => navigate("/citizen/dashboard"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8f5ee 100%)" }}>
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition mb-6">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center" style={{ background: "linear-gradient(135deg, #1d4731 0%, #265c40 100%)" }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "rgba(164, 211, 183, 0.2)" }}>
              <Landmark size={26} className="text-green-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Citizen Account</h1>
            <p className="text-green-200 text-sm mt-1">
              Digital Land Records Platform · Government of India
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Account Created!</h3>
                <p className="text-sm text-neutral-500">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Animesh Chatterjee"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
                    />
                  </div>
                </div>

                {/* Email & Mobile */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@email.com"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mobile Number</label>
                    <input
                      id="reg-mobile"
                      name="mobile"
                      type="tel"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        name="password"
                        type={showPwd ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition pr-10"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
                    />
                  </div>
                </div>

                {/* State & District */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">State</label>
                    <select
                      id="reg-state"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">District</label>
                    <input
                      id="reg-district"
                      name="district"
                      type="text"
                      value={form.district}
                      onChange={handleChange}
                      placeholder="e.g. Darjeeling"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
                    />
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Preferred Language</label>
                  <select
                    id="reg-language"
                    name="preferred_language"
                    value={form.preferred_language}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition bg-white"
                  >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #1d4731, #265c40)" }}
                >
                  {loading ? "Creating Account..." : (
                    <>Create My Account <ChevronRight size={16} /></>
                  )}
                </button>

                <p className="text-center text-xs text-neutral-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-green-700 font-semibold hover:underline">Sign in</Link>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Your information is protected under the Digital Land Records Act.<br />
          Aadhaar linkage is optional for the SIH 2026 prototype.
        </p>
      </div>
    </div>
  );
}
