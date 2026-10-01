import React from "react";
import {
  formatStudioDate,
  getCalendarBlocks,
  getMonthCells,
  shiftDateKey,
} from "../staffCalendarUtils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarBlock({ block, onClick }) {
  const isAppointment = block.type === "appointment";
  const title = isAppointment
    ? `${block.appointment.clientName} · ${block.appointment.service}`
    : block.type === "unavailable"
      ? block.period.reason || "Unavailable"
      : "Available";
  return (
    <button
      type="button"
      className={`calendar-time-block calendar-time-block-${block.type}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(block);
      }}
      title={isAppointment ? title : `${title} · Click to edit`}
    >
      <span className="calendar-time-range">{block.startLabel}–{block.endLabel}</span>
      <span className="calendar-time-label">{title}</span>
    </button>
  );
}

function StaffCalendar({
  view,
  setView,
  monthCursor,
  onMonthChange,
  selectedDateKey,
  setSelectedDateKey,
  onNavigateDate,
  appointments,
  availabilityByDate,
  todayDateKey,
  onOpenAppointment,
  onAddAvailability,
  onEditBlock,
}) {
  const monthCells = getMonthCells(monthCursor.year, monthCursor.month);
  const monthName = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(monthCursor.year, monthCursor.month, 1)));
  const selectedAvailability = availabilityByDate[selectedDateKey] || {};
  const selectedBlocks = getCalendarBlocks(
    selectedDateKey,
    selectedAvailability.availability || [],
    selectedAvailability.unavailabilities || [],
    appointments
  );

  const openBlock = (block, dateKey) => {
    if (block.type === "appointment") onOpenAppointment(block.appointment);
    else onEditBlock(block, dateKey);
  };

  const handleCellClick = (event, dateKey) => {
    if (!event.target.closest("button")) onAddAvailability(dateKey);
  };

  const handleCellKeyDown = (event, dateKey) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAddAvailability(dateKey);
    }
  };

  return (
    <div className="staff-schedule-view" key={view}>
      {view === "month" ? (
        <section className="staff-calendar-container" aria-label="Monthly calendar">
          <div className="calendar-month-bar">
            <button type="button" className="month-nav-btn" onClick={() => onMonthChange(-1)} aria-label="Previous month">
              ‹
            </button>
            <h2>{monthName} {monthCursor.year}</h2>
            <button type="button" className="month-nav-btn" onClick={() => onMonthChange(1)} aria-label="Next month">
              ›
            </button>
          </div>

          <div className="calendar-grid-scroll">
            <div className="calendar-weekdays-header">
              {WEEKDAY_LABELS.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="staff-month-grid">
              {monthCells.map((cell, index) => {
                if (!cell) return <div className="staff-day-cell is-empty" key={`empty-${index}`} />;
                const dayAvailability = availabilityByDate[cell.dateKey] || {};
                const blocks = getCalendarBlocks(
                  cell.dateKey,
                  dayAvailability.availability || [],
                  dayAvailability.unavailabilities || [],
                  appointments
                );
                return (
                  <div
                    className="staff-day-cell calendar-day-cell"
                    key={cell.dateKey}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => handleCellClick(event, cell.dateKey)}
                    onKeyDown={(event) => handleCellKeyDown(event, cell.dateKey)}
                    aria-label={`${formatStudioDate(cell.dateKey)}. Click empty space to add hours for this date.`}
                  >
                    <button
                      type="button"
                      className={`cell-day-number ${cell.dateKey === todayDateKey ? "is-today" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDateKey(cell.dateKey);
                        setView("day");
                      }}
                      aria-label={`Open ${formatStudioDate(cell.dateKey)} day view`}
                    >
                      {cell.day}
                    </button>
                    <div className="calendar-day-blocks">
                      {blocks.map((block, blockIndex) => (
                        <CalendarBlock
                          key={`${block.type}-${block.appointment?.id || block.period?.id || block.availability?.id || blockIndex}-${block.start}`}
                          block={block}
                          onClick={(selectedBlock) => openBlock(selectedBlock, cell.dateKey)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="calendar-add-hours"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddAvailability(cell.dateKey);
                      }}
                    >
                      + Hours
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="staff-day-zoom-container">
          <div className="zoom-date-picker-row">
            <button type="button" className="day-nav-btn" onClick={() => onNavigateDate(shiftDateKey(selectedDateKey, -1))} aria-label="Previous day">
              ‹
            </button>
            <label htmlFor="staff-selected-date">Day view</label>
            <input
              id="staff-selected-date"
              type="date"
              value={selectedDateKey}
              onChange={(event) => onNavigateDate(event.target.value)}
            />
            <button type="button" className="day-nav-btn" onClick={() => onNavigateDate(shiftDateKey(selectedDateKey, 1))} aria-label="Next day">
              ›
            </button>
          </div>

          <div className="day-schedule-summary">
            <h2>{formatStudioDate(selectedDateKey)}</h2>
            <button type="button" className="add-shift-btn" onClick={() => onAddAvailability(selectedDateKey)}>
              + Add hours for this date
            </button>
          </div>

          {selectedBlocks.length ? (
            <div className="day-timeline">
              {selectedBlocks.map((block, index) => (
                <CalendarBlock
                  key={`${block.type}-${block.appointment?.id || block.period?.id || block.availability?.id || index}-${block.start}`}
                  block={block}
                  onClick={(selectedBlock) => openBlock(selectedBlock, selectedDateKey)}
                />
              ))}
            </div>
          ) : (
            <button type="button" className="day-empty-add" onClick={() => onAddAvailability(selectedDateKey)}>
              No working hours or appointments. Add hours for this date.
            </button>
          )}
        </section>
      )}
    </div>
  );
}

export default StaffCalendar;