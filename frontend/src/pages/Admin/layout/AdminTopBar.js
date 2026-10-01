import React from "react";
import "../Admin.css";

function AdminTopBar({
  setMobileSidebarOpen,
  selectedBrand,
  setSelectedBrand,
  brandsList,
  handleLogout,
}) {
  return (
    <header className="admin-top-bar">
      <div className="top-bar-left">
        <button
          className="mobile-menu-trigger"
          onClick={() => setMobileSidebarOpen(true)}
        >
          ☰
        </button>
        <h2>Brand Dashboard</h2>
      </div>

      <div className="top-bar-right">
        <label className="brand-select-label">Brand:</label>
        <select
          className="brand-select"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          {brandsList.map((b) => (
            <option key={b.id || b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
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