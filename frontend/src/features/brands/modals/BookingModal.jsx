import { useEffect, useMemo, useState } from "react";
import UserAvatar from "../../../components/common/UserAvatar/UserAvatar";
import { useLanguage } from "../../../components/i18n/LanguageContext";
import { apptApi, staffServiceApi } from "../../../services/api";
import ReferenceImagePicker from "../components/ReferenceImagePicker";
import { toTeamMember } from "../data/studioData";
import {
  formatStudioDate,
  formatStudioTime,
  getMonthCells,
  getStudioDateKey,
  pickTimeOptions,
  shiftMonth,
} from "../data/scheduleAvailability";

function SpecialistStep({ service, employees, isLoading, onSelect }) {
  const { t } = useLanguage();
  return (
    <div className="modal-step" key="specialist">
      <h2>{t("booking.chooseEmployee")}</h2>
      <p className="modal-subtitle">
        {t("booking.service")} {service.name} (⏱ {service.duration})
      </p>
      <div className="employee-selection-list">
        {isLoading ? (
          <p className="placeholder-message">{t("booking.loadingTeam")}</p>
        ) : employees.length === 0 ? (
          <p className="placeholder-message">{t("booking.noTeam")}</p>
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
  const { t, language } = useLanguage();
  const weekdays = language === "is"
    ? ["Mán", "Þri", "Mið", "Fim", "Fös", "Lau", "Sun"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  return (
    <div className="modal-step" key="schedule">
      <h2>{t("booking.dateTime")}</h2>
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
          {weekdays.map((weekday) => (
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
        {isLoadingAvailability && <p className="placeholder-message">{t("booking.checkAvailability")}</p>}
        {availabilityError && <p className="placeholder-message">{availabilityError}</p>}
      </div>
      {selectedDateKey && (
        <div className="time-slots-section">
          <label className="picker-label">
            {t("booking.availableHours", { date: selectedDateLabel })}
          </label>
          {timeOptions.length === 0 ? (
            <p className="placeholder-message">{t("booking.noTimes")}</p>
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
        {t("booking.next")}
      </button>
    </div>
  );
}

function AccountStep({ service, dateLabel, timeLabel, onContinue }) {
  const { t } = useLanguage();
  return (
    <div className="modal-step" key="account">
      <h2>{t("booking.details")}</h2>
      <p className="modal-subtitle">
        {service.name} on {dateLabel} at {timeLabel}
      </p>
      <div className="auth-choice-container">
        <button type="button" className="auth-btn primary" onClick={() => window.alert(t("header.login"))}>
        {t("booking.login")}
        </button>
        <div className="auth-divider"><span>{t("booking.or")}</span></div>
        <button type="button" className="auth-btn secondary" onClick={onContinue}>
          {t("booking.continueGuest")}
        </button>
      </div>
    </div>
  );
}

function GuestDetailsStep({
  brandName,
  service,
  employee,
  dateLabel,
  timeLabel,
  guestForm,
  onFieldChange,
  referenceImages,
  referenceImageError,
  onReferenceImagesSelected,
  onReferenceImageRemove,
  onSubmit,
  submitError,
  isSubmitting,
}) {
  const { t } = useLanguage();
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!guestForm.consentPrivacy) {
      window.alert(t("booking.privacyRequired"));
      return;
    }
    if (!guestForm.consentCancellation) {
      window.alert(t("booking.cancellationRequired"));
      return;
    }
    onSubmit(guestForm);
  };

  return (
    <div className="modal-step" key="guest-details">
      <h2>{t("booking.customerInfo")}</h2>
      <p className="modal-subtitle">{t("booking.completeDetails")}</p>
      <form className="guest-booking-form" onSubmit={handleSubmit}>
        <div className="appointment-summary-card">
          <div className="summary-header">
            <span className="summary-badge">{t("booking.appointmentDetails")}</span>
          </div>
          <div className="summary-body">
            <div className="summary-row"><span className="summary-label">{t("booking.service")}</span><span className="summary-value">{service.name}</span></div>
            <div className="summary-row"><span className="summary-label">{t("booking.duration")}</span><span className="summary-value">⏱ {service.duration}</span></div>
            <div className="summary-row"><span className="summary-label">{t("booking.price")}</span><span className="summary-value highlight">{service.price}</span></div>
            <div className="summary-row"><span className="summary-label">{t("booking.specialist")}</span><span className="summary-value">{employee?.name}</span></div>
            <div className="summary-row"><span className="summary-label">{t("booking.dateAndTime")}</span><span className="summary-value highlight">{dateLabel} {t("booking.at")} {timeLabel}</span></div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="booking-full-name">{t("booking.fullName")}</label>
          <input id="booking-full-name" type="text" required value={guestForm.fullName} onChange={(event) => onFieldChange("fullName", event.target.value)} placeholder="e.g. Guðrún Jónsdóttir" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-email">{t("booking.email")}</label>
          <input id="booking-email" type="email" required autoComplete="email" value={guestForm.email} onChange={(event) => onFieldChange("email", event.target.value)} placeholder="e.g. name@example.com" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-phone">{t("booking.phone")}</label>
          <input id="booking-phone" type="tel" required value={guestForm.phone} onChange={(event) => onFieldChange("phone", event.target.value)} placeholder="e.g. 123 4567" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-kennitala">{t("booking.kennitala")}</label>
          <input id="booking-kennitala" type="text" required value={guestForm.kennitala} onChange={(event) => onFieldChange("kennitala", event.target.value)} placeholder="e.g. 123456-7890" />
        </div>
        <div className="form-group">
          <label htmlFor="booking-health-info">{t("booking.healthInfo")}</label>
          <textarea id="booking-health-info" rows="3" value={guestForm.healthInfo} onChange={(event) => onFieldChange("healthInfo", event.target.value)} placeholder={t("booking.healthPlaceholder")} />
        </div>
        <ReferenceImagePicker
          files={referenceImages}
          error={referenceImageError}
          disabled={isSubmitting}
          onFilesSelected={onReferenceImagesSelected}
          onRemove={onReferenceImageRemove}
        />
        <div className="form-checkbox-group">
          <input id="consentKennitala" type="checkbox" checked={guestForm.consentPrivacy} onChange={(event) => onFieldChange("consentPrivacy", event.target.checked)} />
          <label htmlFor="consentKennitala">
            {t("booking.privacyConsent", { brand: brandName })}
          </label>
        </div>
        <div className="cancellation-warning-box">
          <strong>{t("booking.cancellationPolicy")}</strong>
          <p>
            {t("booking.cancellationDescription", { brand: brandName })}
          </p>
        </div>
        <div className="form-checkbox-group">
          <input
            id="consentCancellation"
            type="checkbox"
            required
            checked={guestForm.consentCancellation}
            onChange={(event) => onFieldChange("consentCancellation", event.target.checked)}
          />
          <label htmlFor="consentCancellation">
            {t("booking.cancellationConsent")}
          </label>
        </div>
        {submitError && <p className="booking-submit-error" role="alert">{submitError}</p>}
        <button type="submit" className="submit-booking-btn" disabled={isSubmitting}>
          {isSubmitting ? t("booking.submitting") : t("booking.confirm")}
        </button>
      </form>
    </div>
  );
}

function BookingModal({ service, brandName, onClose }) {
  const { language, t } = useLanguage();
  const bookingSteps = [
    t("booking.step.specialist"),
    t("booking.step.date"),
    t("booking.step.account"),
    t("booking.step.details"),
  ];
  const todayDateKey = useMemo(() => getStudioDateKey(new Date()), []);
  const [initialYear, initialMonth] = todayDateKey.split("-").map(Number);

  const [step, setStep] = useState(1);
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    kennitala: "",
    healthInfo: "",
    consentPrivacy: false,
    consentCancellation: false,
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
  const [referenceImages, setReferenceImages] = useState([]);
  const [referenceImageError, setReferenceImageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const data = await staffServiceApi.getByServiceId(service.id);
        if (isCurrent) setEmployees((data || []).map((person) => toTeamMember(person, language)));
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
  }, [service.id, language]);

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
      if (hadError) setAvailabilityError(t("booking.availabilityError"));
    }).finally(() => {
      if (isCurrent) setIsLoadingAvailability(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedEmployee, monthCursor, service.id, availabilityByDate, todayDateKey, language, t]);

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

  const locale = language === "is" ? "is-IS" : "en-GB";
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" })
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
  const selectedDateLabel = selectedDateKey ? formatStudioDate(selectedDateKey, undefined, locale) : "";
  const selectedTimeLabel = selectedSlot ? formatStudioTime(selectedSlot.start_time) : "";

  const handleReferenceImagesSelected = (files) => {
    const selectedFiles = Array.from(files);
    if (referenceImages.length + selectedFiles.length > 5) {
      setReferenceImageError(t("booking.referenceLimit"));
      return;
    }
    if (selectedFiles.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setReferenceImageError(t("booking.referenceTypeError"));
      return;
    }
    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setReferenceImageError(t("booking.referenceSizeError"));
      return;
    }
    setReferenceImageError("");
    setReferenceImages((previous) => [...previous, ...selectedFiles]);
  };

  const handleGuestSubmit = async (submittedGuestForm) => {
    setIsSubmitting(true);
    setSubmitError("");
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
        email: submittedGuestForm.email,
        phone_number: submittedGuestForm.phone,
        kennitala: submittedGuestForm.kennitala,
        start_time: finalStartTime,
        duration_minutes: parsedDuration,
        price_isk: parsedPrice,
        health_info: submittedGuestForm.healthInfo,
        consent_privacy: submittedGuestForm.consentPrivacy,
        custom_options: {
          cancellation_policy_accepted: submittedGuestForm.consentCancellation,
          cancellation_policy_version: "2026-10-19",
        },
      };

      if (referenceImages.length > 0) {
        await apptApi.createAppointment(payload, referenceImages);
      } else {
        await apptApi.createAppointment(payload);
      }
      window.alert(t("booking.confirmed", {
        service: service.name,
        specialist: selectedEmployee.name,
        date: selectedDateLabel,
        time: selectedTimeLabel,
      }));
      onClose();
    } catch (error) {
      console.error("Booking API Error:", error);
      setSubmitError(t("booking.failed", {
        error: error.message || (language === "is" ? "Innri villa á netþjóni" : "Internal Server Error"),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t("booking.close")}>✕</button>
        <h1 className="visually-hidden" id="booking-modal-title">{t("booking.service")} {service.name}</h1>

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
            referenceImages={referenceImages}
            referenceImageError={referenceImageError}
            onReferenceImagesSelected={handleReferenceImagesSelected}
            onReferenceImageRemove={(index) => {
              setReferenceImages((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
              setReferenceImageError("");
            }}
            onSubmit={handleGuestSubmit}
            submitError={submitError}
            isSubmitting={isSubmitting}
          />
        )}

        <div className="booking-step-footer">
          <ol className="booking-step-indicator" aria-label={t("booking.progress")}>
            {bookingSteps.map((stepName, index) => {
              const stepNumber = index + 1;
              const isCurrent = step === stepNumber;
              const isComplete = step > stepNumber;
              return (
                <li key={stepName}>
                  <button
                    type="button"
                    className={`booking-progress-step ${isCurrent ? "current" : ""} ${isComplete ? "complete" : ""}`}
                    aria-label={`${t("booking.stepNumber")} ${stepNumber}: ${stepName}`}
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
              {t("booking.back")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
