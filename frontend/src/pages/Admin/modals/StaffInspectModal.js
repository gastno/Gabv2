import React from "react";

function StaffInspectModal({
  tempInspectStaff,
  setTempInspectStaff,
  brandsList,
  isEditMode,
  setIsEditMode,
  editAvatarPreview,
  setEditAvatarFile,
  setEditAvatarPreview,
  closeInspectModal,
  handleSaveStaffEdit,
  handleDiscardStaffChanges,
  handleToggleBrandForInspectStaff,
}) {
  return (
    <div className="admin-modal-backdrop" onClick={closeInspectModal}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={closeInspectModal}
        >
          ✕
        </button>
        <h3>Staff Account Details</h3>

        <form onSubmit={handleSaveStaffEdit} className="admin-form">
          <div className="form-group">
            <label>Profile Picture</label>
            <div
              className="avatar-preview-container"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              {editAvatarPreview || tempInspectStaff.photo ? (
                <img
                  src={editAvatarPreview || tempInspectStaff.photo}
                  alt={tempInspectStaff.name}
                  className="staff-table-avatar"
                  style={{
                    width: "56px",
                    height: "56px",
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
                  display:
                    editAvatarPreview || tempInspectStaff.photo
                      ? "none"
                      : "inline-flex",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#f0f0f0",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                }}
              >
                👤
              </span>
              {isEditMode && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setEditAvatarFile(file);
                      setEditAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={tempInspectStaff.name}
                onChange={(e) =>
                  setTempInspectStaff({
                    ...tempInspectStaff,
                    name: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">{tempInspectStaff.name}</div>
            )}
          </div>

          <div className="form-group">
            <label>Role / Title Description</label>
            {isEditMode ? (
              <input
                type="text"
                value={tempInspectStaff.description}
                onChange={(e) =>
                  setTempInspectStaff({
                    ...tempInspectStaff,
                    description: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">
                {tempInspectStaff.description}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>User ID</label>
              {isEditMode ? (
                <input
                  type="text"
                  required
                  value={tempInspectStaff.userId}
                  onChange={(e) =>
                    setTempInspectStaff({
                      ...tempInspectStaff,
                      userId: e.target.value,
                    })
                  }
                />
              ) : (
                <div className="read-only-field">{tempInspectStaff.userId}</div>
              )}
            </div>
            <div className="form-group">
              <label>Password</label>
              {isEditMode ? (
                <input
                  type="password"
                  required
                  value={tempInspectStaff.password}
                  onChange={(e) =>
                    setTempInspectStaff({
                      ...tempInspectStaff,
                      password: e.target.value,
                    })
                  }
                />
              ) : (
                <div className="read-only-field">
                  {tempInspectStaff.password}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Assigned Brands (Click to toggle)</label>
            <div className="brand-pills-selector">
              {brandsList.map((b) => {
                const isSelected = tempInspectStaff.brands.includes(b.name);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`brand-select-pill ${isSelected ? "selected" : ""} ${!isEditMode ? "disabled" : ""}`}
                    onClick={() => handleToggleBrandForInspectStaff(b.name)}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-actions-row">
            {!isEditMode ? (
              <button
                key="btn-staff-edit-toggle"
                type="button"
                className="edit-toggle-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditMode(true);
                }}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  key="btn-staff-save-submit"
                  type="submit"
                  className="save-submit-btn"
                >
                  Save Changes
                </button>
                <button
                  key="btn-staff-discard"
                  type="button"
                  className="discard-cancel-btn"
                  onClick={handleDiscardStaffChanges}
                >
                  Discard Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffInspectModal;