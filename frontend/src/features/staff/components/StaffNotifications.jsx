import React, { useCallback, useEffect, useState } from "react";
import { staffNotificationApi } from "../../../services/api";

function formatBookingTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Appointment time unavailable";
  return new Intl.DateTimeFormat("en-IS", {
    timeZone: "Atlantic/Reykjavik",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StaffNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      const result = await staffNotificationApi.list();
      setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
      setUnreadCount(Number(result.unread_count) || 0);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load notifications.");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const markRead = async (id) => {
    try {
      const result = await staffNotificationApi.markRead([id]);
      setNotifications((current) => current.map((item) => (
        String(item.id) === String(id) ? { ...item, is_read: true } : item
      )));
      setUnreadCount(Number(result.unread_count) || 0);
      setError("");
    } catch (markError) {
      setError(markError.message || "Could not mark notification as read.");
    }
  };

  const markAllRead = async () => {
    try {
      const result = await staffNotificationApi.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(Number(result.unread_count) || 0);
      setError("");
    } catch (markError) {
      setError(markError.message || "Could not mark notifications as read.");
    }
  };

  return (
    <div className="staff-notifications">
      <button
        type="button"
        className="staff-notification-trigger"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={isOpen}
        aria-controls="staff-notification-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="staff-notification-count" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <section id="staff-notification-panel" className="staff-notification-panel" aria-label="Notifications">
          <div className="staff-notification-panel-heading">
            <h2>Notifications</h2>
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </button>
          </div>
          {error && (
            <div className="staff-notification-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={loadNotifications}>Retry</button>
            </div>
          )}
          {notifications.length === 0 ? (
            <p className="staff-notification-empty">No service bookings yet.</p>
          ) : (
            <ul className="staff-notification-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={`staff-notification-item ${notification.is_read ? "is-read" : "is-unread"}`}
                    onClick={() => {
                      if (!notification.is_read) markRead(notification.id);
                    }}
                  >
                    <span className="staff-notification-item-title">
                      New booking · {notification.service_name || "Service"}
                    </span>
                    <span>{notification.brand_name || "Studio"}</span>
                    <time dateTime={notification.start_time}>{formatBookingTime(notification.start_time)}</time>
                    {!notification.is_read && <span className="staff-notification-unread-label">Unread</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default StaffNotifications;
