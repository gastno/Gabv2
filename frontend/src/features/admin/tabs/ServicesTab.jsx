import React, { useState } from "react";
import "./ServicesTab.css";

function ServicesTab({
  brands,
  services,
  loadingServices,
  setInspectService,
  setIsEditMode,
  setServiceModalOpen,
}) {
  const [selectedBrandId, setSelectedBrandId] = useState("all");
  const filteredServices = services.filter((service) => (
    selectedBrandId === "all"
      || (service.brand_id != null
        ? String(service.brand_id) === selectedBrandId
        : brands.find((brand) => String(brand.id) === selectedBrandId)?.name === service.brand)
  ));

  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Service Management</h3>
          <p className="subtitle">
            Define services, pricing, duration, and categories
          </p>
        </div>
        <div className="services-header-actions">
          <label className="services-brand-filter">
            Show services for
            <select
              aria-label="Filter services by brand"
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
            onClick={() => setServiceModalOpen(true)}
          >
            + Add New Service
          </button>
        </div>
      </div>

      {loadingServices ? (
        <p role="status">Loading services...</p>
      ) : filteredServices.length === 0 ? (
        <p className="services-empty">No services found for this brand.</p>
      ) : (
        <div className="services-admin-grid">
          {filteredServices.map((item) => (
            <div
              className="admin-service-card clickable"
              key={item.id}
              onClick={() => {
                setInspectService({ ...item });
                setIsEditMode(false);
              }}
            >
              <div className="service-card-img">
                <img src={item.image} alt={item.name} />
                <div className="card-top-tags">
                  <span className="brand-tag">{item.brand}</span>
                  <span className="category-tag">{item.category}</span>
                </div>
              </div>
              <div className="service-card-body">
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <div className="service-meta-row">
                  <span>⏱ {item.duration}</span>
                  <span className="price-tag">{item.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ServicesTab;