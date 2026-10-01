import React from "react";
import "../Admin.css";

function AdminSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  activeTab,
  handleTabSelect,
}) {
  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-text">⚡ Admin HQ</div>
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "❯" : "❮"}
          </button>
          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
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
            className={`nav-item ${activeTab === "staff_services" ? "active" : ""}`}
            onClick={() => handleTabSelect("staff_services")}
          >
            <span className="nav-icon">🔗</span>
            <span className="nav-label">Staff Services</span>
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
    </>
  );
}

export default AdminSidebar;