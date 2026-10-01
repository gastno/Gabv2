import React from "react";
import "./LedgerTab.css";

function LedgerTab({ appointments, handleStatusChange }) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Appointments Ledger</h3>
          <p className="subtitle">
            Manage appointment statuses across all active bookings
          </p>
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="admin-ledger-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Phone</th>
              <th>Staff Member</th>
              <th>Service</th>
              <th>Date / Time</th>
              <th>Price</th>
              <th>Status Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>
                  <strong>{item.clientName}</strong>
                </td>
                <td>{item.phone}</td>
                <td>{item.staffName}</td>
                <td>{item.service}</td>
                <td>
                  {item.date} @ {item.time}
                </td>
                <td>{item.price}</td>
                <td>
                  <select
                    className="status-select"
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
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