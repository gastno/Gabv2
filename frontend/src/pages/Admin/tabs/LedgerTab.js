import React from "react";

function LedgerTab({ appointments, handleStatusChange }) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Master Appointments Ledger</h3>
          <p className="subtitle">
            Track completed, pending, and cancelled bookings
          </p>
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="admin-ledger-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date/Time</th>
              <th>Client Info</th>
              <th>Service</th>
              <th>Specialist</th>
              <th>Price</th>
              <th>Status Lifecycle</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td>#{appt.id}</td>
                <td>
                  {appt.date} - {appt.time}
                </td>
                <td>
                  <strong>{appt.clientName}</strong>
                  <br />
                  <small>{appt.phone}</small>
                </td>
                <td>{appt.service}</td>
                <td>{appt.staffName}</td>
                <td>{appt.price}</td>
                <td>
                  <select
                    className={`status-select status-${appt.status.toLowerCase()}`}
                    value={appt.status}
                    onChange={(e) =>
                      handleStatusChange(appt.id, e.target.value)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default LedgerTab;