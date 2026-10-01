import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import AdminDashboard from "./pages/Admin/Admin";
import Staff from "./pages/Staff/StaffPortal";
import StaffLogin from "./pages/StaffLogin/StaffLogin";
import Gabbablu from "./pages/Gabbablu/Gabbablu";
import AmorTattoo from "./pages/AmorTattoo/AmorTattoo";

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
          element={<Home />}
        />
        <Route 
          path="/studios/gabbablu" 
          element={<Gabbablu />} 
        />
        <Route
          path="/studios/amortattoo"
          element={<AmorTattoo />}
        />

        {/* Staff & Admin Authentication */}
        <Route 
          path="/staff-login" 
          element={<StaffLogin />} 
        />

        {/* Protected Staff Route */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredRole="staff">
              <Staff />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
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