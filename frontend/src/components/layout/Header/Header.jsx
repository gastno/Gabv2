import React, { Suspense, lazy, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authApi, notificationApi } from "../../../services/api";
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
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

  useEffect(() => {
    let active = true;
    if (!currentUser || !localStorage.getItem("customer_auth_token")) {
      setNotificationItems([]);
      setUnreadCount(0);
      return () => { active = false; };
    }

    setNotificationLoading(true);
    notificationApi.list()
      .then((data) => {
        if (!active) return;
        setNotificationItems(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
        setNotificationError("");
      })
      .catch((error) => {
        if (active) setNotificationError(error.message || "Could not load notifications.");
      })
      .finally(() => {
        if (active) setNotificationLoading(false);
      });
    return () => { active = false; };
  }, [currentUser]);

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

  const markNotificationRead = async (notificationId) => {
    setNotificationError("");
    try {
      const result = await notificationApi.markRead([notificationId]);
      setNotificationItems(items => items.map(item => (
        String(item.id) === String(notificationId) ? { ...item, is_read: true } : item
      )));
      setUnreadCount(Number(result.unread_count || 0));
    } catch (error) {
      setNotificationError(error.message || "Could not mark notification as read.");
    }
  };

  const markAllNotificationsRead = async () => {
    setNotificationError("");
    try {
      const result = await notificationApi.markAllRead();
      setNotificationItems(items => items.map(item => ({ ...item, is_read: true })));
      setUnreadCount(Number(result.unread_count || 0));
    } catch (error) {
      setNotificationError(error.message || "Could not mark notifications as read.");
    }
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
              <Link className="customer-account-link" to="/customer/account">
                My appointments
              </Link>
              <div className="header-notification-menu">
                <button
                  type="button"
                  className="header-notification-toggle"
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={notificationOpen}
                  aria-haspopup="true"
                  onClick={() => setNotificationOpen(open => !open)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="header-notification-count">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <section className="header-notification-dropdown" aria-label="Notifications">
                    <div className="header-notification-heading">
                      <h2>Notifications</h2>
                      {unreadCount > 0 && (
                        <button type="button" onClick={markAllNotificationsRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notificationError && (
                      <p role="alert" className="header-notification-error">{notificationError}</p>
                    )}
                    {notificationLoading ? (
                      <p role="status" className="header-notification-empty">Loading notifications…</p>
                    ) : notificationItems.length === 0 ? (
                      <p className="header-notification-empty">You’re all caught up.</p>
                    ) : (
                      <ul>
                        {notificationItems.slice(0, 6).map((notification) => {
                          const title = notification.notification_type === "reminder_24h"
                            ? "Appointment reminder"
                            : `Appointment ${notification.next_status || "updated"}`;
                          return (
                            <li key={notification.id} className={notification.is_read ? "is-read" : "is-unread"}>
                              <button
                                type="button"
                                onClick={() => markNotificationRead(notification.id)}
                                disabled={notification.is_read}
                                aria-label={notification.is_read ? title : `Mark ${title} as read`}
                              >
                                <strong>{title}</strong>
                                <span>{notification.service_name || "Appointment"} · {notification.delivery_status}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Link to="/customer/account" onClick={() => setNotificationOpen(false)}>
                      View notification history
                    </Link>
                  </section>
                )}
              </div>
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