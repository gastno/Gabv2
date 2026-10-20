import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../../services/api";
import { useLanguage } from "../../i18n/LanguageContext";
import "./Header.css";

function Header({ language: languageProp, onLanguageChange }) {
  const languageContext = useLanguage();
  const language = languageProp || languageContext.language;
  const t = languageContext.t;
  const changeLanguage = onLanguageChange || languageContext.setLanguage;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forms State
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  // Helper delay to ensure spinner animation is visible
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Check auth session and cached user details on mount
  useEffect(() => {
    const token = localStorage.getItem("customer_auth_token");

    if (token) {
      checkAuthStatus();
    }
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
    setErrorMessage("");
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
    setErrorMessage("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // API call execution
      const data = await authApi.customerLogin(loginForm.email, loginForm.password);
      
      // Extended delay (1.5 seconds) so the user sees the spinner animation
      await delay(1500);

      const userPayload = data.customer || data.user || data;
      const resolvedName =
        userPayload.full_name ||
        userPayload.fullName ||
        userPayload.name ||
        userPayload.display_name;

      if (resolvedName) {
        localStorage.setItem("customer_auth_user_name", resolvedName);
      }

      setCurrentUser(userPayload);
      setIsAuthModalOpen(false);
      setLoginForm({ email: "", password: "" });
    } catch (err) {
      await delay(800); // Brief pause before showing error
      setErrorMessage(err.message || t("header.loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await authApi.customerRegister({
        full_name: signupForm.fullName,
        email: signupForm.email,
        phone_number: signupForm.phone,
        password: signupForm.password,
        kennitala: "0000000000",
      });

      // Extended delay (1.5 seconds) so the user sees the spinner animation
      await delay(1500);

      localStorage.setItem("customer_auth_user_name", signupForm.fullName);

      const userPayload = data.customer || { full_name: signupForm.fullName, email: signupForm.email };
      setCurrentUser(userPayload);
      setIsAuthModalOpen(false);
      setSignupForm({ fullName: "", email: "", phone: "", password: "" });
    } catch (err) {
      await delay(800);
      setErrorMessage(err.message || t("header.signupError"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customer_auth_token");
    localStorage.removeItem("customer_auth_user_name");
    setCurrentUser(null);
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
              <span className="user-welcome-text">
                {t("header.welcome", { name: getUserDisplayName() })}
              </span>
              <button className="logout-button" onClick={handleLogout}>
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
                onClick={() => {
                  setErrorMessage("");
                  setAuthMode("login");
                }}
              >
                {t("header.loginTab")}
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setErrorMessage("");
                  setAuthMode("signup");
                }}
              >
                {t("header.signupTab")}
              </button>
            </div>

            {errorMessage && (
              <div className="auth-error-banner">
                {errorMessage}
              </div>
            )}

            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="header-auth-form">
                <h2>{t("header.welcomeBack")}</h2>
                <p className="auth-subtitle">{t("header.loginSubtitle")}</p>

                <div className="auth-field">
                  <label>{t("header.email")}</label>
                  <input
                    type="email"
                    required
                    placeholder={t("header.emailPlaceholder")}
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>{t("header.password")}</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="spinner-container">
                      <span className="spinning-circle" />
                      {t("header.loggingIn")}
                    </span>
                  ) : (
                    t("header.loginTab")
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="header-auth-form">
                <h2>{t("header.createAccount")}</h2>
                <p className="auth-subtitle">{t("header.signupSubtitle")}</p>

                <div className="auth-field">
                  <label>{t("header.fullName")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("header.namePlaceholder")}
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>{t("header.email")}</label>
                  <input
                    type="email"
                    required
                    placeholder={t("header.emailPlaceholder")}
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>{t("header.phone")}</label>
                  <input
                    type="tel"
                    required
                    placeholder={t("header.phonePlaceholder")}
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>{t("header.password")}</label>
                  <input
                    type="password"
                    required
                    placeholder={t("header.passwordPlaceholder")}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="spinner-container">
                      <span className="spinning-circle" />
                      {t("header.creating")}
                    </span>
                  ) : (
                    t("header.createAccountButton")
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;