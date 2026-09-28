import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Landmark, Eye, EyeOff, AlertCircle, Shield, Cpu, Map,
  UserPlus, LogIn, ChevronRight, Lock, Users, Sparkles, CheckCircle2
} from "lucide-react";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const DEMO_ACCOUNTS = [
  {
    label: "Officer (Rajiv Sharma)",
    roleTitle: "Revenue Officer · Darjeeling",
    email: "officer@dlr.gov.in",
    password: "Officer@2026",
    role: "OFFICER",
    name: "Rajiv Sharma",
    district: "Darjeeling",
    state: "West Bengal",
    desc: "Khatian 1024 overview, extraction & conflict resolution",
  },
  {
    label: "Admin (Rajiv Menon)",
    roleTitle: "System Administrator",
    email: "admin@dlr.gov.in",
    password: "Admin@2026",
    role: "ADMIN",
    name: "Rajiv Menon",
    district: "State HQ",
    state: "West Bengal",
    desc: "System monitoring, user roles & analytics",
  },
  {
    label: "Reviewer (Meena Rao)",
    roleTitle: "Verification Officer",
    email: "reviewer@dlr.gov.in",
    password: "Reviewer@2026",
    role: "REVIEWER",
    name: "Meena Rao",
    district: "Pune",
    state: "Maharashtra",
    desc: "Human-in-the-loop field verification queue",
  },
  {
    label: "Citizen (Animesh Chatterjee)",
    roleTitle: "Land Owner · Darjeeling",
    email: "animesh@citizen.in",
    password: "Citizen@2026",
    role: "CITIZEN",
    name: "Animesh Chatterjee",
    district: "Darjeeling",
    state: "West Bengal",
    desc: "Citizen portal, view land records & upload deeds",
  },
];

const INDIAN_STATES = [
  "West Bengal", "Bihar", "Assam", "Maharashtra", "Uttar Pradesh",
  "Madhya Pradesh", "Rajasthan", "Punjab", "Gujarat", "Karnataka",
  "Tamil Nadu", "Odisha", "Jharkhand", "Delhi"
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Mode: "login" (Existing User) vs "signup" (New User)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Sign In State (Existing User)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Sign Up State (New User)
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "CITIZEN",
    state: "West Bengal",
    district: "Darjeeling",
    preferred_language: "Bengali",
    password: "",
    confirmPassword: "",
  });
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  // Handler for Existing User Login
  const handleExistingUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const { data } = await authApi.login(loginEmail, loginPassword);
      // Real user login: isDemo = false
      setAuth(data.user, data.access_token, false);
      toast.success(`Welcome back, ${data.user.name}!`);

      if (data.user.role === "CITIZEN") {
        navigate("/citizen/dashboard");
      } else {
        navigate("/document-overview");
      }
    } catch (err: any) {
      // Fallback check if user entered demo credentials in the standard login box
      const demoMatch = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === loginEmail.toLowerCase()
      );
      if (demoMatch && (loginPassword === demoMatch.password || !loginPassword)) {
        handleLaunchDemo(demoMatch);
        return;
      }

      setLoginError(
        err.response?.data?.detail ||
          "Invalid email or password. Please try again or use the demo evaluation below."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Handler for New User Registration
  const handleNewUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }
    if (signupForm.password.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }

    setSignupLoading(true);
    try {
      await authApi.registerCitizen({
        name: signupForm.name,
        email: signupForm.email,
        mobile: signupForm.mobile,
        password: signupForm.password,
        state: signupForm.state,
        district: signupForm.district,
        preferred_language: signupForm.preferred_language,
      });

      // Automatically authenticate the newly registered user via login to get a real JWT
      try {
        const { data: loginData } = await authApi.login(signupForm.email, signupForm.password);
        setAuth(loginData.user, loginData.access_token, false);
      } catch {
        const newUser = {
          id: Math.floor(Math.random() * 9000) + 1000,
          name: signupForm.name,
          email: signupForm.email,
          mobile: signupForm.mobile,
          role: signupForm.role,
          state: signupForm.state,
          district: signupForm.district,
          preferred_language: signupForm.preferred_language,
          onboarding_complete: true,
        };
        setAuth(newUser, "demo-token-citizen", true);
      }

      toast.success(`Account created successfully! Welcome, ${signupForm.name}.`);
      if (signupForm.role === "CITIZEN") {
        navigate("/citizen/dashboard");
      } else {
        navigate("/document-overview");
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setSignupError(err.response.data.detail);
      } else {
        // Local fallback registration if backend completely offline
        const newUser = {
          id: Math.floor(Math.random() * 9000) + 1000,
          name: signupForm.name,
          email: signupForm.email,
          mobile: signupForm.mobile,
          role: signupForm.role,
          state: signupForm.state,
          district: signupForm.district,
          preferred_language: signupForm.preferred_language,
          onboarding_complete: true,
        };
        setAuth(newUser, "demo-token-citizen", true);
        toast.success(`Account created! Welcome, ${signupForm.name}.`);

        if (signupForm.role === "CITIZEN") {
          navigate("/citizen/dashboard");
        } else {
          navigate("/document-overview");
        }
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // Handler to Launch Demo Mode explicitly
  const handleLaunchDemo = async (demoAccount: (typeof DEMO_ACCOUNTS)[0]) => {
    try {
      const { data } = await authApi.login(demoAccount.email, demoAccount.password);
      setAuth(data.user, data.access_token, true);
      toast.success(`Entered Demo Evaluation as ${demoAccount.name} (${demoAccount.role})`);
      if (demoAccount.role === "CITIZEN") {
        navigate("/citizen/dashboard");
      } else {
        navigate("/document-overview");
      }
    } catch {
      const demoUser = {
        id: demoAccount.role === "OFFICER" ? 2 : demoAccount.role === "ADMIN" ? 1 : 3,
        name: demoAccount.name,
        email: demoAccount.email,
        role: demoAccount.role,
        district: demoAccount.district,
        state: demoAccount.state,
        preferred_language: "Bengali",
        onboarding_complete: true,
      };

      // Set demo mode = TRUE with demo token fallback
      setAuth(demoUser, `demo-token-${demoAccount.role.toLowerCase()}`, true);
      toast.success(`Entered Demo Evaluation as ${demoAccount.name} (${demoAccount.role})`);

      if (demoAccount.role === "CITIZEN") {
        navigate("/citizen/dashboard");
      } else {
        navigate("/document-overview");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8faf8]">
      {/* LEFT PANEL: Platform Hero & Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #091c13 0%, #123322 40%, #1a4a32 80%, #235d40 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #34d399 0%, transparent 50%), radial-gradient(circle at 75% 75%, #fbbf24 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3.5 mb-10">
            <img
              src="/logo_nobg.png"
              alt="BhoomiSetu Logo"
              className="w-16 h-16 object-contain drop-shadow-md"
            />
            <div>
              <div className="text-2xl font-black tracking-tight text-white">BhoomiSetu</div>
              <div className="text-emerald-300 text-xs font-semibold tracking-wider uppercase">
                Land Intelligence Platform
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            AI-Powered Land Record Digitization, Validation & GIS Intelligence
          </h1>
          <p className="text-emerald-100/90 text-sm leading-relaxed max-w-md">
            Seamlessly transform physical land deeds and Khatians into verified digital records with
            multilingual OCR, automated rule validation, and cadastral spatial mapping.
          </p>
        </div>

        {/* Highlight Badges */}
        <div className="relative z-10 space-y-3 my-8">
          {[
            {
              icon: Cpu,
              title: "Multilingual OCR & Layout AI",
              desc: "Bengali, Hindi, Marathi, Assamese, and English land documents",
            },
            {
              icon: Shield,
              title: "Digital Record Cross-Validation",
              desc: "Automated discrepancy detection and officer resolution workflow",
            },
            {
              icon: Map,
              title: "GIS & Cadastral Mapping",
              desc: "Interactive boundary plot overlays with geo-coordinates",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{title}</div>
                <div className="text-[11px] text-emerald-200/80 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-[11px] text-emerald-300/80 flex items-center justify-between border-t border-white/10 pt-4">
          <span>Smart India Hackathon 2026 · Problem Statement SIH26018</span>
          <span>Government of West Bengal & India</span>
        </div>
      </div>

      {/* RIGHT PANEL: Two-Section Form (Existing User Login vs New User Registration + Demo Below) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 my-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-2">
            <div className="inline-flex items-center gap-2">
              <img
                src="/logo_nobg.png"
                alt="BhoomiSetu Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="font-extrabold text-xl text-slate-900">BhoomiSetu</span>
            </div>
          </div>

          {/* TWO SECTIONS SWITCHER: Existing User vs New User */}
          <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center shadow-2xs">
            <button
              type="button"
              id="tab-existing-user"
              onClick={() => {
                setAuthMode("login");
                setLoginError("");
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                authMode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn size={16} className={authMode === "login" ? "text-emerald-700" : ""} />
              <span>Existing User (Sign In)</span>
            </button>

            <button
              type="button"
              id="tab-new-user"
              onClick={() => {
                setAuthMode("signup");
                setSignupError("");
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                authMode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus size={16} className={authMode === "signup" ? "text-emerald-700" : ""} />
              <span>New User (Register)</span>
            </button>
          </div>

          {/* SECTION 1: EXISTING USER LOGIN */}
          {authMode === "login" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Sign In to Your Account
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your registered email and password to access your land intelligence dashboard.
                  </p>
                </div>

                <form onSubmit={handleExistingUserLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="login-email-input"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="e.g. officer@dlr.gov.in or citizen@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => toast("Contact your district administrator to reset password.")}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password-input"
                        type={showLoginPwd ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPwd(!showLoginPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    id="btn-submit-login"
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-[#0d3826] hover:bg-[#092b1d] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loginLoading ? "Authenticating..." : "Sign In to Workspace"}
                    <ChevronRight size={16} />
                  </button>
                </form>
              </div>

              {/* DEMO SECTION (PLACED DIRECTLY BELOW EXISTING USERS LOGIN) */}
              <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-slate-50 border-2 border-emerald-300/80 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Sparkles size={14} />
                  </div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Evaluation & Interactive Demo
                  </h3>
                  <span className="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
                    SIH 2026 Preview
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Click on any profile below to preview the platform with pre-loaded official land records
                  (Khatian 1024, AI OCR extraction, and discrepancy verification).
                </p>

                {/* 4 Demo Roles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      id={`btn-demo-${acc.role.toLowerCase()}`}
                      onClick={() => handleLaunchDemo(acc)}
                      className="p-3 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-500 hover:shadow-xs transition text-left group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800">
                            {acc.label}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight">
                          {acc.roleTitle}
                        </div>
                      </div>
                      <div className="mt-2.5 text-[10.5px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Launch Demo Preview</span>
                        <ChevronRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: NEW USER REGISTRATION */}
          {authMode === "signup" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Create a New User Account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Register to manage your real land records, upload deeds, and track verification live.
                </p>
              </div>

              <form onSubmit={handleNewUserSignup} className="space-y-4">
                {/* Full Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={signupForm.mobile}
                      onChange={(e) => setSignupForm({ ...signupForm, mobile: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="your.email@domain.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSignupForm({ ...signupForm, role: "CITIZEN" })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        signupForm.role === "CITIZEN"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Users size={14} />
                      <span>Citizen / Land Owner</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupForm({ ...signupForm, role: "OFFICER" })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        signupForm.role === "OFFICER"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Shield size={14} />
                      <span>Revenue Official</span>
                    </button>
                  </div>
                </div>

                {/* State & District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <select
                      value={signupForm.state}
                      onChange={(e) => setSignupForm({ ...signupForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-700"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                    <input
                      type="text"
                      value={signupForm.district}
                      onChange={(e) => setSignupForm({ ...signupForm, district: e.target.value })}
                      placeholder="e.g. Darjeeling"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showSignupPwd ? "text" : "password"}
                        required
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPwd(!showSignupPwd)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                      >
                        {showSignupPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showSignupPwd ? "text" : "password"}
                      required
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>

                {signupError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-3 bg-[#0d3826] hover:bg-[#092b1d] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {signupLoading ? "Creating Account..." : "Create Account & Enter Platform"}
                  <ChevronRight size={16} />
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  onClick={() => setAuthMode("login")}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Sign In here
                </button>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400">
            Digital Land Records · Government of India · SIH26018
          </div>
        </div>
      </div>
    </div>
  );
}