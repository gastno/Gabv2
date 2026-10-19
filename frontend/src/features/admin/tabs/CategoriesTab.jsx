import React, { useState } from "react";
import "./CategoriesTab.css";

function CategoriesTab({
  brands,
  categories,
  services,
  loadingCategories,
  setCategoryModalOpen,
  setInspectCategory,
  setIsEditMode,
}) {
  const [selectedBrandId, setSelectedBrandId] = useState("all");
  const filteredCategories = categories.filter(
    (category) => selectedBrandId === "all"
      || (category.brand_id != null
        ? String(category.brand_id) === selectedBrandId
        : brands.find((brand) => String(brand.id) === selectedBrandId)?.name === category.brand)
  );

  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Category Management</h3>
          <p className="subtitle">Organize services into group categories</p>
        </div>
        <div className="categories-header-actions">
          <label className="categories-brand-filter">
            Show categories for
            <select
              aria-label="Filter categories by brand"
              value={selectedBrandId}
              onChange={(event) => setSelectedBrandId(event.target.value)}
            >
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={String(brand.id)}>{brand.name}</option>
              ))}
            </select>
          </label>
          <button
            className="primary-action-btn"
            onClick={() => setCategoryModalOpen(true)}
          >
            + Add Category
          </button>
        </div>
      </div>

      {loadingCategories ? (
        <p>Loading categories...</p>
      ) : filteredCategories.length === 0 ? (
        <p className="categories-empty">No categories found for this brand.</p>
      ) : (
        <div className="categories-admin-grid">
          {filteredCategories.map((cat) => {
            const count = services.filter((service) => (
              service.category_id != null
                ? String(service.category_id) === String(cat.id)
                : service.category === cat.title && (
                  cat.brand_id == null
                    || String(service.brand_id) === String(cat.brand_id)
                )
            )).length;

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