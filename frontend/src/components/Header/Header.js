import React, { useState, useEffect } from "react";
import { authApi } from "../../services/api";
import "./Header.css";

function Header({ language, onLanguageChange }) {
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
    const token = localStorage.getItem("auth_token");
    const cachedName = localStorage.getItem("auth_user_name");

    if (cachedName) {
      setCurrentUser({ full_name: cachedName });
    }

    if (token) {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const data = await authApi.getMe();
      const userPayload = data.user || data.customer || data.data || data;
      
      if (userPayload) {
        const resolvedName =
          userPayload.full_name ||
          userPayload.fullName ||
          userPayload.name ||
          userPayload.display_name;

        if (resolvedName) {
          localStorage.setItem("auth_user_name", resolvedName);
        }

        setCurrentUser(userPayload);
      }
    } catch (err) {
      console.error("Session verification failed:", err);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user_name");
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

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      if (resolvedName) {
        localStorage.setItem("auth_user_name", resolvedName);
      }

      setCurrentUser(userPayload);
      setIsAuthModalOpen(false);
      setLoginForm({ email: "", password: "" });
    } catch (err) {
      await delay(800); // Brief pause before showing error
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
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

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      
      localStorage.setItem("auth_user_name", signupForm.fullName);

      const userPayload = data.customer || { full_name: signupForm.fullName, email: signupForm.email };
      setCurrentUser(userPayload);
      setIsAuthModalOpen(false);
      setSignupForm({ fullName: "", email: "", phone: "", password: "" });
    } catch (err) {
      await delay(800);
      setErrorMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user_name");
    setCurrentUser(null);
  };

  const getUserDisplayName = () => {
    if (!currentUser) return "";
    return (
      currentUser.full_name ||
      currentUser.fullName ||
      currentUser.name ||
      currentUser.display_name ||
      localStorage.getItem("auth_user_name") ||
      "User"
    );
  };

  return (
    <>
      <header className="main-header">
        <div className="logo-space">LOGO</div>

        <div className="spacer" />

        <div className="controls">
          {currentUser ? (
            <div className="user-profile-controls">
              <span className="user-welcome-text">
                Welcome, {getUserDisplayName()}!
              </span>
              <button className="logout-button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <button 
              className="login-button" 
              onClick={() => handleOpenModal("login")}
            >
              Log in
            </button>
          )}

          <select
            value={language}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="language-dropdown"
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
                Log In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setErrorMessage("");
                  setAuthMode("signup");
                }}
              >
                Sign Up
              </button>
            </div>

            {errorMessage && (
              <div className="auth-error-banner">
                {errorMessage}
              </div>
            )}

            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="header-auth-form">
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Log in to view and manage your appointments</p>

                <div className="auth-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>Password</label>
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
                      Logging in...
                    </span>
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="header-auth-form">
                <h2>Create an Account</h2>
                <p className="auth-subtitle">Save your information for faster future bookings</p>

                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guðrún Jónsdóttir"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 123 4567"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Create a password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="spinner-container">
                      <span className="spinning-circle" />
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
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