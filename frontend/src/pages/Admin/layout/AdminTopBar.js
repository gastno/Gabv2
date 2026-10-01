import React from "react";
import "../Admin.css";

function AdminTopBar({
  setMobileSidebarOpen,
  handleLogout,
}) {
  return (
    <header className="admin-top-bar">
      <div className="top-bar-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          ☰
        </button>
        <h2>Brand Dashboard</h2>
      </div>

      <div className="top-bar-right">
        <button
          type="button"
          className="admin-logout-btn"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </header>
  );
}

export default AdminTopBar;