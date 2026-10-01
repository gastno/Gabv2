import React from "react";
import "./AdminModals.css";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";

function CreateStaffModal({
  newStaff,
  setNewStaff,
  brandsList,
  createAvatarPreview,
  setCreateAvatarPreview,
  setCreateAvatarFile,
  handleToggleBrandForNewStaff,
  setStaffModalOpen,
  handleAddStaff,
}) {
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCreateAvatarFile(file);
      if (createAvatarPreview) URL.revokeObjectURL(createAvatarPreview);
      setCreateAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={() => setStaffModalOpen(false)}
    >
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={() => setStaffModalOpen(false)}
        >
          ✕
        </button>
        <h3>Create Staff Account</h3>

        <form onSubmit={handleAddStaff} className="admin-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sólveig Jónsdóttir"
              value={newStaff.name}
              onChange={(e) =>
                setNewStaff({ ...newStaff, name: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>User ID / Login Username</label>
              <input
                type="text"
                required
                placeholder="solveig"
                value={newStaff.userId}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, userId: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Initial Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newStaff.password}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Role Title / Description</label>
            <input
              type="text"
              placeholder="e.g. Senior Lash Artist"
              value={newStaff.description}
              onChange={(e) =>
                setNewStaff({ ...newStaff, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Assigned Brand Access</label>
            <div className="brand-pills-selector">
              {brandsList.map((b) => {
                const isSelected = newStaff.brands.includes(b.name);
                return (
                  <button
                    type="button"
                    key={b.id}
                    className={`brand-select-pill ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleToggleBrandForNewStaff(b.name)}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Avatar Photo Upload</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            <UserAvatar
              src={createAvatarPreview}
              alt="Avatar Preview"
              style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", marginTop: 8 }}
            />
          </div>

          <button type="submit" className="save-submit-btn">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateStaffModal;