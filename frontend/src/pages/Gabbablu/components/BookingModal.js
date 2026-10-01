import { useEffect, useState } from "react";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";
import { staffServiceApi } from "../../../services/api";
import { toTeamMember } from "../studioData";

const BOOKING_STEPS = ["Specialist", "Date & time", "Account", "Your details"];
const AVAILABLE_TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, index) => {
  const dayNumber = index + 1;
  return {
    dayNumber,
    isAvailable: [14, 15, 16, 17, 18, 21, 22, 24, 25, 29, 30].includes(dayNumber),
    fullDate: `September ${dayNumber}, 2026`,
  };
});

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

function ScheduleStep({ service, employee, selectedDate, selectedTime, onDateSelect, onTimeSelect, onNext }) {
  return (
    <div className="modal-step" key="schedule">
      <h2>Select Date &amp; Time</h2>
      <p className="modal-subtitle">{service.name} with {employee?.name}</p>
      <div className="calendar-container">
        <div className="calendar-header">
          <span className="calendar-month-title">September 2026</span>
        </div>
        <div className="calendar-weekdays">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="calendar-days-grid">
          {CALENDAR_DAYS.map((day) => (
            <button
              key={day.dayNumber}
              type="button"
              disabled={!day.isAvailable}
              className={`calendar-day-cell ${day.isAvailable ? "available" : "disabled"} ${selectedDate?.dayNumber === day.dayNumber ? "selected" : ""}`}
              onClick={() => onDateSelect(day)}
            >
              {day.dayNumber}
            </button>
          ))}
        </div>
      </div>
      {selectedDate && (
        <div className="time-slots-section">
          <label className="picker-label">
            Available Hours ({selectedDate.fullDate})
          </label>
          <div className="times-grid">
            {AVAILABLE_TIMES.map((time) => (
              <button
                key={time}
                type="button"
                className={`time-chip ${selectedTime === time ? "selected" : ""}`}
                onClick={() => onTimeSelect(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        className="modal-next-btn"
        disabled={!selectedDate || !selectedTime}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  );
}

function AccountStep({ service, selectedDate, selectedTime, onContinue }) {
  return (
    <div className="modal-step" key="account">
      <h2>Booking Details</h2>
      <p className="modal-subtitle">
        {service.name} on {selectedDate?.fullDate} at {selectedTime}
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

function GuestDetailsStep({ brandName, service, employee, selectedDate, selectedTime, guestForm, onFieldChange, onSubmit }) {
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
            <div className="summary-row"><span className="summary-label">Date &amp; Time:</span><span className="summary-value highlight">{selectedDate?.fullDate} at {selectedTime}</span></div>
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

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

  const handleGuestSubmit = () => {
    window.alert(`Appointment confirmed for ${service.name} with ${selectedEmployee.name} on ${selectedDate?.fullDate} at ${selectedTime}!`);
    onClose();
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
            onSelect={(employee) => {
              setSelectedEmployee(employee);
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <ScheduleStep
            service={service}
            employee={selectedEmployee}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            onTimeSelect={setSelectedTime}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <AccountStep
            service={service}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onContinue={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <GuestDetailsStep
            brandName={brandName}
            service={service}
            employee={selectedEmployee}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
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
