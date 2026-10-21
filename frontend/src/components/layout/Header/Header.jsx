import React, { Suspense, lazy, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../../services/api";
import {
  clearCustomerSession,
  getCustomerSessionEventName,
  requestClerkSignOut,
} from "../../../services/customerSession";
import { useLanguage } from "../../i18n/LanguageContext";
import "./Header.css";

const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const ClerkAuthForm = lazy(() => import("./ClerkAuthForm"));

function Header({ language: languageProp, onLanguageChange }) {
  const languageContext = useLanguage();
  const language = languageProp || languageContext.language;
  const t = languageContext.t;
  const changeLanguage = onLanguageChange || languageContext.setLanguage;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [logoutError, setLogoutError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const customerReturnTo = window.location.pathname.startsWith("/customer/")
    ? "/"
    : currentPath;
  const authSearch = `?returnTo=${encodeURIComponent(customerReturnTo || "/")}`;
  const customerSignInUrl = `/customer/sign-in${authSearch}`;
  const customerSignUpUrl = `/customer/sign-up${authSearch}`;

  // Check auth session and cached user details on mount
  useEffect(() => {
    const token = localStorage.getItem("customer_auth_token");

    if (token) {
      checkAuthStatus();
    }
  }, []);

  useEffect(() => {
    const handleSessionChange = (event) => {
      setCurrentUser(event.detail?.customer || null);
    };
    const eventName = getCustomerSessionEventName();
    window.addEventListener(eventName, handleSessionChange);
    return () => window.removeEventListener(eventName, handleSessionChange);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const data = await authApi.getMe();
      const userPayload = data.user || data.customer || data.data || data;
      if (userPayload.type !== "customer" && userPayload.role !== "customer") {
        throw new Error("A customer account is required.");
      }
      
      if (userPayload) {
        const resolvedName =
          userPayload.full_name ||
          userPayload.fullName ||
          userPayload.name ||
          userPayload.display_name;

        if (resolvedName) {
          localStorage.setItem("customer_auth_user_name", resolvedName);
        }

        setCurrentUser(userPayload);
      }
    } catch (err) {
      console.error("Session verification failed:", err);
      localStorage.removeItem("customer_auth_token");
      localStorage.removeItem("customer_auth_user_name");
      setCurrentUser(null);
    }
  };

  const handleOpenModal = (mode = "login") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    setLogoutError("");
    setLoading(true);
    try {
      if (clerkPublishableKey) await requestClerkSignOut();
      clearCustomerSession();
      setCurrentUser(null);
    } catch (error) {
      setLogoutError(error.message || t("header.logoutError"));
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (!currentUser) return "";
    return (
      currentUser.full_name ||
      currentUser.fullName ||
      currentUser.name ||
      currentUser.display_name ||
      localStorage.getItem("customer_auth_user_name") ||
      "User"
    );
  };

  return (
    <>
      <header className="main-header">
        <Link to="/" className="logo-space">
          <span>gbb &amp; co</span>
        </Link>

        <div className="spacer" />

        <div className="controls">
          {currentUser ? (
            <div className="user-profile-controls">
              {logoutError && <span role="alert" className="header-session-error">{logoutError}</span>}
              <span className="user-welcome-text">
                {t("header.welcome", { name: getUserDisplayName() })}
              </span>
              <button className="logout-button" onClick={handleLogout} disabled={loading}>
                {t("header.logout")}
              </button>
            </div>
          ) : (
            <button 
              className="login-button" 
              onClick={() => handleOpenModal("login")}
            >
              {t("header.login")}
            </button>
          )}

          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-dropdown"
            aria-label={t("header.language")}
          >
            <option value="en">English</option>
            <option value="is">Íslenska</option>
          </select>
        </div>
      </header>

      {/* AUTH POPUP MODAL */}
      {isAuthModalOpen && (
        <div className="header-auth-backdrop" onClick={handleCloseModal}>
          <div className="header-auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sticky-header">
              <button 
                type="button" 
                className="header-auth-close" 
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="header-auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authMode === "login" ? "active" : ""}`}
                onClick={() => setAuthMode("login")}
              >
                {t("header.loginTab")}
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === "signup" ? "active" : ""}`}
                onClick={() => setAuthMode("signup")}
              >
                {t("header.signupTab")}
              </button>
            </div>

            {!clerkPublishableKey ? (
              <p role="alert" className="header-clerk-config-error">
                {t("customerSignIn.notConfigured")}
              </p>
            ) : (
              <Suspense fallback={null}>
                <ClerkAuthForm
                  authMode={authMode}
                  customerSignInUrl={customerSignInUrl}
                  customerSignUpUrl={customerSignUpUrl}
                  t={t}
                />
              </Suspense>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;