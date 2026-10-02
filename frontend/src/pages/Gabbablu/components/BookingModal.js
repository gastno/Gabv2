import { useEffect, useMemo, useState } from "react";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";
import { apptApi, staffServiceApi } from "../../../services/api";
import { toTeamMember } from "../studioData";
import {
  formatStudioDate,
  formatStudioTime,
  getMonthCells,
  getStudioDateKey,
  pickTimeOptions,
  shiftMonth,
} from "./scheduleAvailability";

const BOOKING_STEPS = ["Specialist", "Date & time", "Account", "Your details"];
const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];


function SpecialistStep({ service, employees, isLoading, onSelect }) {
  return (
    <div className="modal-step" key="specialist">
      <h2>Choose an employee</h2>
      <p className="modal-subtitle">
        Service: {service.name} (⏱ {service.duration})
      </p>
      <div className="employee-selection-list">
        {isLoading ? (
          <p className="placeholder-message">Loading available team members...</p>
        ) : employees.length === 0 ? (
          <p className="placeholder-message">No team members are assigned to this service yet.</p>
        ) : employees.map((employee) => (
          <button
            type="button"
            key={employee.id}
            className="employee-option-card"
            onClick={() => onSelect(employee)}
          >
            <span className="employee-avatar">
              <UserAvatar src={employee.img} alt={employee.name} />
            </span>
            <div className="employee-info">
              <h4>{employee.name}</h4>
              <p>{employee.title}</p>
            </div>
            <span className="select-arrow" aria-hidden="true">❯</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScheduleStep({
  service,
  employee,
  monthLabel,
  canGoPrevMonth,
  onPrevMonth,
  onNextMonth,
  calendarCells,
  selectedDateKey,
  onDateSelect,
  isLoadingAvailability,
  availabilityError,
  selectedDateLabel,
  timeOptions,
  selectedSlot,
  onTimeSelect,
  onNext,
}) {
  return (
    <div className="modal-step" key="schedule">
      <h2>Select Date &amp; Time</h2>
      <p className="modal-subtitle">{service.name} with {employee?.name}</p>
      <div className="calendar-container">
        <div className="calendar-header">
          <button type="button" className="calendar-nav-btn" onClick={onPrevMonth} disabled={!canGoPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <span className="calendar-month-title">{monthLabel}</span>
          <button type="button" className="calendar-nav-btn" onClick={onNextMonth} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="calendar-weekdays">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="calendar-days-grid">
          {calendarCells.map((day, index) => (
            day ? (
              <button
                key={day.dateKey}
                type="button"
                disabled={!day.isAvailable}
                className={`calendar-day-cell ${day.isAvailable ? "available" : "disabled"} ${selectedDateKey === day.dateKey ? "selected" : ""}`}
                onClick={() => onDateSelect(day.dateKey)}
              >
                {day.day}
              </button>
            ) : (
              <span key={`empty-${index}`} className="calendar-day-cell-empty" aria-hidden="true" />
            )
          ))}
        </div>
        {isLoadingAvailability && <p className="placeholder-message">Checking availability...</p>}
        {availabilityError && <p className="placeholder-message">{availabilityError}</p>}
      </div>
      {selectedDateKey && (
        <div className="time-slots-section">
          <label className="picker-label">
            Available Hours ({selectedDateLabel})
          </label>
          {timeOptions.length === 0 ? (
            <p className="placeholder-message">No available times left for this day.</p>
          ) : (
            <div className="times-grid">
              {timeOptions.map((option) => (
                <button
                  key={option.start_time}
                  type="button"
                  className={`time-chip ${selectedSlot?.start_time === option.start_time ? "selected" : ""}`}
                  onClick={() => onTimeSelect(option)}
                >
                  {formatStudioTime(option.start_time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className="modal-next-btn"
        disabled={!selectedDateKey || !selectedSlot}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  );
}

function AccountStep({ service, dateLabel, timeLabel, onContinue }) {
  return (
    <div className="modal-step" key="account">
      <h2>Booking Details</h2>
      <p className="modal-subtitle">
        {service.name} on {dateLabel} at {timeLabel}
      </p>
      <div className="auth-choice-container">
        <button type="button" className="auth-btn primary" onClick={() => window.alert("Redirecting to Log in...")}>
          Log In
        </button>
        <div className="auth-divider"><span>or</span></div>
        <button type="button" className="auth-btn secondary" onClick={onContinue}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

function GuestDetailsStep({ brandName, service, employee, dateLabel, timeLabel, guestForm, onFieldChange, onSubmit }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!guestForm.consentPrivacy) {
      window.alert("Please check the consent box regarding Kennitala processing to continue.");
      return;
    }
    onSubmit(guestForm);
  };

  return (
    <div className="modal-step" key="guest-details">
      <h2>Customer Information</h2>
      <p className="modal-subtitle">Complete your details to finish booking</p>
      <form className="guest-booking-form" onSubmit={handleSubmit}>
        <div className="appointment-summary-card">
          <div className="summary-header">
            <span className="summary-badge">Appointment Details</span>
          </div>
          <div className="summary-body">
            <div className="summary-row"><span className="summary-label">Service:</span><span className="summary-value">{service.name}</span></div>
            <div className="summary-row"><span className="summary-label">Duration:</span><span className="summary-value">⏱ {service.duration}</span></div>
            <div className="summary-row"><span className="summary-label">Price:</span><span className="summary-value highlight">{service.price}</span></div>
            <div className="summary-row"><span className="summary-label">Specialist:</span><span className="summary-value">{employee?.name}</span></div>
            <div className="summary-row"><span className="summary-label">Date &amp; Time:</span><span className="summary-value highlight">{dateLabel} at {timeLabel}</span></div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="booking-full-name">Full Name *</label>
          <input id="booking-full-name" type="text" required value={guestForm.fullName} onChange={(event) => onFieldChange("fullName", event.target.value)} placeholder="e.g. Guðrún Jónsdóttir" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-phone">Phone Number *</label>
          <input id="booking-phone" type="tel" required value={guestForm.phone} onChange={(event) => onFieldChange("phone", event.target.value)} placeholder="e.g. 123 4567" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-kennitala">Kennitala *</label>
          <input id="booking-kennitala" type="text" required value={guestForm.kennitala} onChange={(event) => onFieldChange("kennitala", event.target.value)} placeholder="e.g. 123456-7890" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-health-info">Health, Allergy &amp; Safety Info</label>
          <textarea id="booking-health-info" rows="3" value={guestForm.healthInfo} onChange={(event) => onFieldChange("healthInfo", event.target.value)} placeholder="Please state any allergies, skin sensitivities or medical conditions..." />
        </div>
        <div className="form-checkbox-group">
          <input id="consentKennitala" type="checkbox" checked={guestForm.consentPrivacy} onChange={(event) => onFieldChange("consentPrivacy", event.target.checked)} />
          <label htmlFor="consentKennitala">
            I consent to {brandName} storing and processing my Kennitala, phone number, and related customer information for appointment management, customer identification, service records, and applicable cancellation or no-show policies.
          </label>
        </div>
        <div className="cancellation-warning-box">
          <strong>Cancellation &amp; No-Show Policy</strong>
          <p>
            Appointments cancelled less than 48 hours before the scheduled time, and appointments missed without notice, may result in a 5,000 ISK fee. Any applicable fee is handled manually by {brandName} staff.
          </p>
        </div>
        <button type="submit" className="submit-booking-btn">Confirm &amp; Book Appointment</button>
      </form>
    </div>
  );
}

function BookingModal({ service, brandName, onClose }) {
  const todayDateKey = useMemo(() => getStudioDateKey(new Date()), []);
  const [initialYear, initialMonth] = todayDateKey.split("-").map(Number);

  const [step, setStep] = useState(1);
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    phone: "",
    kennitala: "",
    healthInfo: "",
    consentPrivacy: false,
  });
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [monthCursor, setMonthCursor] = useState({ year: initialYear, month: initialMonth - 1 });
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const data = await staffServiceApi.getByServiceId(service.id);
        if (isCurrent) setEmployees((data || []).map(toTeamMember));
      } catch (error) {
        console.warn("Could not load service staff:", error);
        if (isCurrent) setEmployees([]);
      } finally {
        if (isCurrent) setIsLoadingEmployees(false);
      }
    };

    loadEmployees();
    return () => {
      isCurrent = false;
    };
  }, [service.id]);

  // Fetch bookable slots for every future date in the visible month for the chosen specialist,
  // so the calendar can highlight only days that actually have availability.
  useEffect(() => {
    if (!selectedEmployee) return undefined;

    const datesToFetch = getMonthCells(monthCursor.year, monthCursor.month)
      .filter(Boolean)
      .map((cell) => cell.dateKey)
      .filter((dateKey) => dateKey >= todayDateKey)
      .filter((dateKey) => !Object.prototype.hasOwnProperty.call(availabilityByDate, dateKey));

    if (datesToFetch.length === 0) return undefined;

    let isCurrent = true;
    setIsLoadingAvailability(true);
    setAvailabilityError("");

    Promise.allSettled(
      datesToFetch.map((dateKey) =>
        apptApi.getAvailability({ serviceId: service.id, staffId: selectedEmployee.id, date: dateKey })
      )
    ).then((results) => {
      if (!isCurrent) return;
      const updates = {};
      let hadError = false;
      results.forEach((result, index) => {
        const dateKey = datesToFetch[index];
        if (result.status === "fulfilled" && Array.isArray(result.value?.slots)) {
          updates[dateKey] = result.value.slots;
        } else {
          updates[dateKey] = [];
          hadError = true;
        }
      });
      setAvailabilityByDate((previous) => ({ ...previous, ...updates }));
      if (hadError) setAvailabilityError("Some dates could not be checked for availability.");
    }).finally(() => {
      if (isCurrent) setIsLoadingAvailability(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedEmployee, monthCursor, service.id, availabilityByDate, todayDateKey]);

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setMonthCursor({ year: initialYear, month: initialMonth - 1 });
    setAvailabilityByDate({});
    setAvailabilityError("");
    setSelectedDateKey(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleMonthChange = (offset) => {
    setMonthCursor((previous) => shiftMonth(previous, offset));
    setSelectedDateKey(null);
    setSelectedSlot(null);
  };

  const handleDateSelect = (dateKey) => {
    setSelectedDateKey(dateKey);
    setSelectedSlot(null);
  };

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(monthCursor.year, monthCursor.month, 1)));
  const canGoPrevMonth = monthCursor.year > initialYear || monthCursor.month > initialMonth - 1;
  const calendarCells = getMonthCells(monthCursor.year, monthCursor.month).map((cell) => (
    cell && {
      ...cell,
      isAvailable: cell.dateKey >= todayDateKey && (availabilityByDate[cell.dateKey]?.length || 0) > 0,
    }
  ));
  const timeOptions = useMemo(
    () => pickTimeOptions(availabilityByDate[selectedDateKey] || []),
    [availabilityByDate, selectedDateKey]
  );
  const selectedDateLabel = selectedDateKey ? formatStudioDate(selectedDateKey) : "";
  const selectedTimeLabel = selectedSlot ? formatStudioTime(selectedSlot.start_time) : "";

  const handleGuestSubmit = async (submittedGuestForm) => {
    try {
      // PostgreSQL TIMESTAMPTZ requires a combined ISO-8601 datetime string[cite: 3]
      const finalStartTime = selectedSlot.start_time.includes("T") 
        ? selectedSlot.start_time 
        : `${selectedDateKey}T${selectedSlot.start_time.length === 5 ? selectedSlot.start_time + ':00' : selectedSlot.start_time}Z`;

      // Strip non-numeric characters for DB storage (e.g., "60 min" -> 60, "14,000 kr" -> 14000)
      const parsedDuration = parseInt(String(service.duration).replace(/\D/g, "")) || 60;
      const parsedPrice = parseFloat(String(service.price).replace(/[^\d.-]/g, "")) || 0;

      const payload = {
        brand_id: service.brand_id || 1, // Must match an existing brand ID in the DB
        service_id: service.id,
        staff_id: selectedEmployee.id,
        full_name: submittedGuestForm.fullName,
        phone_number: submittedGuestForm.phone,
        kennitala: submittedGuestForm.kennitala,
        start_time: finalStartTime,
        duration_minutes: parsedDuration,
        price_isk: parsedPrice,
        health_info: submittedGuestForm.healthInfo,
        consent_privacy: submittedGuestForm.consentPrivacy,
      };

      await apptApi.createAppointment(payload);
      window.alert(`Appointment confirmed for ${service.name} with ${selectedEmployee.name} on ${selectedDateLabel} at ${selectedTimeLabel}!`);
      onClose();
    } catch (error) {
      console.error("Booking API Error:", error);
      window.alert(`Booking failed: ${error.message || "Internal Server Error"}`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close booking">✕</button>
        <h1 className="visually-hidden" id="booking-modal-title">Book {service.name}</h1>

        {step === 1 && (
          <SpecialistStep
            service={service}
            employees={employees}
            isLoading={isLoadingEmployees}
            onSelect={handleSelectEmployee}
          />
        )}
        {step === 2 && (
          <ScheduleStep
            service={service}
            employee={selectedEmployee}
            monthLabel={monthLabel}
            canGoPrevMonth={canGoPrevMonth}
            onPrevMonth={() => handleMonthChange(-1)}
            onNextMonth={() => handleMonthChange(1)}
            calendarCells={calendarCells}
            selectedDateKey={selectedDateKey}
            onDateSelect={handleDateSelect}
            isLoadingAvailability={isLoadingAvailability}
            availabilityError={availabilityError}
            selectedDateLabel={selectedDateLabel}
            timeOptions={timeOptions}
            selectedSlot={selectedSlot}
            onTimeSelect={setSelectedSlot}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <AccountStep
            service={service}
            dateLabel={selectedDateLabel}
            timeLabel={selectedTimeLabel}
            onContinue={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <GuestDetailsStep
            brandName={brandName}
            service={service}
            employee={selectedEmployee}
            dateLabel={selectedDateLabel}
            timeLabel={selectedTimeLabel}
            guestForm={guestForm}
            onFieldChange={(field, value) => {
              setGuestForm((previous) => ({ ...previous, [field]: value }));
            }}
            onSubmit={handleGuestSubmit}
          />
        )}

        <div className="booking-step-footer">
          <ol className="booking-step-indicator" aria-label="Booking progress">
            {BOOKING_STEPS.map((stepName, index) => {
              const stepNumber = index + 1;
              const isCurrent = step === stepNumber;
              const isComplete = step > stepNumber;
              return (
                <li key={stepName}>
                  <button
                    type="button"
                    className={`booking-progress-step ${isCurrent ? "current" : ""} ${isComplete ? "complete" : ""}`}
                    aria-label={`Step ${stepNumber}: ${stepName}`}
                    aria-current={isCurrent ? "step" : undefined}
                    disabled={!isComplete}
                    onClick={() => setStep(stepNumber)}
                  >
                    <span className="booking-progress-dot" aria-hidden="true" />
                    <span className="booking-progress-label">{stepName}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {step > 1 && (
            <button type="button" className="booking-back-btn" onClick={() => setStep((current) => current - 1)}>
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
