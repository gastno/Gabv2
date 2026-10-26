import { startTransition, useState } from "react";
import { useLanguage } from "../../../components/i18n/LanguageContext";

function ServicesTab({ categories, isLoading, error, onSelectService }) {
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryId, wasExpanded) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryId]: !wasExpanded,
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
        {categories.map((category, index) => {
          const isExpanded = Object.prototype.hasOwnProperty.call(expandedCategories, category.id)
            ? expandedCategories[category.id]
            : index === 0;
          return (
            <div className="accordion-category" key={category.id}>
              <button
                type="button"
                className="accordion-header"
                aria-expanded={isExpanded}
                aria-controls={`studio-category-${category.id}`}
                onClick={() => startTransition(() => toggleCategory(category.id, isExpanded))}
              >
                <span className="accordion-header-left">
                  <span className="category-icon-circle" aria-hidden="true" />
                  <span className="category-header-text">
                    <span className="category-title" role="heading" aria-level="3">{category.title}</span>
                    <span className="category-description">{category.subtitle}</span>
                  </span>
                </span>
                <span className={`accordion-arrow ${isExpanded ? "open" : ""}`} aria-hidden="true">
                  +
                </span>
              </button>

              <div
                className={`accordion-content-wrapper ${isExpanded ? "expanded" : ""}`}
                id={`studio-category-${category.id}`}
                aria-hidden={!isExpanded}
                inert={!isExpanded}
              >
                <div className="accordion-content">
                  {category.services.map((service, index) => (
                    <button
                      type="button"
                      key={service.id || `${category.id}-${index}`}
                      className="service-row-item"
                      onClick={() => onSelectService(service)}
                    >
                      <span className="service-row-left">
                        <span className="service-thumb-placeholder">
                          {service.image && (
                            <img
                              src={service.image}
                              alt={service.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </span>
                        <span className="service-info-col">
                          <span className="service-row-title">{service.name}</span>
                          {service.description && (
                            <span className="service-row-description">{service.description}</span>
                          )}
                          <span className="service-duration-badge">{service.duration}</span>
                        </span>
                      </span>
                      <span className="service-row-price">
                        {service.salePrice ? (
                          <span className="service-sale-price-group">
                            <strong className="service-sale-price-bubble">
                              <span>{service.salePrice}</span>
                              <span aria-hidden="true">!</span>
                            </strong>
                            <del className="service-regular-price">{service.regularPrice}</del>
                          </span>
                        ) : service.price}
                      </span>
                    </button>
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
