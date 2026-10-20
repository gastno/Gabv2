import { useEffect, useMemo, useState } from "react";
import CustomerLayout from "../../components/layout/CustomerLayout/CustomerLayout";
import {
  brandApi,
  brandPortfolioApi,
  categoryApi,
  getAssetUrl,
  getLocalizedValue,
  serviceApi,
  staffServiceApi,
} from "../../services/api";
import AboutTab from "./components/AboutTab";
import BookingModal from "./modals/BookingModal";
import ServicesTab from "./components/ServicesTab";
import TeamTab from "./components/TeamTab";
import { STUDIO_DEFAULTS, toTeamMember } from "./data/studioData";
import { useLanguage } from "../../components/i18n/LanguageContext";
import "./brands.css";

function StudioPage({ brandId }) {
  const { language, t } = useLanguage();
  const studioDefaults = STUDIO_DEFAULTS[brandId] || STUDIO_DEFAULTS[1];
  const [activeTab, setActiveTab] = useState("services");
  const [brand, setBrand] = useState(studioDefaults);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioError, setPortfolioError] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadStudio = async () => {
      setIsLoading(true);
      setContentError("");

      const [brandsResult, categoriesResult, servicesResult] = await Promise.allSettled([
        brandApi.getAll(),
        categoryApi.getAll(),
        serviceApi.getAll(),
      ]);

      if (!isCurrent) return;

      const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];
      const categoryRows = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
      const serviceRows = servicesResult.status === "fulfilled" ? servicesResult.value : [];
      const brandRecord = Array.isArray(brands)
        ? brands.find((item) => Number(item.id) === Number(brandId))
        : null;
      const brandCategories = Array.isArray(categoryRows)
        ? categoryRows.filter((item) => Number(item.brand_id) === Number(brandId))
        : [];
      const brandServices = Array.isArray(serviceRows)
        ? serviceRows.filter((item) => Number(item.brand_id) === Number(brandId))
        : [];

      setBrand({
        ...studioDefaults,
        ...(brandRecord || {}),
        name: brandRecord?.name || studioDefaults.name,
        location: brandRecord?.location || studioDefaults.location,
        about_description: brandRecord?.about_description || studioDefaults.about_description,
      });
      setCategories(brandCategories.map((category) => ({
        id: category.id,
        title: getLocalizedValue(category, "name", language) || category.title || t("studio.categoryUnavailable"),
        subtitle: getLocalizedValue(category, "description", language) || category.subtitle || "",
        services: brandServices
          .filter((service) => Number(service.category_id) === Number(category.id))
          .map((service) => ({
            ...service,
            name: getLocalizedValue(service, "name", language) || t("studio.serviceUnavailable"),
            description: getLocalizedValue(service, "description", language),
            duration: service.duration_minutes
              ? `${service.duration_minutes} ${t("studio.minuteUnit")}`
              : service.duration || t("studio.durationUnavailable"),
            price: service.price_isk != null && Number.isFinite(Number(service.price_isk))
              ? `${Number(service.price_isk).toLocaleString(language === "is" ? "is-IS" : "en-IS")} ${t("studio.currencyUnit")}`
              : service.price || t("studio.priceUnavailable"),
            image: getAssetUrl(service.image_url),
          })),
      })));

      if ([brandsResult, categoriesResult, servicesResult].every((result) => result.status === "rejected")) {
        setContentError(t("studio.contentUnavailable"));
      }
      setIsLoading(false);
    };

    loadStudio();
    return () => {
      isCurrent = false;
    };
  }, [brandId, language, studioDefaults, t]);

  useEffect(() => {
    let isCurrent = true;
    setPortfolio(null);
    setPortfolioError("");

    brandPortfolioApi.get(brandId)
      .then((data) => {
        if (isCurrent) setPortfolio(data);
      })
      .catch((error) => {
        if (isCurrent) {
          setPortfolioError(t("studio.portfolioUnavailable"));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [brandId, t]);

  useEffect(() => {
    if (activeTab !== "team") return undefined;

    let isCurrent = true;
    const serviceIds = [...new Set(
      categories.flatMap((category) => category.services.map((service) => service.id))
    )];

    if (serviceIds.length === 0) {
      setEmployees([]);
      setTeamLoading(false);
      return undefined;
    }

    const loadTeam = async () => {
      setTeamLoading(true);
      const workerLists = await Promise.all(serviceIds.map((serviceId) =>
        staffServiceApi.getByServiceId(serviceId).catch((error) => {
          console.warn(`Could not load staff for service ${serviceId}:`, error);
          return [];
        })
      ));

      if (isCurrent) {
        const uniqueWorkers = new Map();
        workerLists.flat().forEach((worker) => {
          if (worker?.id != null) uniqueWorkers.set(String(worker.id), worker);
        });
        setEmployees(Array.from(uniqueWorkers.values()).map((worker) => toTeamMember(worker, language)));
        setTeamLoading(false);
      }
    };

    loadTeam();
    return () => {
      isCurrent = false;
    };
  }, [activeTab, categories, language]);

  const legacyPortfolioImages = useMemo(() => (
    [1, 2, 3, 4, 5].map((imageNumber) => ({
      id: `legacy-${imageNumber}`,
      image_url: `/portfolio/${studioDefaults.portfolio}/${imageNumber}.jpg`,
    }))
  ), [studioDefaults]);
  const portfolioImages = portfolio
    ? portfolio.images
    : legacyPortfolioImages;
  const logoUrl = getAssetUrl(brand.logo_url) || studioDefaults.logo;

  return (
    <CustomerLayout pageClassName="brand-page studio-page">
      <main className="brand-content">
        {brand.cover_image_url && (
          <section className="studio-cover-image">
            <img src={getAssetUrl(brand.cover_image_url)} alt={`${brand.name} studio`} />
          </section>
        )}

        {portfolioImages.length > 0 ? (
          <PortfolioGallery
            images={portfolioImages}
            layout={portfolio?.layout || "feature"}
            brandName={brand.name}
            error={portfolioError}
          />
        ) : (
          <section className="portfolio-empty-state" aria-live="polite">
            {portfolioError || t("studio.portfolioEmpty")}
          </section>
        )}

        <section className="store-information">
          <div className="store-details">
            <div className="store-icon">
              <img src={logoUrl} alt={`${brand.name} logo`} />
            </div>
            <div className="store-text">
              <h1 className="store-name">{brand.name}</h1>
              <p className="store-address">
                <span className="store-location-pin" aria-hidden="true" />
                {brand.location}
              </p>
            </div>
          </div>
        </section>

        <nav className="store-tabs" aria-label={t("studio.information", { brand: brand.name })}>
          {[
            ["services", t("studio.services")],
            ["team", t("studio.team")],
            ["about", t("studio.about")],
          ].map(([tabId, label]) => (
            <button
              type="button"
              key={tabId}
              className={`tab-button ${activeTab === tabId ? "active" : ""}`}
              aria-current={activeTab === tabId ? "page" : undefined}
              onClick={() => setActiveTab(tabId)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="tab-content">
          {activeTab === "services" && (
            <ServicesTab
              categories={categories}
              isLoading={isLoading}
              error={contentError}
              onSelectService={setSelectedService}
            />
          )}
          {activeTab === "team" && (
            <TeamTab employees={employees} isLoading={teamLoading} />
          )}
          {activeTab === "about" && <AboutTab brand={brand} />}
        </section>
      </main>

      {selectedService && (
        <BookingModal
          service={selectedService}
          brandName={brand.name}
          onClose={() => setSelectedService(null)}
        />
      )}
    </CustomerLayout>
  );
}

function PortfolioGallery({ images, layout, brandName, error }) {
  const { t } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const safeLayout = ["grid", "masonry", "mosaic", "feature", "carousel"].includes(layout)
    ? layout
    : "grid";

  useEffect(() => {
    setActiveImage(0);
  }, [images, safeLayout]);

  const imageUrl = (image) => (
    image.image_url?.startsWith("/portfolio/")
      ? image.image_url
      : getAssetUrl(image.image_url)
  );
  const renderImage = (image, index, className = "portfolio-image") => (
    <div className={className} key={image.id}>
      <img src={imageUrl(image)} alt={`${brandName} portfolio ${index + 1}`} />
    </div>
  );

  if (safeLayout === "carousel") {
    const activeIndex = activeImage % images.length;
    const image = images[activeIndex];
    return (
      <section className="portfolio-carousel" aria-label={`${brandName} portfolio`}>
        {renderImage(image, activeImage, "portfolio-carousel-image")}
        {images.length > 1 && (
          <div className="portfolio-carousel-controls">
            <button
              type="button"
              aria-label={t("studio.previousImage")}
              onClick={() => setActiveImage((index) => (index - 1 + images.length) % images.length)}
            >←</button>
            <span>{activeIndex + 1} / {images.length}</span>
            <button
              type="button"
              aria-label={t("studio.nextImage")}
              onClick={() => setActiveImage((index) => (index + 1) % images.length)}
            >→</button>
          </div>
        )}
        {error && <p className="portfolio-error-message" role="status">{error}</p>}
      </section>
    );
  }

  if (safeLayout === "feature") {
    return (
      <section className="portfolio-gallery portfolio-layout-feature" aria-label={`${brandName} portfolio`}>
        {renderImage(images[0], 0, "portfolio-main-image")}
        {images.length > 1 && (
          <div className="portfolio-grid">
            {images.slice(1).map((image, index) => renderImage(image, index + 1))}
          </div>
        )}
        {error && <p className="portfolio-error-message" role="status">{error}</p>}
      </section>
    );
  }

  return (
    <section
      className={`portfolio-gallery portfolio-layout-${safeLayout}`}
      aria-label={`${brandName} portfolio`}
    >
      {images.map((image, index) => renderImage(image, index))}
      {error && <p className="portfolio-error-message" role="status">{error}</p>}
    </section>
  );
}

export default StudioPage;
export { PortfolioGallery };