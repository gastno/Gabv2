import React from "react";
import UserAvatar from "../../../components/common/UserAvatar/UserAvatar";

function StaffProfileHeader({ name, description, avatar, onLogout }) {
  return (
    <header className="staff-top-bar">
      <div className="staff-bar-left">
        <UserAvatar src={avatar} alt={name} className="staff-profile-avatar" />
        <div className="staff-profile-copy">
          <span className="user-badge">{name}</span>
          <span className="staff-profile-caption">{description || "Staff Member"}</span>
        </div>
      </div>
      <span className="staff-brand-mark">HÚÐ &amp; BLEK</span>
      <button type="button" className="staff-admin-logout-btn" onClick={onLogout}>
        Log Out
      </button>
    </header>
  );
}

export default StaffProfileHeader;