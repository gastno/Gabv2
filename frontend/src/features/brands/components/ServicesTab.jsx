import { useState } from "react";
import { useLanguage } from "../../../components/i18n/LanguageContext";

function ServicesTab({ categories, isLoading, error, onSelectService }) {
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState({
    "Lashes Extension": false,
  });

  const toggleCategory = (title) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [title]: !previous[title],
    }));
  };

  return (
    <div className="services-section">
      <h2 className="section-heading">{t("studio.servicesHeading")}</h2>
      {error && <p className="placeholder-message">{error}</p>}
      {isLoading ? (
        <p className="placeholder-message">{t("studio.loadingServices")}</p>
      ) : categories.length === 0 ? (
        <p className="placeholder-message">{t("studio.noServices")}</p>
      ) : null}
      <div className="services-accordion-list">
        {categories.map((category) => {
          const isExpanded = !!expandedCategories[category.title];
          return (
            <div className="accordion-category" key={category.id}>
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
                    <p>{category.subtitle}</p>
                  </div>
                </div>
                <span className={`accordion-arrow ${isExpanded ? "open" : ""}`}>
                  ❯
                </span>
              </div>

              <div className={`accordion-content-wrapper ${isExpanded ? "expanded" : ""}`}>
                <div className="accordion-content">
                  {category.services.map((service, index) => (
                    <div
                      key={service.id || `${category.id}-${index}`}
                      className="service-row-item"
                      onClick={() => onSelectService(service)}
                    >
                      <div className="service-row-left">
                        <div className="service-thumb-placeholder">
                          {service.image && (
                            <img
                              src={service.image}
                              alt={service.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span className="thumb-fallback" aria-hidden="true">✦</span>
                        </div>
                        <div className="service-info-col">
                          <span className="service-row-title">{service.name}</span>
                          {service.description && (
                            <span className="service-row-description">{service.description}</span>
                          )}
                          <span className="service-duration-badge">⏱ {service.duration}</span>
                        </div>
                      </div>
                      <span className="service-row-price">{service.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ServicesTab;
