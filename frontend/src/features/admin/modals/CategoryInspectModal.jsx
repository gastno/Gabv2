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

        <form onSubmit={handleSaveCategoryEdit} className="admin-form full-width-modal-form">
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
            <label>Category Name (English)</label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={inspectCategory.name_en || inspectCategory.title || ""}
                onChange={(e) =>
                  setInspectCategory({
                    ...inspectCategory,
                    name_en: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">{inspectCategory.name_en || inspectCategory.title}</div>
            )}
          </div>

          <div className="form-group">
            <label>Category Name (Icelandic)</label>
            {isEditMode ? (
              <input
                type="text"
                value={inspectCategory.name_is || ""}
                onChange={(e) => setInspectCategory({ ...inspectCategory, name_is: e.target.value })}
              />
            ) : (
              <div className="read-only-field">{inspectCategory.name_is || "N/A"}</div>
            )}
          </div>

          <div className="form-group">
            <label>Description (English)</label>
            {isEditMode ? (
              <input
                type="text"
                value={inspectCategory.description_en ?? inspectCategory.subtitle ?? ""}
                onChange={(e) =>
                  setInspectCategory({
                    ...inspectCategory,
                    description_en: e.target.value,
                  })
                }
              />
            ) : (
              <div className="read-only-field">
                {inspectCategory.description_en || inspectCategory.subtitle || "N/A"}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Description (Icelandic)</label>
            {isEditMode ? (
              <input
                type="text"
                value={inspectCategory.description_is || ""}
                onChange={(e) => setInspectCategory({ ...inspectCategory, description_is: e.target.value })}
              />
            ) : (
              <div className="read-only-field">{inspectCategory.description_is || "N/A"}</div>
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