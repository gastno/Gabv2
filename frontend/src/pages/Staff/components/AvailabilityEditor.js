import React from "react";

function AvailabilityEditor({
  dateKey,
  availabilityDraft,
  onDateChange,
  onAddShift,
  onUpdateShift,
  onRemoveShift,
  onSaveAvailability,
  availabilityError,
  availabilitySaving,
  unavailability,
  unavailabilityDraft,
  onUpdateUnavailabilityDraft,
  onAddUnavailability,
  onRemoveUnavailability,
  unavailabilityError,
  unavailabilitySaving,
  formatDate,
  formatTime,
}) {
  return (
    <section className="availability-workspace">
      <form className="availability-editor" onSubmit={onSaveAvailability}>
        <div className="availability-section-heading">
          <div>
            <h2>Available hours for this day</h2>
            <p>These hours apply only to the selected date.</p>
          </div>
          <button type="submit" className="save-btn" disabled={availabilitySaving}>
            {availabilitySaving ? "Saving..." : "Save hours"}
          </button>
        </div>

        <label className="availability-date-picker">
          <span>Date</span>
          <input type="date" value={dateKey} onChange={(event) => onDateChange(event.target.value)} />
        </label>
        {availabilityError && <p className="staff-error-message" role="alert">{availabilityError}</p>}
        <div className="date-availability-list">
          {availabilityDraft.map((shift) => (
            <div className="schedule-shift-fields" key={shift.key}>
              <label>
                <span>From</span>
                <input
                  type="time"
                  value={shift.start_time}
                  onChange={(event) => onUpdateShift(shift.key, "start_time", event.target.value)}
                  required
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="time"
                  value={shift.end_time}
                  onChange={(event) => onUpdateShift(shift.key, "end_time", event.target.value)}
                  required
                />
              </label>
              <button
                type="button"
                className="remove-shift-btn"
                onClick={() => onRemoveShift(shift.key)}
                aria-label="Remove available time"
              >
                ×
              </button>
            </div>
          ))}
          {!availabilityDraft.length && <p className="no-shift-label">No available hours set for this date.</p>}
        </div>
        <button type="button" className="add-shift-btn" onClick={onAddShift}>
          + Add time range
        </button>
      </form>

      <section className="unavailability-editor">
        <div className="availability-section-heading">
          <div>
            <h2>Unavailable time</h2>
            <p>Block a specific period from bookings.</p>
          </div>
        </div>
        <form className="unavailability-form" onSubmit={onAddUnavailability}>
          <label>
            <span>Start date</span>
            <input type="date" value={unavailabilityDraft.startDate} onChange={(event) => onUpdateUnavailabilityDraft("startDate", event.target.value)} required />
          </label>
          <label>
            <span>Start time</span>
            <input type="time" value={unavailabilityDraft.startTime} onChange={(event) => onUpdateUnavailabilityDraft("startTime", event.target.value)} required />
          </label>
          <label>
            <span>End date</span>
            <input type="date" value={unavailabilityDraft.endDate} onChange={(event) => onUpdateUnavailabilityDraft("endDate", event.target.value)} required />
          </label>
          <label>
            <span>End time</span>
            <input type="time" value={unavailabilityDraft.endTime} onChange={(event) => onUpdateUnavailabilityDraft("endTime", event.target.value)} required />
          </label>
          <label className="unavailability-reason-field">
            <span>Reason (optional)</span>
            <input type="text" maxLength="255" value={unavailabilityDraft.reason} onChange={(event) => onUpdateUnavailabilityDraft("reason", event.target.value)} />
          </label>
          <button type="submit" className="save-btn" disabled={unavailabilitySaving}>
            {unavailabilitySaving ? "Saving..." : "Add unavailable time"}
          </button>
        </form>
        {unavailabilityError && <p className="staff-error-message" role="alert">{unavailabilityError}</p>}
        <div className="unavailability-list">
          {unavailability.map((period) => (
            <div className="unavailability-list-row" key={period.id}>
              <div>
                <strong>{formatDate(period.block_start)}</strong>
                <span>{formatTime(period.block_start)}–{formatTime(period.block_end)}</span>
                {period.reason && <small>{period.reason}</small>}
              </div>
              <button type="button" className="remove-unavailability-btn" onClick={() => onRemoveUnavailability(period.id)}>
                Remove
              </button>
            </div>
          ))}
          {!unavailability.length && <p className="staff-empty-state">No upcoming unavailable periods.</p>}
        </div>
      </section>
    </section>
  );
}

export default AvailabilityEditor;