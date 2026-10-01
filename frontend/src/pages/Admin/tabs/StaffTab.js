import React from "react";
import "./StaffTab.css";

function StaffTab({
  loadingStaff,
  staffList,
  setStaffModalOpen,
  handleOpenStaffModal,
}) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Staff Accounts & Credentials</h3>
          <p className="subtitle">
            Manage system logins, roles, avatars, and assigned brand access
          </p>
        </div>
        <button
          className="primary-action-btn"
          onClick={() => setStaffModalOpen(true)}
        >
          + Create Staff Account
        </button>
      </div>

      {loadingStaff ? (
        <p>Loading staff list...</p>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="staff-table-interactive">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>User ID</th>
                <th>Password Mask</th>
                <th>Assigned Brands</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((emp) => (
                <tr
                  key={emp.id}
                  className="interactive-staff-row"
                  onClick={() => handleOpenStaffModal(emp)}
                >
                  <td>
                    <div className="staff-table-cell-user">
                      <img
                        src={emp.photo}
                        alt={emp.name}
                        className="staff-table-avatar"
                      />
                      <div>
                        <strong>{emp.name}</strong>
                        <div className="role">{emp.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.userId}</td>
                  <td>
                    <span className="password-mask">{emp.password}</span>
                  </td>
                  <td>
                    <div className="brand-pills-row">
                      {emp.brands.map((bName) => (
                        <span className="brand-tag-table" key={bName}>
                          {bName}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default StaffTab;