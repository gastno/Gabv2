import React from "react";
import "./AdminModals.css";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";

function StaffInspectModal({
  tempInspectStaff,
  setTempInspectStaff,
  brandsList,
  services,
  assignedServiceIds,
  setAssignedServiceIds,
  isEditMode,
  setIsEditMode,
  editAvatarPreview,
  setEditAvatarPreview,
  setEditAvatarFile,
  handleToggleBrandForInspectStaff,
  closeInspectModal,
  handleSaveStaffEdit,
  handleDiscardStaffChanges,
}) {
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditAvatarFile(file);
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleService = (serviceId) => {
    if (!isEditMode) return;
    setAssignedServiceIds((prev) =>
      prev.some((id) => String(id) === String(serviceId))
        ? prev.filter((id) => String(id) !== String(serviceId))
        : [...prev, serviceId]
    );
  };

  const availableServices = services.filter((service) =>
    tempInspectStaff.brands.includes(service.brand)
  );

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
          <div className="form-group" style={{ textAlign: "center" }}>
            <UserAvatar
              src={editAvatarPreview || tempInspectStaff.photo}
              alt={tempInspectStaff.name}
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
            />
            {isEditMode && (
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ marginTop: 8 }}
              />
            )}
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
            <label>User ID / Username</label>
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
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
                value={tempInspectStaff.password || ""}
                onChange={(e) =>
                  setTempInspectStaff({
                    ...tempInspectStaff,
                    password: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">••••••••</div>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
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

          <div className="form-group">
            <label>Assigned Brands</label>
            <div className="brand-pills-selector">
              {brandsList.map((b) => {
                const isSelected = tempInspectStaff.brands.includes(b.name);
                return (
                  <button
                    type="button"
                    key={b.id}
                    className={`brand-select-pill ${
                      isSelected ? "selected" : ""
                    } ${!isEditMode ? "disabled" : ""}`}
                    onClick={() => handleToggleBrandForInspectStaff(b.name)}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Assigned Services</label>
            {availableServices.length === 0 ? (
              <div className="read-only-field">
                No services available for the assigned brands.
              </div>
            ) : (
              <div className="brand-pills-selector">
                {availableServices.map((srv) => {
                  const isAssigned = assignedServiceIds.some(
                    (id) => String(id) === String(srv.id)
                  );
                  return (
                    <button
                      type="button"
                      key={srv.id}
                      className={`brand-select-pill ${
                        isAssigned ? "selected" : ""
                      } ${!isEditMode ? "disabled" : ""}`}
                      onClick={() => handleToggleService(srv.id)}
                    >
                      {srv.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-actions-row">
            {!isEditMode ? (
              <button
                type="button"
                className="edit-toggle-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setTempInspectStaff((staff) => ({ ...staff, password: "" }));
                  setIsEditMode(true);
                }}
              >
                Edit
              </button>
            ) : (
              <>
                <button type="submit" className="save-submit-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="discard-cancel-btn"
                  onClick={handleDiscardStaffChanges}
                >
                  Discard
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