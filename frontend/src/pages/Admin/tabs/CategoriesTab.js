import React from "react";

function CategoriesTab({
  selectedBrand,
  categories,
  services,
  setCategoryModalOpen,
  setInspectCategory,
  setIsEditMode,
}) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Category Management</h3>
          <p className="subtitle">
            Organize services into accordion sections for customer view
          </p>
        </div>
        <button
          className="primary-action-btn"
          onClick={() => setCategoryModalOpen(true)}
        >
          + Add New Category
        </button>
      </div>

      <div className="categories-admin-grid">
        {categories
          .filter((cat) => cat.brand === selectedBrand)
          .map((cat) => (
            <div
              className="admin-category-card clickable"
              key={cat.id}
              onClick={() => {
                setInspectCategory({ ...cat });
                setIsEditMode(false);
              }}
            >
              <div className="category-card-header">
                <span className="category-icon-circle">✦</span>
                <span className="brand-tag">{cat.brand}</span>
              </div>
              <h4>{cat.title}</h4>
              <p>{cat.subtitle}</p>
              <div className="category-meta">
                <span>
                  Services in Category:{" "}
                  {
                    services.filter((s) => s.category === cat.title)
                      .length
                  }
                </span>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

export default CategoriesTab;