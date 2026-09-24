import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Staff.css";

function Staff() {
  const navigate = useNavigate();

  // Retrieve cached staff info
  const staffName = localStorage.getItem("auth_user_name") || "Anna María";
  const staffInfo = { name: staffName, brand: "Gabbablu" };

  // Month Navigation State
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const [currentMonthIdx, setCurrentMonthIdx] = useState(8);
  const [currentYear, setCurrentYear] = useState(2026);

  // Calendar View State
  const [calendarView, setCalendarView] = useState("month");
  const [selectedDayNum, setSelectedDayNum] = useState(15);

  // Appointments State Data
  const [appointments, setAppointments] = useState([
    {
      id: 101,
      dayNumber: 15,
      time: "10:00",
      clientName: "Guðrún Jónsdóttir",
      phone: "+354 892 1234",
      service: "Classic Lashes",
      price: "14,000 kr",
    },
    {
      id: 102,
      dayNumber: 15,
      time: "14:00",
      clientName: "Sara Pétursdóttir",
      phone: "+354 771 9876",
      service: "Brow Lamination",
      price: "11,000 kr",
    },
    {
      id: 103,
      dayNumber: 18,
      time: "11:30",
      clientName: "Katrín Eiríksdóttir",
      phone: "+354 660 4321",
      service: "Wet Lashes - Refill",
      price: "12,000 kr",
    },
  ]);

  // Modal Control States
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [slotModal, setSlotModal] = useState({ isOpen: false, dayNumber: null, mode: "appt" });

  // Form States
  const [newApptForm, setNewApptForm] = useState({
    time: "09:00",
    clientName: "",
    phone: "",
    service: "Classic Lashes",
    price: "14,000 kr",
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
  });

  const daysArray = Array.from({ length: 30 }, (_, i) => i + 1);

  // Handlers
  const handlePrevMonth = () => {
    if (currentMonthIdx === 0) {
      setCurrentMonthIdx(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonthIdx((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIdx === 11) {
      setCurrentMonthIdx(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonthIdx((prev) => prev + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("auth_user_name");
    navigate("/staff-login");
  };

  const handleOpenApptModal = (appt) => {
    setSelectedAppt({ ...appt });
    setIsEditMode(false);
  };

  const handleCloseApptModal = () => {
    setSelectedAppt(null);
    setIsEditMode(false);
  };

  const handleEditApptSave = (e) => {
    e.preventDefault();
    setAppointments((prev) =>
      prev.map((item) => (item.id === selectedAppt.id ? selectedAppt : item))
    );
    setIsEditMode(false);
    setSelectedAppt(null);
  };

  const handleCancelAppt = (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      setAppointments((prev) => prev.filter((item) => item.id !== id));
      handleCloseApptModal();
    }
  };

  const handleCreateSlotItem = (e) => {
    e.preventDefault();
    if (slotModal.mode === "appt") {
      const newEntry = {
        id: Date.now(),
        dayNumber: slotModal.dayNumber,
        ...newApptForm,
      };
      setAppointments((prev) => [...prev, newEntry]);
    } else {
      alert(`Availability set for Day ${slotModal.dayNumber} from ${availabilityForm.startTime} to ${availabilityForm.endTime}`);
    }
    setSlotModal({ isOpen: false, dayNumber: null, mode: "appt" });
  };

  return (
    <div className="staff-page">
      {/* HEADER */}
      <header className="staff-top-bar">
        <div className="staff-bar-left">
          <span className="user-badge">👤 {staffInfo.name}</span>
        </div>
        <div className="staff-bar-right">
          <span className="brand-badge">✨ {staffInfo.brand}</span>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      {/* DASHBOARD */}
      <main className="staff-content">
        <div className="schedule-header-controls">
          <div>
            <h1>Staff Dashboard</h1>
            <p className="schedule-subtitle">Manage appointments & working hours</p>
          </div>

          <div className="view-toggle-buttons">
            <button
              className={`toggle-btn ${calendarView === "month" ? "active" : ""}`}
              onClick={() => setCalendarView("month")}
            >
              Month View
            </button>
            <button
              className={`toggle-btn ${calendarView === "day" ? "active" : ""}`}
              onClick={() => setCalendarView("day")}
            >
              Zoom / Day View
            </button>
          </div>
        </div>

        {/* MONTH VIEW */}
        {calendarView === "month" && (
          <div className="staff-calendar-container">
            <div className="calendar-month-bar">
              <button
                type="button"
                className="month-nav-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                ‹
              </button>
              <h2>{months[currentMonthIdx]} {currentYear}</h2>
              <button
                type="button"
                className="month-nav-btn"
                onClick={handleNextMonth}
                title="Next Month"
              >
                ›
              </button>
            </div>

            <div className="calendar-weekdays-header">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            <div className="staff-month-grid">
              {daysArray.map((dayNum) => {
                const dayAppts = appointments.filter((a) => a.dayNumber === dayNum);
                return (
                  <div
                    key={dayNum}
                    className="staff-day-cell"
                    onClick={(e) => {
                      if (e.target.className.includes("staff-day-cell")) {
                        setSlotModal({ isOpen: true, dayNumber: dayNum, mode: "appt" });
                      }
                    }}
                  >
                    <div className="cell-day-number">
                      <span>{dayNum}</span>
                      <button
                        className="quick-add-btn"
                        title="Add appointment or set availability"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlotModal({ isOpen: true, dayNumber: dayNum, mode: "appt" });
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="cell-appts-list">
                      {dayAppts.map((appt) => (
                        <div
                          key={appt.id}
                          className="appt-chip"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenApptModal(appt);
                          }}
                        >
                          <span className="chip-time">{appt.time}</span>
                          <span className="chip-name">{appt.clientName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {calendarView === "day" && (
          <div className="staff-day-zoom-container">
            <div className="zoom-date-picker-row">
              <label>Select Day to Inspect:</label>
              <select
                value={selectedDayNum}
                onChange={(e) => setSelectedDayNum(Number(e.target.value))}
              >
                {daysArray.map((d) => (
                  <option key={d} value={d}>
                    {months[currentMonthIdx]} {d}, {currentYear}
                  </option>
                ))}
              </select>
            </div>

            <div className="detailed-hours-list">
              {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(
                (hourStr) => {
                  const matchedAppt = appointments.find(
                    (a) => a.dayNumber === selectedDayNum && a.time === hourStr
                  );

                  return (
                    <div key={hourStr} className="hour-slot-row">
                      <div className="time-column">{hourStr}</div>
                      <div className="slot-column">
                        {matchedAppt ? (
                          <div
                            className="zoom-appt-card"
                            onClick={() => handleOpenApptModal(matchedAppt)}
                          >
                            <div className="zoom-appt-title">
                              <strong>{matchedAppt.clientName}</strong> - {matchedAppt.service}
                            </div>
                            <div className="zoom-appt-details">
                              <span>📞 {matchedAppt.phone}</span>
                              <span className="zoom-price">{matchedAppt.price}</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="empty-slot-btn"
                            onClick={() =>
                              setSlotModal({ isOpen: true, dayNumber: selectedDayNum, mode: "appt" })
                            }
                          >
                            + Slot Open (Click to set appointment or working hours)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </main>

      {/* APPOINTMENT MODAL */}
      {selectedAppt && (
        <div className="staff-modal-backdrop" onClick={handleCloseApptModal}>
          <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="staff-modal-close" onClick={handleCloseApptModal}>✕</button>
            <h2>Appointment & Client Details</h2>
            <p className="staff-modal-subtitle">
              {months[currentMonthIdx]} {selectedAppt.dayNumber}, {currentYear} at {selectedAppt.time}
            </p>

            <form onSubmit={handleEditApptSave} className="staff-edit-form">
              <div className="client-info-box">
                <h4>Client Information</h4>
                <p><strong>Name:</strong> {selectedAppt.clientName}</p>
                <p><strong>Phone:</strong> {selectedAppt.phone}</p>
              </div>

              <div className="form-group">
                <label>Appointment Type / Service</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={selectedAppt.service}
                    onChange={(e) => setSelectedAppt({ ...selectedAppt, service: e.target.value })}
                    required
                  />
                ) : (
                  <div className="read-only-field">{selectedAppt.service}</div>
                )}
              </div>

              <div className="form-group">
                <label>Price</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={selectedAppt.price}
                    onChange={(e) => setSelectedAppt({ ...selectedAppt, price: e.target.value })}
                    required
                  />
                ) : (
                  <div className="read-only-field">{selectedAppt.price}</div>
                )}
              </div>

              <div className="modal-actions-row">
                {!isEditMode ? (
                  <button
                    type="button"
                    className="edit-toggle-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditMode(true);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                )}

                <button
                  type="button"
                  className="cancel-appt-btn"
                  onClick={() => handleCancelAppt(selectedAppt.id)}
                >
                  Cancel Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW SLOT / AVAILABILITY MODAL */}
      {slotModal.isOpen && (
        <div className="staff-modal-backdrop" onClick={() => setSlotModal({ isOpen: false, dayNumber: null, mode: "appt" })}>
          <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="staff-modal-close"
              onClick={() => setSlotModal({ isOpen: false, dayNumber: null, mode: "appt" })}
            >
              ✕
            </button>

            <div className="mode-tabs-header">
              <button
                type="button"
                className={`mode-tab ${slotModal.mode === "appt" ? "active" : ""}`}
                onClick={() => setSlotModal({ ...slotModal, mode: "appt" })}
              >
                Set Appointment
              </button>
              <button
                type="button"
                className={`mode-tab ${slotModal.mode === "availability" ? "active" : ""}`}
                onClick={() => setSlotModal({ ...slotModal, mode: "availability" })}
              >
                Set Working Hours
              </button>
            </div>

            {slotModal.mode === "appt" ? (
              <form onSubmit={handleCreateSlotItem} className="staff-edit-form">
                <h3>Book Appointment ({months[currentMonthIdx]} {slotModal.dayNumber})</h3>

                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="text"
                    required
                    value={newApptForm.time}
                    onChange={(e) => setNewApptForm({ ...newApptForm, time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={newApptForm.clientName}
                    onChange={(e) => setNewApptForm({ ...newApptForm, clientName: e.target.value })}
                    placeholder="e.g. Birta Helgadóttir"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newApptForm.phone}
                    onChange={(e) => setNewApptForm({ ...newApptForm, phone: e.target.value })}
                    placeholder="e.g. +354 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label>Service Type</label>
                  <input
                    type="text"
                    required
                    value={newApptForm.service}
                    onChange={(e) => setNewApptForm({ ...newApptForm, service: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="text"
                    required
                    value={newApptForm.price}
                    onChange={(e) => setNewApptForm({ ...newApptForm, price: e.target.value })}
                  />
                </div>

                <button type="submit" className="save-btn">Confirm & Log Appointment</button>
              </form>
            ) : (
              <form onSubmit={handleCreateSlotItem} className="staff-edit-form">
                <h3>Set Available Working Hours</h3>

                <div className="form-group">
                  <label>Shift Start Time</label>
                  <input
                    type="text"
                    required
                    value={availabilityForm.startTime}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Shift End Time</label>
                  <input
                    type="text"
                    required
                    value={availabilityForm.endTime}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })}
                  />
                </div>

                <button type="submit" className="save-btn">Save Availability</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;