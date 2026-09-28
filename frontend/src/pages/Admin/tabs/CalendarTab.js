import React from "react";

function CalendarTab({ selectedBrand, staffList, appointments }) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Master Schedule ({selectedBrand})</h3>
          <p className="subtitle">
            All staff appointments across store locations
          </p>
        </div>
      </div>

      <div className="master-calendar-grid">
        {staffList.map((staff) => {
          const staffAppts = appointments.filter(
            (a) => a.staffName === staff.name && a.brand === selectedBrand
          );

          return (
            <div className="staff-calendar-column" key={staff.id}>
              <div className="staff-column-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {staff.photo ? (
                    <img
                      src={staff.photo}
                      alt={staff.name}
                      className="staff-thumb"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling)
                          e.target.nextSibling.style.display = "inline-flex";
                      }}
                    />
                  ) : null}
                  <span
                    className="avatar-emoji-fallback"
                    style={{
                      display: staff.photo ? "none" : "inline-flex",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    👤
                  </span>
                  <div>
                    <h4>{staff.name}</h4>
                    <span className="staff-role">{staff.description}</span>
                  </div>
                </div>
              </div>

              <div className="column-slots-list">
                {staffAppts.map((appt) => (
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
                    <div className="card-client-name">{appt.clientName}</div>
                    <div className="card-service">{appt.service}</div>
                    <div className="card-price">{appt.price}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CalendarTab;