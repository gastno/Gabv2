import React from "react";

function ServicesTab({
  services,
  setServiceModalOpen,
  setInspectService,
  setIsEditMode,
}) {
  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Service Management</h3>
          <p className="subtitle">
            Define services, pricing, duration, and categories
          </p>
        </div>
        <button
          className="primary-action-btn"
          onClick={() => setServiceModalOpen(true)}
        >
          + Add New Service
        </button>
      </div>

      <div className="services-admin-grid">
        {services.map((item) => (
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
    </section>
  );
}

export default ServicesTab;