import React from "react";

function CreateStaffModal({
  newStaff,
  setNewStaff,
  brandsList,
  createAvatarPreview,
  setCreateAvatarFile,
  setCreateAvatarPreview,
  setStaffModalOpen,
  handleAddStaff,
  handleToggleBrandForNewStaff,
}) {
  return (
    <div
      className="admin-modal-backdrop"
      onClick={() => setStaffModalOpen(false)}
    >
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={() => setStaffModalOpen(false)}
        >
          ✕
        </button>
        <h3>Create Staff Account</h3>
        <form onSubmit={handleAddStaff} className="admin-form">
          <div className="form-group">
            <label>Assigned Brands (Select one or more)</label>
            <div className="brand-pills-selector">
              {brandsList.map((b) => {
                const isSelected = newStaff.brands.includes(b.name);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`brand-select-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => handleToggleBrandForNewStaff(b.name)}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              value={newStaff.name}
              onChange={(e) =>
                setNewStaff({ ...newStaff, name: e.target.value })
              }
              placeholder="e.g. Guðrún"
            />
          </div>

          <div className="form-group">
            <label>Role / Title Description</label>
            <input
              type="text"
              value={newStaff.description}
              onChange={(e) =>
                setNewStaff({ ...newStaff, description: e.target.value })
              }
              placeholder="e.g. Junior Lash Specialist"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>User ID</label>
              <input
                type="text"
                required
                value={newStaff.userId}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, userId: e.target.value })
                }
                placeholder="gudrun_gabbablu"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={newStaff.password}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Profile Picture Upload</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              {createAvatarPreview ? (
                <img
                  src={createAvatarPreview}
                  alt="Local Preview"
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#f0f0f0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                  }}
                >
                  👤
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setCreateAvatarFile(file);
                  setCreateAvatarPreview(URL.createObjectURL(file));
                }
              }}
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