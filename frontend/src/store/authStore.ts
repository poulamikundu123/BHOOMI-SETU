import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  mobile?: string;
  state?: string;
  district?: string;
  preferred_language?: string;
  onboarding_complete?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  setAuth: (user: User, token: string, isDemo?: boolean) => void;
  setDemoMode: (isDemo: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isDemoMode: false,
      setAuth: (user, token, isDemo = false) => {
        localStorage.setItem("auth_token", token);
        set({ user, token, isAuthenticated: true, isDemoMode: isDemo });
      },
      setDemoMode: (isDemo: boolean) => {
        set({ isDemoMode: isDemo });
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        set({ user: null, token: null, isAuthenticated: false, isDemoMode: false });
      },
    }),
    { name: "sih-auth" }
  )
);