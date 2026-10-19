import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import GabbabluPage from "./pages/GabbabluPage";
import AmorTattooPage from "./pages/AmorTattooPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookieSettingsPage from "./pages/CookieSettingsPage";

// Protected Route Guard with Defensive Checks
const ProtectedRoute = ({ children, requiredRole }) => {
  const role = localStorage.getItem("staff_role");
  const token = localStorage.getItem("staff_auth_token")
    || (role ? localStorage.getItem("auth_token") : null);

  // 1. If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/staff-login" replace />;
  }

  // 2. Validate role permission safely
  if (requiredRole) {
    const isAdmin = role === "admin" || role === "super_admin";

    if (requiredRole === "admin" && !isAdmin) {
      return <Navigate to="/staff" replace />;
    }

    if (requiredRole === "staff" && role !== "staff" && !isAdmin) {
      return <Navigate to="/staff-login" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Public Pages */}
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route 
          path="/studios/gabbablu" 
          element={<GabbabluPage />}
        />
        <Route
          path="/studios/amortattoo"
          element={<AmorTattooPage />}
        />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/cookie-settings" element={<CookieSettingsPage />} />

        {/* Staff & Admin Authentication */}
        <Route 
          path="/staff-login" 
          element={<StaffLoginPage />}
        />

        {/* Protected Staff Route */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;