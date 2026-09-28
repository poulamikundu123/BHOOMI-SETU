import axios from "axios";
import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Auth token injection - retrieve from Zustand store or localStorage
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling - prevent infinite redirect loops on 401
let isRedirecting = false;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

      // Don't auto-redirect on login or registration attempts - let the form show the error message
      if (!isAuthEndpoint && !isRedirecting) {
        isRedirecting = true;
        useAuthStore.getState().logout();
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("sih-auth");

        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
        setTimeout(() => {
          isRedirecting = false;
        }, 1500);
      }
    }
    return Promise.reject(err);
  }
);

// AUTH
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  registerCitizen: (data: any) => api.post("/auth/register/citizen", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data: any) => api.put("/auth/me", data),
  completeOnboarding: () => api.post("/auth/me/complete-onboarding"),
  listUsers: () => api.get("/auth/users"),
};

// DOCUMENTS
export const documentsApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/documents/upload", fd);
  },
  list: (params?: any) => api.get("/documents/", { params }),
  get: (docId: string) => api.get(`/documents/${docId}`),
  getStatus: (docId: string) => api.get(`/documents/${docId}/status`),
  getFields: (docId: string) => api.get(`/documents/${docId}/fields`),
  getValidations: (docId: string) => api.get(`/documents/${docId}/validations`),
  getOcrText: (docId: string) => api.get(`/documents/${docId}/ocr-text`),
  delete: (docId: string) => api.delete(`/documents/${docId}`),
};

// REVIEW
export const reviewApi = {
  getQueue: () => api.get("/review/queue"),
  getDetail: (docId: string) => api.get(`/review/${docId}`),
  correctField: (docId: string, data: any) => api.post(`/review/${docId}/correct`, data),
  approve: (docId: string) => api.post(`/review/${docId}/approve`),
  reject: (docId: string) => api.post(`/review/${docId}/reject`),
};

// LAND RECORDS
export const landRecordsApi = {
  list: (params?: any) => api.get("/land-records/", { params }),
  search: (q: string, field?: string) =>
    api.get("/land-records/search", { params: { q, field } }),
  get: (recordId: string) => api.get(`/land-records/${recordId}`),
};

// CITIZEN PORTAL
export const citizenApi = {
  getMyRecords: (params?: any) => api.get("/citizen/my-records", { params }),
  getMyRecord: (recordId: string) => api.get(`/citizen/my-records/${recordId}`),
  getMyDocuments: () => api.get("/citizen/my-documents"),
  getMyCorrections: () => api.get("/citizen/my-corrections"),
  submitCorrection: (data: any) => api.post("/citizen/correction-request", data),
  getMyNotifications: () => api.get("/citizen/my-notifications"),
  // Officer/admin correction management
  getAllCorrections: () => api.get("/citizen/corrections/all"),
  processCorrection: (id: number, action: string, notes?: string) =>
    api.put(`/citizen/corrections/${id}/process`, null, { params: { action, notes } }),
};

// DASHBOARD
export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
};

// GIS
export const gisApi = {
  getGeoJson: () => api.get("/gis/geojson"),
  getRecordLocation: (recordId: string) => api.get(`/gis/record/${recordId}`),
};

// NOTIFICATIONS
export const notificationsApi = {
  list: () => api.get("/notifications/"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/mark-all-read"),
};