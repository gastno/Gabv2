import React, { useState } from "react";
import { formatStudioDate, getStudioDateKey, formatStudioTime } from "../staffCalendarUtils";

function CalendarBlockModal({
  modal,
  onClose,
  onSave,
  onDelete,
  saving,
  error,
}) {
  const period = modal.type === "unavailable" ? modal.block.period : null;
  const availability = modal.type === "available" ? modal.block.availability : null;
  const isNewBlock = modal.type === "add";
  const dateKey = modal.dateKey;
  const [newBlockType, setNewBlockType] = useState("available");
  const [form, setForm] = useState(() => ({
    startDate: period ? getStudioDateKey(period.block_start) : dateKey,
    startTime: period ? formatStudioTime(period.block_start) : availability?.start_time?.slice(0, 5) || "09:00",
    endDate: period ? getStudioDateKey(period.block_end) : dateKey,
    endTime: period ? formatStudioTime(period.block_end) : availability?.end_time?.slice(0, 5) || "17:00",
    reason: period?.reason || "",
  }));
  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ ...form, blockType: isNewBlock ? newBlockType : modal.type });
  };

  const isUnavailable = Boolean(period) || (isNewBlock && newBlockType === "unavailable");
  const isEditing = Boolean(availability || period);
  const title = isUnavailable
    ? isEditing ? "Edit unavailable time" : "Add unavailable time"
    : availability
      ? "Edit available hours"
      : "Add availability";

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div className="staff-modal-box calendar-block-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="staff-modal-close" onClick={onClose} aria-label="Close time block editor">
          ×
        </button>
        <p className="modal-eyebrow">{formatStudioDate(dateKey)}</p>
        <h2>{title}</h2>
        {!isUnavailable && (
          <p className="staff-modal-subtitle">
            {availability
              ? "This interval applies only to this date."
              : `These hours apply only to ${formatStudioDate(dateKey, { day: "numeric", month: "long", year: "numeric" })}.`}
          </p>
        )}

        <form className="staff-edit-form" onSubmit={handleSubmit}>
          {isNewBlock && (
            <div className="calendar-block-kind" role="group" aria-label="Time block type">
              <button
                type="button"
                className={newBlockType === "available" ? "active" : ""}
                aria-pressed={newBlockType === "available"}
                onClick={() => setNewBlockType("available")}
              >
                Available
              </button>
              <button
                type="button"
                className={newBlockType === "unavailable" ? "active" : ""}
                aria-pressed={newBlockType === "unavailable"}
                onClick={() => setNewBlockType("unavailable")}
              >
                Unavailable
              </button>
            </div>
          )}
          {isUnavailable && (
            <>
              <label className="calendar-modal-field">
                <span>Start date</span>
                <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required />
              </label>
              <label className="calendar-modal-field">
                <span>End date</span>
                <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required />
              </label>
            </>
          )}
          <label className="calendar-modal-field">
            <span>{isUnavailable ? "Start time" : "From"}</span>
            <input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required />
          </label>
          <label className="calendar-modal-field">
            <span>{isUnavailable ? "End time" : "To"}</span>
            <input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required />
          </label>
          {isUnavailable && (
            <label className="calendar-modal-field">
              <span>Reason (optional)</span>
              <input type="text" maxLength="255" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            </label>
          )}
          {error && <p className="staff-error-message" role="alert">{error}</p>}
          <div className="modal-actions-row">
            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : isEditing ? "Save changes" : isUnavailable ? "Add unavailable time" : "Save available time"}
            </button>
            {isEditing && (
              <button type="button" className="cancel-appt-btn" onClick={onDelete} disabled={saving}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarBlockModal;