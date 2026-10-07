import React, { useEffect, useMemo, useState } from "react";
import { apptApi, staffAvailabilityApi } from "../../../services/api";
import {
  dateKeyFromParts,
  formatStudioDate,
  getCalendarBlocks,
  getMonthCells,
  getStudioDateKey,
  formatStudioTime,
  normalizeAppointment,
  shiftDateKey,
} from "../../Staff/staffCalendarUtils";
import "./CalendarTab.css";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STAFF_COLORS = [
  "#9d4edd",
  "#2a9d8f",
  "#e76f51",
  "#457b9d",
  "#e9c46a",
  "#d45087",
  "#6c9a5c",
  "#577590",
  "#f4a261",
  "#7b6d8d",
];

function getInitialMonth() {
  const [year, month] = getStudioDateKey(new Date()).split("-").map(Number);
  return { year, month: month - 1 };
}

function CalendarEvent({ block, dateKey, compact = false, onClick }) {
  const title = block.type === "appointment"
    ? `${block.appointment.clientName} · ${block.appointment.service}`
    : block.type === "unavailable"
      ? block.period.reason || "Unavailable"
      : "Available";

  return (
    <button
      type="button"
      className={`admin-calendar-event event-${block.type}${compact ? " is-compact" : ""}`}
      style={{ "--staff-calendar-color": block.staffColor }}
      title={`${block.staffName}: ${title}`}
      aria-label={`View ${block.staffName}'s ${block.type} block on ${formatStudioDate(dateKey)} from ${block.startLabel} to ${block.endLabel}`}
      onClick={() => onClick(block, dateKey)}
    >
      <span className="admin-calendar-event-time">
        {block.startLabel}–{block.endLabel}
      </span>
      <span className="admin-calendar-event-staff">{block.staffName}</span>
      <span className="admin-calendar-event-title">{title}</span>
      {block.type === "appointment" && (
        <span className={`admin-calendar-event-status status-${block.appointment.status}`}>
          {block.appointment.status.replace(/_/g, " ")}
        </span>
      )}
    </button>
  );
}

function CalendarBlockDetailsModal({ block, dateKey, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isAppointment = block.type === "appointment";
  const isUnavailable = block.type === "unavailable";
  const appointment = block.appointment;
  const period = block.period;
  const title = isAppointment
    ? appointment.clientName
    : isUnavailable
      ? period.reason || "Unavailable time"
      : "Available hours";
  const details = [
    ["Staff member", block.staffName],
    ["Date", formatStudioDate(dateKey)],
    ["Time", `${block.startLabel}–${block.endLabel}`],
  ];

  if (isAppointment) {
    details.push(
      ["Customer", appointment.clientName],
      ["Service", appointment.service],
      ["Phone", appointment.phone],
      ["Email", appointment.email || "Unavailable"],
      ["Price", appointment.price],
      ["Appointment status", appointment.status.replace(/_/g, " ")],
      ["Fee status", (appointment.fee_status || "unknown").replace(/_/g, " ")],
      ["Payment status", (appointment.payment_status || "unknown").replace(/_/g, " ")]
    );
  } else if (isUnavailable) {
    details.push(["Reason", period.reason || "Not specified"]);
    if (period.block_start && period.block_end) {
      details.push([
        "Unavailable period",
        `${formatStudioDate(getStudioDateKey(period.block_start))} ${formatStudioTime(period.block_start)}–${formatStudioDate(getStudioDateKey(period.block_end))} ${formatStudioTime(period.block_end)}`,
      ]);
    }
  } else if (block.availability) {
    details.push(["Availability", "Scheduled working hours"]);
  }

  return (
    <div className="admin-calendar-modal-backdrop" onClick={onClose}>
      <section
        className="admin-calendar-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-calendar-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-calendar-modal-close"
          onClick={onClose}
          aria-label="Close block details"
        >
          ×
        </button>
        <p className="admin-calendar-modal-eyebrow">
          {isAppointment ? "Appointment" : isUnavailable ? "Unavailable time" : "Staff availability"}
        </p>
        <h2 id="admin-calendar-modal-title">{title}</h2>
        <dl className="admin-calendar-details-list">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="admin-calendar-modal-done" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}

function CalendarTab({ brands, loadingBrand, staffList, loadingStaff }) {
  const [monthCursor, setMonthCursor] = useState(getInitialMonth);
  const [view, setView] = useState("month");
  const [selectedDateKey, setSelectedDateKey] = useState(getStudioDateKey(new Date()));
  const [selectedBrandId, setSelectedBrandId] = useState("all");
  const [selectedStaffId, setSelectedStaffId] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [availabilityByStaffDate, setAvailabilityByStaffDate] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selectedBlock, setSelectedBlock] = useState(null);

  const selectedBrands = useMemo(
    () => selectedBrandId === "all"
      ? brands
      : brands.filter((brand) => String(brand.id) === selectedBrandId),
    [brands, selectedBrandId]
  );
  const filteredStaff = useMemo(() => staffList.filter((staff) => (
    selectedBrandId === "all"
      || (staff.brands || []).includes(selectedBrands[0]?.name)
  )), [selectedBrandId, selectedBrands, staffList]);
  const visibleStaff = useMemo(
    () => selectedStaffId === "all"
      ? filteredStaff
      : filteredStaff.filter((staff) => String(staff.id) === selectedStaffId),
    [filteredStaff, selectedStaffId]
  );
  const staffFilterKey = visibleStaff.map((staff) => staff.id).join(",");
  const monthCells = getMonthCells(monthCursor.year, monthCursor.month);
  const monthName = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(monthCursor.year, monthCursor.month, 1)));
  const todayDateKey = getStudioDateKey(new Date());

  useEffect(() => {
    if (loadingBrand) {
      setAppointmentsLoading(true);
      setAppointmentsError("");
      return undefined;
    }
    if (selectedBrands.length === 0) {
      setAppointments([]);
      setAppointmentsLoading(false);
      setAppointmentsError("Could not resolve the selected brand selection.");
      return undefined;
    }

    let isMounted = true;
    setAppointmentsLoading(true);
    setAppointmentsError("");
    setAppointments([]);
    Promise.all(selectedBrands.map(async (brand) => {
      const result = await apptApi.listAppointments(brand.id);
      if (!Array.isArray(result?.appointments)) {
        throw new Error(`The appointments response for ${brand.name} was not in the expected format.`);
      }
      return result.appointments;
    }))
      .then((brandAppointments) => {
        if (!isMounted) return;
        setAppointments(brandAppointments.flat().map(normalizeAppointment));
      })
      .catch((error) => {
        if (isMounted) {
          setAppointments([]);
          setAppointmentsError(error.message || "Could not load appointments.");
        }
      })
      .finally(() => {
        if (isMounted) setAppointmentsLoading(false);
      });
    return () => { isMounted = false; };
  }, [loadingBrand, selectedBrands]);

  useEffect(() => {
    if (loadingBrand || loadingStaff || !staffFilterKey) {
      setAvailabilityByStaffDate({});
      setAvailabilityLoading(Boolean(loadingBrand || loadingStaff));
      setAvailabilityError("");
      return undefined;
    }

    const dateKeys = getMonthCells(monthCursor.year, monthCursor.month)
      .filter(Boolean)
      .map((cell) => cell.dateKey);
    const requests = visibleStaff.flatMap((staff) => {
      const staffBrand = selectedBrands.find((brand) => (staff.brands || []).includes(brand.name));
      if (!staffBrand) return [];
      return dateKeys.map((date) => ({
        staff,
        date,
        key: `${staff.id}:${date}`,
        request: staffAvailabilityApi.getForStaff(staff.id, staffBrand.id, date),
      }));
    });
    let isMounted = true;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    setAvailabilityByStaffDate({});

    Promise.allSettled(requests.map(({ request }) => request))
      .then((results) => {
        if (!isMounted) return;
        const updates = {};
        const errors = [];
        results.forEach((result, index) => {
          const request = requests[index];
          if (result.status === "fulfilled") {
            const { availability, unavailabilities } = result.value || {};
            if (!Array.isArray(availability) || !Array.isArray(unavailabilities)) {
              errors.push(`${request.staff.name} · ${request.date}: availability response was not in the expected format.`);
              return;
            }
            updates[request.key] = { availability, unavailabilities };
          } else {
            errors.push(`${request.staff.name} · ${request.date}: ${result.reason?.message || "Could not load availability."}`);
          }
        });
        setAvailabilityByStaffDate(updates);
        if (errors.length) {
          const shownErrors = errors.slice(0, 3);
          const additionalErrorCount = errors.length - shownErrors.length;
          setAvailabilityError([
            ...shownErrors,
            ...(additionalErrorCount ? [`And ${additionalErrorCount} more availability request(s) failed.`] : []),
          ].join(" "));
        }
      })
      .finally(() => {
        if (isMounted) setAvailabilityLoading(false);
      });
    return () => { isMounted = false; };
  }, [filteredStaff, loadingBrand, loadingStaff, monthCursor.month, monthCursor.year, selectedBrands, staffFilterKey, visibleStaff]);

  const getEventsForDate = (dateKey) => visibleStaff.flatMap((staff) => {
    const staffIndex = filteredStaff.findIndex((item) => String(item.id) === String(staff.id));
    const staffData = availabilityByStaffDate[`${staff.id}:${dateKey}`] || {};
    const staffAppointments = appointments.filter(
      (appointment) => String(appointment.staff_id) === String(staff.id)
    );
    return getCalendarBlocks(
      dateKey,
      staffData.availability || [],
      staffData.unavailabilities || [],
      staffAppointments
    ).map((block) => ({
      ...block,
      staffName: staff.name,
      staffColor: STAFF_COLORS[staffIndex % STAFF_COLORS.length],
      staffIndex,
      dateKey,
    }));
  }).sort((left, right) => left.start - right.start || left.staffIndex - right.staffIndex);

  const updateSelectedDate = (dateKey) => {
    setSelectedDateKey(dateKey);
    const [year, month] = dateKey.split("-").map(Number);
    if (year !== monthCursor.year || month - 1 !== monthCursor.month) {
      setMonthCursor({ year, month: month - 1 });
    }
  };

  const changeMonth = (offset) => {
    const nextMonth = new Date(Date.UTC(monthCursor.year, monthCursor.month + offset, 1));
    const year = nextMonth.getUTCFullYear();
    const month = nextMonth.getUTCMonth();
    setMonthCursor({ year, month });
    updateSelectedDate(dateKeyFromParts(year, month + 1, 1));
  };

  const dataLoading = appointmentsLoading || availabilityLoading;
  const brandLoading = loadingBrand || loadingStaff;

  return (
    <section className="admin-section admin-calendar-section">
      <div className="section-header">
        <div>
          <h3>Global Calendar</h3>
          <p className="subtitle">
            Appointments and working hours for {selectedBrandId === "all"
              ? "all staff across all brands"
              : `${selectedBrands[0]?.name || "selected brand"} staff`}
          </p>
        </div>
      </div>

      <div className="admin-calendar-toolbar">
        <div className="admin-calendar-filter-group">
          <label className="admin-calendar-filter">
            <span>Filter by brand</span>
            <select
              aria-label="Filter calendar by brand"
              value={selectedBrandId}
              onChange={(event) => {
                setSelectedBrandId(event.target.value);
                setSelectedStaffId("all");
              }}
            >
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={String(brand.id)}>{brand.name}</option>
              ))}
            </select>
          </label>
          <label className="admin-calendar-filter">
            <span>Filter by staff</span>
            <select
              aria-label="Filter calendar by staff"
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
            >
              <option value="all">All staff</option>
              {filteredStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-calendar-view-toggle" role="group" aria-label="Calendar view">
          <button type="button" className={view === "month" ? "active" : ""} onClick={() => setView("month")}>
            Month
          </button>
          <button type="button" className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
            Day
          </button>
        </div>
      </div>

      <div className="admin-calendar-legend" aria-label="Staff color key">
        {visibleStaff.map((staff) => {
          const staffIndex = filteredStaff.findIndex((item) => String(item.id) === String(staff.id));
          return (
            <span className="admin-calendar-legend-item" key={staff.id}>
              <span
                className="admin-calendar-legend-swatch"
                style={{ "--staff-calendar-color": STAFF_COLORS[staffIndex % STAFF_COLORS.length] }}
                aria-hidden="true"
              />
              {staff.name}
            </span>
          );
        })}
      </div>

      {brandLoading && <p className="admin-calendar-message">Loading staff and brand details…</p>}
      {appointmentsError && <p className="admin-calendar-message is-error" role="alert">{appointmentsError}</p>}
      {availabilityError && <p className="admin-calendar-message is-error" role="alert">{availabilityError}</p>}
      {dataLoading && <p className="admin-calendar-message" role="status">Loading calendar appointments and staff availability…</p>}

      {view === "month" ? (
        <section
          className="admin-global-calendar admin-calendar-transition"
          aria-label="Monthly staff calendar"
          key={`${view}-${selectedBrandId}-${selectedStaffId}`}
        >
          <div className="calendar-month-bar">
            <button type="button" className="month-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
              ‹
            </button>
            <h2>{monthName} {monthCursor.year}</h2>
            <button type="button" className="month-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">
              ›
            </button>
          </div>
          <div className="admin-calendar-grid-scroll">
            <div className="admin-calendar-weekdays">
              {WEEKDAY_LABELS.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="admin-global-month-grid">
              {monthCells.map((cell, index) => {
                if (!cell) return <div className="admin-calendar-day is-empty" key={`empty-${index}`} />;
                const events = getEventsForDate(cell.dateKey);
                return (
                  <div className="admin-calendar-day" key={cell.dateKey}>
                    <button
                      type="button"
                      className={`admin-calendar-day-number${cell.dateKey === todayDateKey ? " is-today" : ""}`}
                      onClick={() => {
                        updateSelectedDate(cell.dateKey);
                        setView("day");
                      }}
                      aria-label={`Open ${formatStudioDate(cell.dateKey)} day view`}
                    >
                      {cell.day}
                    </button>
                    <div className="admin-calendar-day-events">
                      {events.map((block, blockIndex) => (
                        <CalendarEvent
                          key={`${block.staffIndex}-${block.type}-${block.appointment?.id || block.period?.id || block.availability?.id || blockIndex}-${block.start}`}
                          block={block}
                          dateKey={cell.dateKey}
                          onClick={(selectedBlock, selectedDate) => setSelectedBlock({ block: selectedBlock, dateKey: selectedDate })}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section
          className="admin-global-day-view admin-calendar-transition"
          aria-label="Daily staff calendar"
          key={`${view}-${selectedBrandId}-${selectedStaffId}`}
        >
          <div className="admin-calendar-day-nav">
            <button type="button" className="day-nav-btn" onClick={() => updateSelectedDate(shiftDateKey(selectedDateKey, -1))} aria-label="Previous day">
              ‹
            </button>
            <label htmlFor="admin-calendar-selected-date">Day view</label>
            <input
              id="admin-calendar-selected-date"
              type="date"
              value={selectedDateKey}
              onChange={(event) => updateSelectedDate(event.target.value)}
            />
            <button type="button" className="day-nav-btn" onClick={() => updateSelectedDate(shiftDateKey(selectedDateKey, 1))} aria-label="Next day">
              ›
            </button>
          </div>
          <h2>{formatStudioDate(selectedDateKey)}</h2>
          {getEventsForDate(selectedDateKey).length ? (
            <div className="admin-calendar-day-timeline">
              {getEventsForDate(selectedDateKey).map((block, index) => (
                <CalendarEvent
                  key={`${block.staffIndex}-${block.type}-${block.appointment?.id || block.period?.id || block.availability?.id || index}-${block.start}`}
                  block={block}
                  dateKey={selectedDateKey}
                  onClick={(selectedBlock, dateKey) => setSelectedBlock({ block: selectedBlock, dateKey })}
                />
              ))}
            </div>
          ) : (
            <p className="admin-calendar-message">
              {visibleStaff.length ? "No appointments or staff availability for this date." : "No staff members are assigned to this brand."}
            </p>
          )}
        </section>
      )}

      <div className="admin-calendar-staff-list" aria-label="Staff in calendar">
        {visibleStaff.map((staff) => {
          const staffIndex = filteredStaff.findIndex((item) => String(item.id) === String(staff.id));
          return (
            <div className="admin-calendar-staff-card" key={staff.id}>
              <span
                className="admin-calendar-staff-color"
                style={{ "--staff-calendar-color": STAFF_COLORS[staffIndex % STAFF_COLORS.length] }}
                aria-hidden="true"
              />
              <UserAvatar src={staff.photo} alt={staff.name} className="staff-thumb" />
              <div>
                <h4>{staff.name}</h4>
                <span className="staff-role">{staff.description}</span>
              </div>
            </div>
          );
        })}
      </div>
      {selectedBlock && (
        <CalendarBlockDetailsModal
          block={selectedBlock.block}
          dateKey={selectedBlock.dateKey}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </section>
  );
}

export default CalendarTab;
