import React, { useState } from "react";
import "./StaffServicesTab.css";

function StaffServicesTab({
  brandsList,
  categories,
  services,
  loadingServices,
  onSelectService,
}) {
  // State to track expanded category titles
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryTitle) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle],
    }));
  };

  return (
    <section className="admin-section staff-services-gabbablu-theme">
      <div className="section-header">
        <div>
          <h3>Staff Services Matrix</h3>
          <p className="subtitle">
            Assign staff practitioners to specific services by brand & category
          </p>
        </div>
      </div>

      {loadingServices ? (
        <p>Loading matrix...</p>
      ) : (
        <div className="brands-accordion-container">
          {brandsList.map((brand) => {
            const brandCategories = categories.filter(
              (c) => c.brand === brand.name
            );

            return (
              <div key={brand.id || brand.name} className="brand-group-wrapper">
                <div className="brand-group-title">
                  <span>🏛️ {brand.name}</span>
                </div>

                <div className="services-accordion-list">
                  {brandCategories.map((category) => {
                    const isExpanded = !!expandedCategories[category.title];
                    const catServices = services.filter(
                      (s) => s.category === category.title && s.brand === brand.name
                    );

                    return (
                      <div className="accordion-category" key={category.id || category.title}>
                        <div
                          className="accordion-header"
                          onClick={() => toggleCategory(category.title)}
                        >
                          <div className="accordion-header-left">
                            <div className="category-icon-circle">
                              <span>✦</span>
                            </div>
                            <div className="category-header-text">
                              <h3>{category.title}</h3>
                              <p>{category.subtitle || category.description}</p>
                            </div>
                          </div>
                          <span className={`accordion-arrow ${isExpanded ? "open" : ""}`}>
                            ❯
                          </span>
                        </div>

                        <div className={`accordion-content-wrapper ${isExpanded ? "expanded" : ""}`}>
                          <div className="accordion-content">
                            {catServices.length === 0 ? (
                              <div className="service-row-item empty-row">
                                <span className="service-row-title">No services in this category</span>
                              </div>
                            ) : (
                              catServices.map((item) => (
                                <div
                                  key={item.id}
                                  className="service-row-item clickable-assign-row"
                                  onClick={() => onSelectService(item)}
                                >
                                  <div className="service-row-left">
                                    <div className="service-thumb-placeholder">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      ) : null}
                                      <span className="thumb-fallback">IMG</span>
                                    </div>
                                    <div className="service-info-col">
                                      <span className="service-row-title">{item.name}</span>
                                      {item.duration && (
                                        <span className="service-duration-badge">
                                          ⏱ {item.duration}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="service-row-right">
                                    <span className="service-row-price">{item.price}</span>
                                    <span className="assign-btn-pill">Assign Staff 👥</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default StaffServicesTab;