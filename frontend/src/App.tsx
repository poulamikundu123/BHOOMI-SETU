import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Layouts
import AppLayout from "./components/layout/AppLayout";
import CitizenLayout from "./components/layout/CitizenLayout";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Admin/Officer/Reviewer pages
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import UploadPage from "./pages/UploadPage";
import DocumentOverviewPage from "./pages/DocumentOverviewPage";
import RecordValidationPage from "./pages/RecordValidationPage";
import ReviewPage from "./pages/ReviewPage";
import ReviewDetailPage from "./pages/ReviewDetailPage";
import LandRecordsPage from "./pages/LandRecordsPage";
import LandRecordDetailPage from "./pages/LandRecordDetailPage";
import SearchPage from "./pages/SearchPage";
import GISMapPage from "./pages/GISMapPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProcessingMonitorPage from "./pages/ProcessingMonitorPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import CitizenRequestsPage from "./pages/CitizenRequestsPage";

// Citizen pages
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenRecordsPage from "./pages/citizen/CitizenRecordsPage";
import CitizenRecordDetailPage from "./pages/citizen/CitizenRecordDetailPage";
import CitizenUploadPage from "./pages/citizen/CitizenUploadPage";
import CitizenDocumentsPage from "./pages/citizen/CitizenDocumentsPage";
import CitizenCorrectionsPage from "./pages/citizen/CitizenCorrectionsPage";
import CitizenNotificationsPage from "./pages/citizen/CitizenNotificationsPage";
import ProfilePage from "./pages/citizen/ProfilePage";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "CITIZEN" ? "/citizen/dashboard" : "/document-overview"} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  const defaultRedirect = isAuthenticated
    ? (user?.role === "CITIZEN" ? "/citizen/dashboard" : "/dashboard")
    : "/login";

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated
          ? <Navigate to={user?.role === "CITIZEN" ? "/citizen/dashboard" : "/dashboard"} replace />
          : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated
          ? <Navigate to={user?.role === "CITIZEN" ? "/citizen/dashboard" : "/dashboard"} replace />
          : <RegisterPage />
      } />

      {/* Citizen Portal */}
      <Route path="/citizen" element={
        <ProtectedRoute allowedRoles={["CITIZEN"]}>
          <CitizenLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/citizen/dashboard" replace />} />
        <Route path="dashboard" element={<CitizenDashboard />} />
        <Route path="records" element={<CitizenRecordsPage />} />
        <Route path="records/:id" element={<CitizenRecordDetailPage />} />
        <Route path="upload" element={<CitizenUploadPage />} />
        <Route path="documents" element={<CitizenDocumentsPage />} />
        <Route path="corrections" element={<CitizenCorrectionsPage />} />
        <Route path="notifications" element={<CitizenNotificationsPage />} />
        <Route path="gis-map" element={<GISMapPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Staff Portal (Admin / Officer / Reviewer) */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={["ADMIN", "OFFICER", "REVIEWER", "VIEWER"]}>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/document-overview" replace />} />
        <Route path="document-overview" element={<DocumentOverviewPage />} />
        <Route path="document-overview/:id" element={<DocumentOverviewPage />} />
        <Route path="record-validation" element={<RecordValidationPage />} />
        <Route path="record-validation/:id" element={<RecordValidationPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/upload" element={<UploadPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="review/:id" element={<ReviewDetailPage />} />
        <Route path="land-records" element={<LandRecordsPage />} />
        <Route path="land-records/:id" element={<LandRecordDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="gis-map" element={<GISMapPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="processing-monitor" element={<ProcessingMonitorPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="citizen-requests" element={<CitizenRequestsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
    </Routes>
  );
}