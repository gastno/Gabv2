import React from "react";
import "./BrandsTab.css";

function BrandsTab({ loadingBrands, brandsList, handleOpenBrandModal }) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Brand Information</h3>
          <p className="subtitle">
            Manage existing brand locations, names, and descriptions
          </p>
        </div>
      </div>

      {loadingBrands ? (
        <p>Loading brands...</p>
      ) : (
        <div className="brands-admin-grid">
          {brandsList.map((brand) => (
            <div
              className="admin-brand-card clickable"
              key={brand.id}
              onClick={() => handleOpenBrandModal(brand)}
            >
              <div className="brand-card-header">
                <span className="brand-icon-circle">🏛️</span>
                <span className="brand-slug-tag">{brand.slug}</span>
              </div>
              <h4>{brand.name}</h4>
              <p className="brand-location">📍 {brand.location}</p>
              <p className="brand-about">{brand.about_description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BrandsTab;