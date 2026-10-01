import React from "react";
import "./AdminModals.css";

function CategoryInspectModal({
  inspectCategory,
  setInspectCategory,
  brandsList,
  isEditMode,
  setIsEditMode,
  closeInspectModal,
  handleSaveCategoryEdit,
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
        <h3>Category Details</h3>

        <form onSubmit={handleSaveCategoryEdit} className="admin-form">
          <div className="form-group">
            <label>Brand</label>
            {isEditMode ? (
              <select
                value={inspectCategory.brand}
                onChange={(e) =>
                  setInspectCategory({
                    ...inspectCategory,
                    brand: e.target.value,
                  })
                }
              >
                {brandsList.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="read-only-field">{inspectCategory.brand}</div>
            )}
          </div>

          <div className="form-group">
            <label>Category Title</label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={inspectCategory.title}
                onChange={(e) =>
                  setInspectCategory({
                    ...inspectCategory,
                    title: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">{inspectCategory.title}</div>
            )}
          </div>

          <div className="form-group">
            <label>Subtitle / Description</label>
            {isEditMode ? (
              <input
                type="text"
                value={inspectCategory.subtitle || ""}
                onChange={(e) =>
                  setInspectCategory({
                    ...inspectCategory,
                    subtitle: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">
                {inspectCategory.subtitle || "N/A"}
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
                  onClick={closeInspectModal}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryInspectModal;