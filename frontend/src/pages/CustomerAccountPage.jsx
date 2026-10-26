import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerLayout from "../components/layout/CustomerLayout/CustomerLayout";
import { apptApi, notificationApi } from "../services/api";
import "./CustomerAccountPage.css";

const formatDate = value => {
  if (!value) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IS", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Atlantic/Reykjavik",
  }).format(new Date(value));
};

function CustomerAccountPage({ previousOnly = false }) {
  const hasToken = Boolean(localStorage.getItem("customer_auth_token"));
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [error, setError] = useState("");
  const [preferenceMessage, setPreferenceMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!hasToken) {
      setLoading(false);
      return () => { active = false; };
    }

    Promise.all([
      apptApi.listCustomerAppointments({ period: previousOnly ? "previous" : "upcoming" }),
      ...(previousOnly ? [] : [notificationApi.getPreferences(), notificationApi.list()]),
    ]).then(([appointmentData, preferenceData, notificationData]) => {
      if (!active) return;
      setAppointments(appointmentData.appointments || []);
      if (!previousOnly) {
        setEmailEnabled(Boolean(preferenceData.preferences?.email_enabled));
        setNotifications(notificationData.notifications || []);
      }
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Could not load your account information.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [hasToken, previousOnly]);

  const savePreference = async (event) => {
    event.preventDefault();
    setSavingPreference(true);
    setPreferenceMessage("");
    setError("");
    try {
      const result = await notificationApi.updatePreferences({ email_enabled: emailEnabled });
      setEmailEnabled(Boolean(result.preferences?.email_enabled));
      setPreferenceMessage("Your email preference has been saved.");
    } catch (requestError) {
      setError(requestError.message || "Could not save your email preference.");
    } finally {
      setSavingPreference(false);
    }
  };

  return (
    <CustomerLayout pageClassName="customer-account-page">
      <main className="customer-account-content">
        <header className="customer-account-heading">
          <h1>{previousOnly ? "Previous appointments" : "Upcoming appointments"}</h1>
          <p>
            {previousOnly
              ? "Appointments that have already taken place."
              : "Review upcoming bookings and choose whether to receive appointment emails."}
          </p>
        </header>

        {!hasToken ? (
          <section className="customer-account-message">
            <h2>Sign in to view your account</h2>
            <p>Appointment history and notification preferences are available to registered customers.</p>
            <Link
              to={`/customer/sign-in?returnTo=${encodeURIComponent(
                previousOnly ? "/customer/appointments/previous" : "/customer/account"
              )}`}
              className="customer-account-action"
            >
              Sign in
            </Link>
          </section>
        ) : loading ? (
          <p role="status" className="customer-account-message">Loading your account…</p>
        ) : error ? (
          <p role="alert" className="customer-account-error">
            {error}{" "}
            {error.toLowerCase().includes("token") && (
              <Link to="/customer/sign-in?returnTo=%2Fcustomer%2Faccount">Sign in again</Link>
            )}
          </p>
        ) : (
          <>
            <section className="customer-account-section" aria-labelledby="appointment-history-title">
              <h2 id="appointment-history-title">
                {previousOnly ? "Past visits" : "Booking history"}
              </h2>
              {!previousOnly && (
                <p className="customer-account-previous-link">
                  <Link to="/customer/appointments/previous">View previous appointments</Link>
                </p>
              )}
              {appointments.length === 0 ? (
                <p className="customer-account-empty">No appointments are associated with this account yet.</p>
              ) : (
                <ul className="customer-appointment-list">
                  {appointments.map((appointment) => (
                    <li key={appointment.id} className="customer-appointment">
                      <div>
                        <h3>{appointment.service_name || "Appointment"}</h3>
                        <p>{appointment.brand_name || "Studio"} · {formatDate(appointment.start_time)}</p>
                      </div>
                      <div className="customer-appointment-details">
                        <span className={`customer-appointment-status status-${appointment.status}`}>
                          {appointment.status}
                        </span>
                        <strong>
                          {Number(appointment.price_snapshot_isk || 0).toLocaleString("is-IS")} kr
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {previousOnly ? (
              <p className="customer-account-previous-link">
                <Link to="/customer/account">Back to your account</Link>
              </p>
            ) : (
              <>
                <section className="customer-account-section" aria-labelledby="notification-settings-title">
                  <h2 id="notification-settings-title">Email notifications</h2>
                  <p>Allow email updates when your appointment status changes and a reminder before an upcoming visit.</p>
                  <form className="customer-notification-preference" onSubmit={savePreference}>
                    <label>
                      <input
                        type="checkbox"
                        checked={emailEnabled}
                        onChange={(event) => setEmailEnabled(event.target.checked)}
                        disabled={savingPreference}
                      />
                      Receive appointment emails
                    </label>
                    <button type="submit" disabled={savingPreference}>
                      {savingPreference ? "Saving…" : "Save preference"}
                    </button>
                  </form>
                  {preferenceMessage && <p role="status" className="customer-account-success">{preferenceMessage}</p>}
                </section>

                <section className="customer-account-section" aria-labelledby="notification-history-title">
                  <h2 id="notification-history-title">Notification history</h2>
                  {notifications.length === 0 ? (
                    <p className="customer-account-empty">No appointment notifications yet.</p>
                  ) : (
                    <ul className="customer-notification-list">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`customer-notification ${notification.is_read ? "is-read" : "is-unread"}`}
                        >
                          <div>
                            <h3>
                              {notification.notification_type === "reminder_24h"
                                ? "Appointment reminder"
                                : `Appointment ${notification.next_status || "updated"}`}
                            </h3>
                            <p>
                              {notification.service_name || "Appointment"} · {formatDate(notification.start_time)}
                            </p>
                            {notification.last_error && <p className="customer-notification-note">{notification.last_error}</p>}
                          </div>
                          <span className={`customer-notification-status status-${notification.delivery_status}`}>
                            {notification.delivery_status}
                          </span>
                          <span className="customer-notification-read-status">
                            {notification.is_read ? "Read" : "Unread"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </CustomerLayout>
  );
}

export default CustomerAccountPage;
