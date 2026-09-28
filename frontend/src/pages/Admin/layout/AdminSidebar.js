import React from "react";

function AdminSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  handleTabSelect,
}) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo-text">⚡ Admin HQ</div>
        <button
          className="collapse-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? "❯" : "❮"}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => handleTabSelect("calendar")}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-label">Global Calendar</span>
        </button>

        <button
          className={`nav-item ${activeTab === "brands" ? "active" : ""}`}
          onClick={() => handleTabSelect("brands")}
        >
          <span className="nav-icon">🏛️</span>
          <span className="nav-label">Brands</span>
        </button>

        <button
          className={`nav-item ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => handleTabSelect("categories")}
        >
          <span className="nav-icon">🗂️</span>
          <span className="nav-label">Categories</span>
        </button>

        <button
          className={`nav-item ${activeTab === "services" ? "active" : ""}`}
          onClick={() => handleTabSelect("services")}
        >
          <span className="nav-icon">✨</span>
          <span className="nav-label">Service Catalog</span>
        </button>

        <button
          className={`nav-item ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => handleTabSelect("staff")}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Staff Accounts</span>
        </button>

        <button
          className={`nav-item ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => handleTabSelect("ledger")}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Appointments Ledger</span>
        </button>
      </nav>
    </aside>
  );
}

export default AdminSidebar;