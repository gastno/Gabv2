import React from "react";
import UserAvatar from "../../../components/common/UserAvatar/UserAvatar";
import ThemeSelector from "../../../components/common/ThemeSelector/ThemeSelector";
import StaffNotifications from "./StaffNotifications";

function StaffProfileHeader({ name, description, avatar, onLogout, theme, onThemeChange }) {
  return (
    <header className="staff-top-bar">
      <div className="staff-bar-left">
        <UserAvatar src={avatar} alt={name} className="staff-profile-avatar" />
        <div className="staff-profile-copy">
          <span className="user-badge">{name}</span>
          <span className="staff-profile-caption">{description || "Staff Member"}</span>
        </div>
      </div>
      <span className="staff-brand-mark">
        <img src="/gbbco.svg" alt="" aria-hidden="true" />
        <span>gbb &amp; co</span>
      </span>
      <div className="staff-header-actions">
        <StaffNotifications />
        <ThemeSelector theme={theme} onChange={onThemeChange} />
        <button type="button" className="staff-admin-logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}

export default StaffProfileHeader;