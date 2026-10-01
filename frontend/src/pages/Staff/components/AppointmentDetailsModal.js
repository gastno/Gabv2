import React from "react";
import { STATUS_TRANSITIONS } from "../staffCalendarUtils";

function AppointmentDetailsModal({
  appointment,
  onClose,
  onCancel,
  onSaveStatus,
  statusEditMode,
  setStatusEditMode,
  statusDraft,
  setStatusDraft,
  error,
  saving,
  formatDate,
}) {
  if (!appointment) return null;
  const allowedStatuses = STATUS_TRANSITIONS[appointment.status] || [];

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div className="staff-modal-box appointment-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="staff-modal-close" onClick={onClose} aria-label="Close appointment details">
          ×
        </button>
        <p className="modal-eyebrow">Appointment</p>
        <h2>{appointment.clientName}</h2>
        <p className="staff-modal-subtitle">
          {formatDate(appointment.dateKey)} · {appointment.displayTime}–{appointment.displayEndTime}
        </p>

        <div className="appointment-detail-list">
          <div><span>Service</span><strong>{appointment.service}</strong></div>
          <div><span>Phone</span><strong>{appointment.phone}</strong></div>
          <div><span>Price</span><strong>{appointment.price}</strong></div>
          <div>
            <span>Status</span>
            <strong className={`status-text status-${appointment.status}`}>
              {appointment.status.replace("_", " ")}
            </strong>
          </div>
        </div>

        {statusEditMode ? (
          <form className="appointment-status-form" onSubmit={onSaveStatus}>
            <label htmlFor="appointment-status">Appointment status</label>
            <select id="appointment-status" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
              {allowedStatuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
            </select>
            {error && <p className="staff-error-message" role="alert">{error}</p>}
            <div className="modal-actions-row">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? "Saving..." : "Save status"}
              </button>
              <button type="button" className="secondary-modal-btn" onClick={() => setStatusEditMode(false)}>
                Back
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-actions-row appointment-modal-actions">
            {allowedStatuses.length > 0 && (
              <button
                type="button"
                className="edit-toggle-btn"
                onClick={() => {
                  setStatusDraft(allowedStatuses[0]);
                  setStatusEditMode(true);
                }}
              >
                Edit status
              </button>
            )}
            {["pending", "confirmed"].includes(appointment.status) && (
              <button type="button" className="cancel-appt-btn" onClick={onCancel} disabled={saving}>
                Cancel appointment
              </button>
            )}
          </div>
        )}
        {!statusEditMode && error && <p className="staff-error-message" role="alert">{error}</p>}
      </div>
    </div>
  );
}

export default AppointmentDetailsModal;