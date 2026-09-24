import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import Admin from "./pages/Admin/Admin";
import Staff from "./pages/Staff/Staff";
import StaffLogin from "./pages/StaffLogin/StaffLogin";
import Gabbablu from "./pages/Gabbablu/Gabbablu";

// Protected Route Guard with Defensive Checks
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("auth_token");
  const role = localStorage.getItem("staff_role");

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
  const [language, setLanguage] = useState("en");

  return (
    <Router>
      <Routes>
        {/* Customer Public Pages */}
        <Route
          path="/"
          element={<Home language={language} setLanguage={setLanguage} />}
        />
        <Route 
          path="/studios/gabbablu" 
          element={<Gabbablu />} 
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
              <Admin />
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