import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apptApi, getAssetUrl, staffAvailabilityApi, staffServiceApi } from "../../services/api";
import AppointmentDetailsModal from "./components/AppointmentDetailsModal";
import AvailabilityEditor from "./components/AvailabilityEditor";
import CalendarBlockModal from "./components/CalendarBlockModal";
import StaffCalendar from "./components/StaffCalendar";
import StaffProfileHeader from "./components/StaffProfileHeader";
import {
  dateKeyFromParts,
  formatStudioDate,
  formatStudioTime,
  getMonthCells,
  getStudioDateKey,
  makeAvailabilityDrafts,
  normalizeAppointment,
  shiftDateKey,
} from "./staffCalendarUtils";
import "./Staff.css";

function dateKeysInRange(startDate, endDate) {
  const dates = [];
  for (let date = startDate; date && date <= endDate && dates.length < 370; date = shiftDateKey(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function StaffPortal() {
  const navigate = useNavigate();
  const staffName = localStorage.getItem("auth_user_name") || "Staff";
  const [staffDescription, setStaffDescription] = useState(
    localStorage.getItem("auth_user_description") || ""
  );
  const [staffAvatar, setStaffAvatar] = useState(() =>
    getAssetUrl(localStorage.getItem("auth_user_avatar"))
  );
  const staffId = localStorage.getItem("staff_id");
  const todayDateKey = getStudioDateKey(new Date());
  const [initialYear, initialMonth] = todayDateKey.split("-").map(Number);
  const [monthCursor, setMonthCursor] = useState({ year: initialYear, month: initialMonth - 1 });
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [calendarView, setCalendarView] = useState("month");
  const [appointments, setAppointments] = useState([]);
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [availabilityDraft, setAvailabilityDraft] = useState([]);
  const [unavailabilityDraft, setUnavailabilityDraft] = useState({
    startDate: todayDateKey,
    startTime: "09:00",
    endDate: todayDateKey,
    endTime: "17:00",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [unavailabilityError, setUnavailabilityError] = useState("");
  const [unavailabilitySaving, setUnavailabilitySaving] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusEditMode, setStatusEditMode] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [feeStatusDraft, setFeeStatusDraft] = useState("none");
  const [cancellationReason, setCancellationReason] = useState("");
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [calendarBlockModal, setCalendarBlockModal] = useState(null);
  const [calendarBlockError, setCalendarBlockError] = useState("");
  const [calendarBlockSaving, setCalendarBlockSaving] = useState(false);
  const selectedDailyAvailability = availabilityByDate[selectedDateKey];

  useEffect(() => {
    let isMounted = true;
    apptApi.listAppointments()
      .then((result) => {
        if (!isMounted) return;
        if (Array.isArray(result?.appointments)) {
          setAppointments(result.appointments.map(normalizeAppointment));
        } else {
          setPageError("The appointments response was not in the expected format.");
        }
      })
      .catch((error) => {
        if (isMounted) setPageError(error.message || "Could not load appointments.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const dateKeys = getMonthCells(monthCursor.year, monthCursor.month)
      .filter(Boolean)
      .map((cell) => cell.dateKey);
    const missingDates = dateKeys.filter(
      (dateKey) => !Object.prototype.hasOwnProperty.call(availabilityByDate, dateKey)
    );
    if (!missingDates.length) {
      setAvailabilityLoading(false);
      return undefined;
    }

    let isMounted = true;
    setAvailabilityLoading(true);
    Promise.allSettled(missingDates.map((dateKey) => staffAvailabilityApi.getForDate(dateKey)))
      .then((results) => {
        if (!isMounted) return;
        const updates = {};
        const errors = [];
        results.forEach((result, index) => {
          const dateKey = missingDates[index];
          if (result.status === "fulfilled") {
            updates[dateKey] = {
              availability: Array.isArray(result.value?.availability) ? result.value.availability : [],
              unavailabilities: Array.isArray(result.value?.unavailabilities) ? result.value.unavailabilities : [],
            };
          } else {
            updates[dateKey] = { availability: [], unavailabilities: [], loadError: result.reason?.message };
            errors.push(`${dateKey}: ${result.reason?.message || "Could not load availability."}`);
          }
        });
        setAvailabilityByDate((previous) => ({ ...previous, ...updates }));
        if (errors.length) setPageError((previous) => [previous, ...errors].filter(Boolean).join(" "));
      })
      .finally(() => {
        if (isMounted) setAvailabilityLoading(false);
      });
    return () => { isMounted = false; };
  }, [monthCursor.year, monthCursor.month, availabilityByDate]);

  useEffect(() => {
    setAvailabilityDraft(makeAvailabilityDrafts(selectedDailyAvailability?.availability || []));
    setAvailabilityError("");
  }, [selectedDateKey, selectedDailyAvailability]);

  useEffect(() => {
    if ((staffAvatar && staffDescription) || !staffId) return undefined;
    let isMounted = true;
    const loadProfilePhoto = async () => {
      try {
        const assignedServices = await staffServiceApi.getByStaffId(staffId);
        const serviceId = Array.isArray(assignedServices)
          ? assignedServices.find((service) => service.service_id)?.service_id
          : null;
        if (!serviceId) return;
        const assignedStaff = await staffServiceApi.getByServiceId(serviceId);
        const currentStaff = Array.isArray(assignedStaff)
          ? assignedStaff.find((member) => String(member.id) === String(staffId))
          : null;
        if (currentStaff && isMounted) {
          if (!staffAvatar && currentStaff.avatar_url) {
            const avatarUrl = getAssetUrl(currentStaff.avatar_url);
            localStorage.setItem("auth_user_avatar", avatarUrl);
            setStaffAvatar(avatarUrl);
          }
          if (!staffDescription && currentStaff.description) {
            localStorage.setItem("auth_user_description", currentStaff.description);
            setStaffDescription(currentStaff.description);
          }
        }
      } catch (error) {
        console.warn("Could not load staff profile photo:", error);
      }
    };
    loadProfilePhoto();
    return () => { isMounted = false; };
  }, [staffAvatar, staffDescription, staffId]);

  const handleLogout = () => {
    localStorage.removeItem("staff_auth_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("auth_user_name");
    localStorage.removeItem("auth_user_description");
    localStorage.removeItem("auth_user_avatar");
    localStorage.removeItem("staff_id");
    navigate("/staff-login");
  };

  const handleMonthChange = (offset) => {
    const next = new Date(Date.UTC(monthCursor.year, monthCursor.month + offset, 1));
    const year = next.getUTCFullYear();
    const month = next.getUTCMonth();
    setMonthCursor({ year, month });
    setSelectedDateKey(dateKeyFromParts(year, month + 1, 1));
  };

  const handleNavigateDate = (dateKey) => {
    if (!dateKey) return;
    const [year, month] = dateKey.split("-").map(Number);
    setSelectedDateKey(dateKey);
    setMonthCursor({ year, month: month - 1 });
  };

  const handleOpenAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setStatusEditMode(false);
    setStatusDraft(appointment.status);
    setFeeStatusDraft(appointment.fee_status || "none");
    setCancellationReason("");
    setAppointmentError("");
  };

  const handleCloseAppointment = () => {
    setSelectedAppointment(null);
    setStatusEditMode(false);
    setFeeStatusDraft("none");
    setCancellationReason("");
    setAppointmentError("");
  };

  const handleSaveAppointmentStatus = async (event) => {
    event.preventDefault();
    if (!selectedAppointment || !statusDraft) return;
    setAppointmentSaving(true);
    setAppointmentError("");
    try {
      if (feeStatusDraft !== (selectedAppointment.fee_status || "none")) {
        const result = await apptApi.updateFeeStatus(selectedAppointment.id, feeStatusDraft);
        const feeStatus = result?.appointment?.fee_status || feeStatusDraft;
        setAppointments((previous) => previous.map((appointment) =>
          String(appointment.id) === String(selectedAppointment.id)
            ? { ...appointment, fee_status: feeStatus }
            : appointment
        ));
        setSelectedAppointment((appointment) => ({ ...appointment, fee_status: feeStatus }));
      }
      if (statusDraft === "cancelled") {
        await apptApi.cancelAppointment(selectedAppointment.id, cancellationReason.trim() || undefined);
        setAppointments((previous) => previous.map((appointment) =>
          String(appointment.id) === String(selectedAppointment.id)
            ? { ...appointment, status: "cancelled" }
            : appointment
        ));
        setSelectedAppointment((appointment) => ({ ...appointment, status: "cancelled" }));
        setStatusEditMode(false);
        return;
      }
      if (statusDraft !== selectedAppointment.status) {
        const result = await apptApi.updateStatus(selectedAppointment.id, statusDraft);
        const status = result?.appointment?.status || statusDraft;
        setAppointments((previous) => previous.map((appointment) =>
          String(appointment.id) === String(selectedAppointment.id)
            ? { ...appointment, status }
            : appointment
        ));
        setSelectedAppointment((appointment) => ({ ...appointment, status }));
      }
      setStatusEditMode(false);
    } catch (error) {
      setAppointmentError(error.message || "Could not update appointment status.");
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleAddAvailabilityShift = () => {
    setAvailabilityDraft((previous) => [...previous, {
      key: `new-${selectedDateKey}-${Date.now()}-${Math.random()}`,
      start_time: "09:00",
      end_time: "10:00",
    }]);
  };

  const handleUpdateAvailabilityShift = (key, field, value) => {
    setAvailabilityDraft((previous) => previous.map((shift) =>
      shift.key === key ? { ...shift, [field]: value } : shift
    ));
  };

  const handleSaveAvailability = async (event) => {
    event.preventDefault();
    setAvailabilityError("");
    const shifts = [...availabilityDraft].sort((left, right) => left.start_time.localeCompare(right.start_time));
    if (shifts.some((shift) => !shift.start_time || !shift.end_time || shift.end_time <= shift.start_time)) {
      setAvailabilityError("Each interval must end after it starts.");
      return;
    }
    if (shifts.some((shift, index) => index > 0 && shift.start_time < shifts[index - 1].end_time)) {
      setAvailabilityError("Available intervals for this date cannot overlap.");
      return;
    }

    setAvailabilitySaving(true);
    try {
      const payload = shifts.map(({ start_time, end_time }) => ({ start_time, end_time, is_active: true }));
      const result = await staffAvailabilityApi.replaceForDate(selectedDateKey, payload);
      const nextAvailability = Array.isArray(result?.availability)
        ? result.availability
        : payload.map((shift) => ({ ...shift, availability_date: selectedDateKey }));
      const previousDaily = availabilityByDate[selectedDateKey] || { unavailabilities: [] };
      setAvailabilityByDate((previous) => ({
        ...previous,
        [selectedDateKey]: {
          availability: nextAvailability,
          unavailabilities: Array.isArray(result?.unavailabilities)
            ? result.unavailabilities
            : previousDaily.unavailabilities,
        },
      }));
      setAvailabilityDraft(makeAvailabilityDrafts(nextAvailability));
    } catch (error) {
      setAvailabilityError(error.message || "Could not save hours for this date.");
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleUpdateUnavailabilityDraft = (field, value) => {
    setUnavailabilityDraft((previous) => ({ ...previous, [field]: value }));
  };

  const makeTimestamp = (date, time) => new Date(`${date}T${time}:00+00:00`).toISOString();

  const addUnavailabilityToCache = (period, replacedPeriodId = null) => {
    const dateKeys = dateKeysInRange(
      getStudioDateKey(period.block_start),
      getStudioDateKey(period.block_end)
    );
    setAvailabilityByDate((previous) => {
      const next = { ...previous };
      dateKeys.forEach((dateKey) => {
        const daily = next[dateKey] || { availability: [], unavailabilities: [] };
        next[dateKey] = {
          ...daily,
          unavailabilities: [
            ...daily.unavailabilities.filter((item) =>
              String(item.id) !== String(replacedPeriodId)
              && String(item.id) !== String(period.id)
            ),
            period,
          ],
        };
      });
      return next;
    });
  };

  const removeUnavailabilityFromCache = (id) => {
    setAvailabilityByDate((previous) => Object.fromEntries(
      Object.entries(previous).map(([dateKey, daily]) => [dateKey, {
        ...daily,
        unavailabilities: daily.unavailabilities.filter((period) => String(period.id) !== String(id)),
      }])
    ));
  };

  const handleAddUnavailability = async (event) => {
    event.preventDefault();
    setUnavailabilityError("");
    const { startDate, startTime, endDate, endTime, reason } = unavailabilityDraft;
    if (!startDate || !startTime || !endDate || !endTime) {
      setUnavailabilityError("Choose a start and end date and time.");
      return;
    }
    if (new Date(makeTimestamp(endDate, endTime)) <= new Date(makeTimestamp(startDate, startTime))) {
      setUnavailabilityError("The unavailable period must end after it starts.");
      return;
    }
    setUnavailabilitySaving(true);
    try {
      const result = await staffAvailabilityApi.addUnavailability({
        start_time: makeTimestamp(startDate, startTime),
        end_time: makeTimestamp(endDate, endTime),
        reason: reason.trim() || undefined,
      });
      if (result?.unavailability) {
        addUnavailabilityToCache(result.unavailability);
      }
      setUnavailabilityDraft((previous) => ({ ...previous, reason: "" }));
    } catch (error) {
      setUnavailabilityError(error.message || "Could not add unavailable time.");
    } finally {
      setUnavailabilitySaving(false);
    }
  };

  const handleRemoveUnavailability = async (id) => {
    setUnavailabilityError("");
    try {
      await staffAvailabilityApi.removeUnavailability(id);
      removeUnavailabilityFromCache(id);
    } catch (error) {
      setUnavailabilityError(error.message || "Could not remove unavailable time.");
    }
  };

  const openCalendarBlockModal = (modal) => {
    setCalendarBlockModal(modal);
    setCalendarBlockError("");
  };

  const closeCalendarBlockModal = () => {
    setCalendarBlockModal(null);
    setCalendarBlockError("");
  };

  const handleSaveCalendarBlock = async (form) => {
    setCalendarBlockError("");
    const dateKey = calendarBlockModal.dateKey;
    const isDateAvailability = calendarBlockModal.type === "available"
      || (calendarBlockModal.type === "add" && form.blockType !== "unavailable");

    if (isDateAvailability) {
      if (!form.startTime || !form.endTime || form.endTime <= form.startTime) {
        setCalendarBlockError("The end time must be after it starts.");
        return;
      }
      const daily = availabilityByDate[dateKey] || { availability: [], unavailabilities: [] };
      const editedAvailability = calendarBlockModal.block?.availability;
      const remaining = daily.availability.filter((shift) =>
        !editedAvailability || String(shift.id) !== String(editedAvailability.id)
      );
      if (remaining.some((shift) =>
        form.startTime < String(shift.end_time).slice(0, 5)
        && form.endTime > String(shift.start_time).slice(0, 5)
      )) {
        setCalendarBlockError("This time overlaps another available interval for this date.");
        return;
      }

      setCalendarBlockSaving(true);
      try {
        const shifts = [
          ...remaining.map((shift) => ({
            start_time: String(shift.start_time).slice(0, 5),
            end_time: String(shift.end_time).slice(0, 5),
            is_active: shift.is_active !== false,
          })),
          { start_time: form.startTime, end_time: form.endTime, is_active: true },
        ];
        const result = await staffAvailabilityApi.replaceForDate(dateKey, shifts);
        const nextAvailability = Array.isArray(result?.availability)
          ? result.availability
          : shifts.map((shift) => ({ ...shift, availability_date: dateKey }));
        setAvailabilityByDate((previous) => ({
          ...previous,
          [dateKey]: {
            availability: nextAvailability,
            unavailabilities: Array.isArray(result?.unavailabilities)
              ? result.unavailabilities
              : daily.unavailabilities,
          },
        }));
        if (dateKey === selectedDateKey) setAvailabilityDraft(makeAvailabilityDrafts(nextAvailability));
        closeCalendarBlockModal();
      } catch (error) {
        setCalendarBlockError(error.message || "Could not save hours for this date.");
      } finally {
        setCalendarBlockSaving(false);
      }
      return;
    }

    const isUnavailable = calendarBlockModal.type === "unavailable"
      || (calendarBlockModal.type === "add" && form.blockType === "unavailable");
    if (!form.startTime || !form.endTime || (!isUnavailable && form.endTime <= form.startTime)) {
      setCalendarBlockError("The end time must be after the start time.");
      return;
    }

    if (isUnavailable) {
      if (!form.startDate || !form.endDate) {
        setCalendarBlockError("Choose a start and end date.");
        return;
      }
      const start = new Date(makeTimestamp(form.startDate, form.startTime));
      const end = new Date(makeTimestamp(form.endDate, form.endTime));
      if (end <= start) {
        setCalendarBlockError("The unavailable period must end after it starts.");
        return;
      }
      setCalendarBlockSaving(true);
      try {
        const result = await staffAvailabilityApi.addUnavailability({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          reason: form.reason.trim() || undefined,
        });
        const replacement = result?.unavailability;
        if (replacement && calendarBlockModal.block?.period?.id) {
          await staffAvailabilityApi.removeUnavailability(calendarBlockModal.block.period.id);
          removeUnavailabilityFromCache(calendarBlockModal.block.period.id);
          addUnavailabilityToCache(replacement);
        } else if (replacement) {
          addUnavailabilityToCache(replacement);
        }
        closeCalendarBlockModal();
      } catch (error) {
        setCalendarBlockError(error.message || "Could not update unavailable time.");
      } finally {
        setCalendarBlockSaving(false);
      }
      return;
    }
  };

  const handleDeleteCalendarBlock = async () => {
    const block = calendarBlockModal?.block;
    if (!block) return;
    setCalendarBlockError("");
    setCalendarBlockSaving(true);
    try {
      if (calendarBlockModal.type === "unavailable") {
        await staffAvailabilityApi.removeUnavailability(block.period.id);
        removeUnavailabilityFromCache(block.period.id);
      } else {
        const dateKey = calendarBlockModal.dateKey;
        const daily = availabilityByDate[dateKey] || { availability: [], unavailabilities: [] };
        const shifts = daily.availability
          .filter((shift) => String(shift.id) !== String(block.availability.id))
          .map((shift) => ({
            start_time: String(shift.start_time).slice(0, 5),
            end_time: String(shift.end_time).slice(0, 5),
            is_active: shift.is_active !== false,
          }));
        const result = await staffAvailabilityApi.replaceForDate(dateKey, shifts);
        const nextAvailability = Array.isArray(result?.availability)
          ? result.availability
          : shifts.map((shift) => ({ ...shift, availability_date: dateKey }));
        setAvailabilityByDate((previous) => ({
          ...previous,
          [dateKey]: {
            availability: nextAvailability,
            unavailabilities: Array.isArray(result?.unavailabilities)
              ? result.unavailabilities
              : daily.unavailabilities,
          },
        }));
        if (dateKey === selectedDateKey) setAvailabilityDraft(makeAvailabilityDrafts(nextAvailability));
      }
      closeCalendarBlockModal();
    } catch (error) {
      setCalendarBlockError(error.message || "Could not delete the time block.");
    } finally {
      setCalendarBlockSaving(false);
    }
  };

  const handleRefreshPage = async () => {
    setLoading(true);
    setPageError("");
    const result = await Promise.allSettled([apptApi.listAppointments()]);
    if (result[0].status === "fulfilled" && Array.isArray(result[0].value?.appointments)) {
      setAppointments(result[0].value.appointments.map(normalizeAppointment));
    } else {
      setPageError(result[0].status === "rejected"
        ? result[0].reason?.message || "Could not load appointments."
        : "The appointments response was not in the expected format.");
    }
    setAvailabilityByDate({});
    setAvailabilityLoading(true);
    setLoading(false);
  };

  const handleLoginRedirectOnAuthFailure = () => {
    localStorage.removeItem("staff_auth_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("staff_id");
    navigate("/staff-login");
  };

  const onPageErrorDismiss = () => setPageError("");

  return (
    <div className="staff-page">
      <StaffProfileHeader
        name={staffName}
        description={staffDescription}
        avatar={staffAvatar}
        onLogout={handleLogout}
      />
      <main className="staff-content">
        <div className="schedule-header-controls">
          <div>
            <h1>My Schedule</h1>
            <p className="schedule-subtitle">Appointments and working hours · Iceland time</p>
          </div>
          <div className="view-toggle-buttons" role="tablist" aria-label="Schedule view">
            {[
              ["month", "Month"],
              ["day", "Day"],
              ["availability", "Availability"],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={calendarView === view}
                className={`toggle-btn ${calendarView === view ? "active" : ""}`}
                onClick={() => setCalendarView(view)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {pageError && (
          <div className="staff-error-banner" role="alert">
            <span>{pageError}</span>
            <button type="button" onClick={onPageErrorDismiss} aria-label="Dismiss error">×</button>
            <button type="button" onClick={handleRefreshPage}>Retry</button>
            {pageError.includes("Access denied") && (
              <button type="button" onClick={handleLoginRedirectOnAuthFailure}>Log in again</button>
            )}
          </div>
        )}

        {loading ? (
          <div className="staff-loading-state">Loading your schedule...</div>
        ) : (
          <div className="staff-view-container">
            {availabilityLoading && (
              <p className="staff-loading-state">Loading date-specific availability...</p>
            )}
            {calendarView === "availability" ? (
              <div className="staff-schedule-view" key={calendarView}>
                <AvailabilityEditor
                  dateKey={selectedDateKey}
                  availabilityDraft={availabilityDraft}
                  onDateChange={handleNavigateDate}
                  onAddShift={handleAddAvailabilityShift}
                  onUpdateShift={handleUpdateAvailabilityShift}
                  onRemoveShift={(key) => setAvailabilityDraft((previous) => previous.filter((shift) => shift.key !== key))}
                  onSaveAvailability={handleSaveAvailability}
                  availabilityError={availabilityError}
                  availabilitySaving={availabilitySaving}
                  unavailability={availabilityByDate[selectedDateKey]?.unavailabilities || []}
                  unavailabilityDraft={unavailabilityDraft}
                  onUpdateUnavailabilityDraft={handleUpdateUnavailabilityDraft}
                  onAddUnavailability={handleAddUnavailability}
                  onRemoveUnavailability={handleRemoveUnavailability}
                  unavailabilityError={unavailabilityError}
                  unavailabilitySaving={unavailabilitySaving}
                  formatDate={(date) => formatStudioDate(getStudioDateKey(date))}
                  formatTime={formatStudioTime}
                />
              </div>
            ) : (
              <StaffCalendar
                view={calendarView}
                setView={setCalendarView}
                monthCursor={monthCursor}
                onMonthChange={handleMonthChange}
                selectedDateKey={selectedDateKey}
                setSelectedDateKey={setSelectedDateKey}
                onNavigateDate={handleNavigateDate}
                appointments={appointments}
                availabilityByDate={availabilityByDate}
                todayDateKey={todayDateKey}
                onOpenAppointment={handleOpenAppointment}
                onAddAvailability={(dateKey) => openCalendarBlockModal({ type: "add", dateKey })}
                onEditBlock={(block, dateKey) => openCalendarBlockModal({ type: block.type, dateKey, block })}
              />
            )}
          </div>
        )}
      </main>

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        onClose={handleCloseAppointment}
        onSaveStatus={handleSaveAppointmentStatus}
        statusEditMode={statusEditMode}
        setStatusEditMode={setStatusEditMode}
        statusDraft={statusDraft}
        setStatusDraft={setStatusDraft}
        feeStatusDraft={feeStatusDraft}
        setFeeStatusDraft={setFeeStatusDraft}
        cancellationReason={cancellationReason}
        setCancellationReason={setCancellationReason}
        error={appointmentError}
        saving={appointmentSaving}
        formatDate={formatStudioDate}
      />

      {calendarBlockModal && (
        <CalendarBlockModal
          modal={calendarBlockModal}
          onClose={closeCalendarBlockModal}
          onSave={handleSaveCalendarBlock}
          onDelete={handleDeleteCalendarBlock}
          saving={calendarBlockSaving}
          error={calendarBlockError}
        />
      )}
    </div>
  );
}

export default StaffPortal;