import { useEffect, useState } from "react";
import CustomerLayout from "../../components/CustomerLayout/CustomerLayout";
import {
  brandApi,
  categoryApi,
  getAssetUrl,
  serviceApi,
  staffServiceApi,
} from "../../services/api";
import AboutTab from "./components/AboutTab";
import BookingModal from "./components/BookingModal";
import ServicesTab from "./components/ServicesTab";
import TeamTab from "./components/TeamTab";
import { STUDIO_DEFAULTS, toTeamMember } from "./studioData";
import "./Gabbablu.css";

function StudioPage({ brandId }) {
  const studioDefaults = STUDIO_DEFAULTS[brandId] || STUDIO_DEFAULTS[1];
  const [activeTab, setActiveTab] = useState("services");
  const [brand, setBrand] = useState(studioDefaults);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
        title: category.title || category.name || "Category details coming soon",
        subtitle: category.subtitle || category.description || "Category description coming soon.",
        services: brandServices
          .filter((service) => Number(service.category_id) === Number(category.id))
          .map((service) => ({
            ...service,
            name: service.name || "Service details coming soon",
            duration: service.duration || (service.duration_minutes
              ? `${service.duration_minutes} min`
              : "Duration unavailable"),
            price: service.price || (service.price_isk != null
              ? `${service.price_isk} kr`
              : "Price unavailable"),
            image: getAssetUrl(service.image_url) || "/placeholder-service.jpg",
          })),
      })));

      if ([brandsResult, categoriesResult, servicesResult].every((result) => result.status === "rejected")) {
        setContentError("Studio information is unavailable. Placeholder content is shown.");
      }
      setIsLoading(false);
    };

    loadStudio();
    return () => {
      isCurrent = false;
    };
  }, [brandId, studioDefaults]);

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
        setEmployees(Array.from(uniqueWorkers.values()).map(toTeamMember));
        setTeamLoading(false);
      }
    };

    loadTeam();
    return () => {
      isCurrent = false;
    };
  }, [activeTab, categories]);

  return (
    <CustomerLayout pageClassName="gabbablu-page studio-page">
      <main className="gabbablu-content">
        <section className="portfolio-gallery">
          <div className="portfolio-main-image">
            <img
              src={`/portfolio/${studioDefaults.portfolio}/1.jpg`}
              alt={`${brand.name} portfolio`}
            />
          </div>
          <div className="portfolio-grid">
            {[2, 3, 4, 5].map((imageNumber) => (
              <div className="portfolio-image" key={imageNumber}>
                <img
                  src={`/portfolio/${studioDefaults.portfolio}/${imageNumber}.jpg`}
                  alt={`${brand.name} portfolio ${imageNumber}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="store-information">
          <div className="store-details">
            <div className="store-icon">
              <img src={studioDefaults.logo} alt={`${brand.name} logo`} />
            </div>
            <div className="store-text">
              <h1 className="store-name">{brand.name}</h1>
              <p className="store-address">📍 {brand.location}</p>
            </div>
          </div>
        </section>

        <nav className="store-tabs" aria-label={`${brand.name} information`}>
          {[
            ["services", "Services"],
            ["team", "Our Team"],
            ["about", "About"],
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

export default StudioPage;