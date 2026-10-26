import React from "react";
import "../Admin.css";
import ThemeSelector from "../../../components/common/ThemeSelector/ThemeSelector";

function AdminTopBar({
  setMobileSidebarOpen,
  handleLogout,
  theme,
  onThemeChange,
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
        <h2>Studio management</h2>
      </div>

      <div className="top-bar-right">
        <ThemeSelector theme={theme} onChange={onThemeChange} />
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