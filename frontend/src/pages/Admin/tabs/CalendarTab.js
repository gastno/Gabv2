import React from "react";
import "./CalendarTab.css";

function CalendarTab({ selectedBrand, staffList, appointments }) {
  const filteredStaff = staffList.filter(
    (s) => !selectedBrand || s.brands.includes(selectedBrand)
  );

  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Master Schedule</h3>
          <p className="subtitle">
            Daily appointment queue across all staff for {selectedBrand}
          </p>
        </div>
      </div>

      <div className="master-calendar-grid">
        {filteredStaff.map((staff) => {
          const staffAppts = appointments.filter(
            (a) => a.staffName === staff.name
          );

          return (
            <div className="staff-calendar-column" key={staff.id}>
              <div className="staff-column-header">
                <img
                  src={staff.photo}
                  alt={staff.name}
                  className="staff-thumb"
                />
                <div>
                  <h4>{staff.name}</h4>
                  <span className="staff-role">{staff.description}</span>
                </div>
              </div>

              <div className="column-slots-list">
                {staffAppts.length === 0 ? (
                  <p className="no-appts-text">No bookings today</p>
                ) : (
                  staffAppts.map((appt) => (
                    <div
                      className={`admin-appt-card status-${appt.status.toLowerCase()}`}
                      key={appt.id}
                    >
                      <div className="card-top-row">
                        <span className="card-time">{appt.time}</span>
                        <span
                          className={`status-pill ${appt.status.toLowerCase()}`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <div className="card-client">{appt.clientName}</div>
                      <div className="card-service-info">
                        {appt.service} ({appt.price})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CalendarTab;