import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ClerkProvider, HandleSSOCallback } from "@clerk/react";
import CustomerClerkSignOutBridge from "./components/auth/CustomerClerkSignOutBridge";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import GabbabluPage from "./pages/GabbabluPage";
import AmorTattooPage from "./pages/AmorTattooPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookieSettingsPage from "./pages/CookieSettingsPage";
import CustomerSignInPage from "./pages/CustomerSignInPage";
import { LanguageProvider } from "./components/i18n/LanguageContext";

const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const ProtectedRoute = ({ children, requiredRole }) => {
  const role = localStorage.getItem("staff_role");
  const token = localStorage.getItem("staff_auth_token")
    || (role ? localStorage.getItem("auth_token") : null);

  if (!token) {
    return <Navigate to="/staff-login" replace />;
  }

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

function CustomerSSOCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const customerSignInUrl = `/customer/sign-in${location.search}`;
  const customerSignUpUrl = `/customer/sign-up${location.search}`;

  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        const url = decorateUrl(customerSignInUrl);
        if (url.startsWith("http")) {
          window.location.assign(url);
        } else {
          navigate(url, { replace: true });
        }
      }}
      navigateToSignIn={() => navigate(customerSignInUrl, { replace: true })}
      navigateToSignUp={() => navigate(customerSignUpUrl, { replace: true })}
    />
  );
}

function App() {
  const routes = (
    <LanguageProvider>
      <Router>
        {clerkPublishableKey && <CustomerClerkSignOutBridge />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/studios/gabbablu" element={<GabbabluPage />} />
          <Route path="/studios/amortattoo" element={<AmorTattooPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/cookie-settings" element={<CookieSettingsPage />} />
          <Route path="/customer/sign-in" element={<CustomerSignInPage />} />
          <Route path="/customer/sign-up" element={<CustomerSignInPage />} />
          {clerkPublishableKey && (
            <Route
              path="/sso-callback"
              element={<CustomerSSOCallback />}
            />
          )}
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );

  return clerkPublishableKey
    ? <ClerkProvider publishableKey={clerkPublishableKey}>{routes}</ClerkProvider>
    : routes;
}

export default App;
