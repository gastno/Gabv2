import React from "react";
import { STATUS_TRANSITIONS } from "../staffCalendarUtils";

function AppointmentDetailsModal({
  appointment,
  onClose,
  onSaveStatus,
  statusEditMode,
  setStatusEditMode,
  statusDraft,
  setStatusDraft,
  feeStatusDraft,
  setFeeStatusDraft,
  cancellationReason,
  setCancellationReason,
  error,
  saving,
  formatDate,
}) {
  if (!appointment) return null;
  const feeStatuses = ["none", "awaiting_fee", "fee_charged", "fee_waived"];
  const transitions = STATUS_TRANSITIONS[appointment.status] || [];
  const allowedStatuses = [...new Set([
    appointment.status,
    ...transitions,
    ...(["pending", "confirmed"].includes(appointment.status) ? ["cancelled"] : []),
  ])];
  const canEditStatus = transitions.length > 0 || ["pending", "confirmed"].includes(appointment.status);
  const formatStatus = (status) => status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

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
          <div><span>👤 Customer</span><strong>{appointment.clientName}</strong></div>
          <div><span>✂️ Service</span><strong>{appointment.service}</strong></div>
          <div><span>📞 Phone</span><strong>{appointment.phone}</strong></div>
          <div><span>✉️ Email</span><strong>{appointment.email || "Unavailable"}</strong></div>
          <div><span>🪪 Kennitala</span><strong>{appointment.kennitala || "Unavailable"}</strong></div>
          <div><span>💰 Price</span><strong>{appointment.price}</strong></div>
          <div><span>💳 Fee status</span><strong>{formatStatus(appointment.fee_status || "unknown")}</strong></div>
          <div>
            <span>📋 Status</span>
            <strong className={`status-text status-${appointment.status}`}>
              {formatStatus(appointment.status)}
            </strong>
          </div>
        </div>

        {statusEditMode ? (
          <form className="appointment-status-form" onSubmit={onSaveStatus}>
            <label htmlFor="appointment-status">Appointment status</label>
            <select id="appointment-status" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
              {allowedStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
            <label htmlFor="appointment-fee-status">💳 Fee status</label>
            <select
              id="appointment-fee-status"
              value={feeStatusDraft}
              onChange={(event) => setFeeStatusDraft(event.target.value)}
            >
              {feeStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
            {statusDraft === "cancelled" && (
              <label htmlFor="cancellation-reason">
                Cancellation reason
                <textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(event) => setCancellationReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </label>
            )}
            {error && <p className="staff-error-message" role="alert">{error}</p>}
            <div className="modal-actions-row">
              <button
                type="submit"
                className="save-btn"
                disabled={saving || (
                  statusDraft === appointment.status
                  && feeStatusDraft === (appointment.fee_status || "none")
                )}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="secondary-modal-btn" onClick={() => setStatusEditMode(false)}>
                Back
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-actions-row appointment-modal-actions">
            {canEditStatus && (
              <button
                type="button"
                className="edit-toggle-btn"
                onClick={() => {
                  setStatusDraft(appointment.status);
                  setStatusEditMode(true);
                }}
              >
                Edit status
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