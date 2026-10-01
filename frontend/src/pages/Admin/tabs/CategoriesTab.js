import React from "react";
import "./CategoriesTab.css";

function CategoriesTab({
  selectedBrand,
  categories,
  services,
  loadingCategories,
  setCategoryModalOpen,
  setInspectCategory,
  setIsEditMode,
}) {
  const filteredCategories = categories.filter(
    (c) => !selectedBrand || c.brand === selectedBrand
  );

  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Category Management</h3>
          <p className="subtitle">Organize services into group categories</p>
        </div>
        <button
          className="primary-action-btn"
          onClick={() => setCategoryModalOpen(true)}
        >
          + Add Category
        </button>
      </div>

      {loadingCategories ? (
        <p>Loading categories...</p>
      ) : (
        <div className="categories-admin-grid">
          {filteredCategories.map((cat) => {
            const count = services.filter((s) => s.category === cat.title).length;

            return (
              <div
                className="admin-category-card clickable"
                key={cat.id}
                onClick={() => {
                  setInspectCategory(cat);
                  setIsEditMode(false);
                }}
              >
                <div className="category-card-header">
                  <div className="category-icon-circle">🗂️</div>
                  <span className="category-tag">{cat.brand}</span>
                </div>
                <h4>{cat.title}</h4>
                <p>{cat.subtitle || "No subtitle provided."}</p>
                <div className="category-meta">{count} Services Assigned</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CategoriesTab;