import React from "react";

function BrandModal({
  tempInspectBrand,
  setTempInspectBrand,
  isEditMode,
  setIsEditMode,
  closeInspectModal,
  handleSaveBrandEdit,
  handleDiscardBrandChanges,
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
        <h3>Brand Details</h3>

        <form onSubmit={handleSaveBrandEdit} className="admin-form">
          <div className="form-group">
            <label>Brand Name</label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={tempInspectBrand.name}
                onChange={(e) =>
                  setTempInspectBrand({
                    ...tempInspectBrand,
                    name: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">{tempInspectBrand.name}</div>
            )}
          </div>

          <div className="form-group">
            <label>Slug Identifier</label>
            <div className="read-only-field disabled-slug">
              {tempInspectBrand.slug}
            </div>
          </div>

          <div className="form-group">
            <label>Address / Location</label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={tempInspectBrand.location}
                onChange={(e) =>
                  setTempInspectBrand({
                    ...tempInspectBrand,
                    location: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">{tempInspectBrand.location}</div>
            )}
          </div>

          <div className="form-group">
            <label>About / Description</label>
            {isEditMode ? (
              <textarea
                rows="4"
                value={tempInspectBrand.about_description || ""}
                onChange={(e) =>
                  setTempInspectBrand({
                    ...tempInspectBrand,
                    about_description: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">
                {tempInspectBrand.about_description || "N/A"}
              </div>
            )}
          </div>

          <div className="modal-actions-row">
            {!isEditMode ? (
              <button
                key="btn-brand-edit-toggle"
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
                  key="btn-brand-save-submit"
                  type="submit"
                  className="save-submit-btn"
                >
                  Save Changes
                </button>
                <button
                  key="btn-brand-discard"
                  type="button"
                  className="discard-cancel-btn"
                  onClick={handleDiscardBrandChanges}
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

export default BrandModal;