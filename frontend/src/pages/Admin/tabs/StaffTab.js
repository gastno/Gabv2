import React from "react";

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
            Manage employee portal logins, roles, and assigned brands
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
        <p>Loading staff accounts from database...</p>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="admin-ledger-table staff-table-interactive">
            <thead>
              <tr>
                <th>Member</th>
                <th>Full Name</th>
                <th>Role / Title</th>
                <th>User ID</th>
                <th>Password</th>
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
                  <td style={{ verticalAlign: "middle" }}>
                    {emp.photo ? (
                      <img
                        src={emp.photo}
                        alt={emp.name}
                        className="staff-table-avatar"
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
                        display: emp.photo ? "none" : "inline-flex",
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
                  </td>
                  <td>
                    <strong>{emp.name}</strong>
                  </td>
                  <td>{emp.description}</td>
                  <td>
                    <code>{emp.userId}</code>
                  </td>
                  <td>
                    <span className="password-mask">{emp.password}</span>
                  </td>
                  <td>
                    <div className="brand-pills-row">
                      {emp.brands.map((brandName) => (
                        <span key={brandName} className="brand-tag-table">
                          {brandName}
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