import React from "react";

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
          className="modal-close"
          onClick={() => setCategoryModalOpen(false)}
        >
          ✕
        </button>
        <h3>Create Service Category</h3>
        <form onSubmit={handleAddCategory} className="admin-form">
          <div className="form-group">
            <label>Brand</label>
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
              value={newCategory.title}
              onChange={(e) =>
                setNewCategory({ ...newCategory, title: e.target.value })
              }
              placeholder="e.g. Eyebrows & Lashes"
            />
          </div>

          <div className="form-group">
            <label>Subtitle / Description</label>
            <input
              type="text"
              required
              value={newCategory.subtitle}
              onChange={(e) =>
                setNewCategory({ ...newCategory, subtitle: e.target.value })
              }
              placeholder="e.g. Brow shaping, tinting & lamination"
            />
          </div>

          <button type="submit" className="save-submit-btn">
            Save Category
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCategoryModal;