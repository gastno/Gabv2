import React from "react";
import "./AdminModals.css";

function CreateCategoryModal({
  newCategory,
  setNewCategory,
  brandsList,
  setCategoryModalOpen,
  handleAddCategory,
}) {
  return (
    <div
      className="admin-modal-backdrop"
      onClick={() => setCategoryModalOpen(false)}
    >
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={() => setCategoryModalOpen(false)}
        >
          ✕
        </button>
        <h3>Create New Category</h3>

        <form onSubmit={handleAddCategory} className="admin-form">
          <div className="form-group">
            <label>Target Brand</label>
            <select
              value={newCategory.brand}
              onChange={(e) =>
                setNewCategory({ ...newCategory, brand: e.target.value })
              }
            >
              {brandsList.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Eyebrow Treatments"
              value={newCategory.title}
              onChange={(e) =>
                setNewCategory({ ...newCategory, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Subtitle / Short Description</label>
            <input
              type="text"
              placeholder="e.g. Shaping, tinting & lamination"
              value={newCategory.subtitle}
              onChange={(e) =>
                setNewCategory({ ...newCategory, subtitle: e.target.value })
              }
            />
          </div>

          <button type="submit" className="save-submit-btn">
            Create Category
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCategoryModal;