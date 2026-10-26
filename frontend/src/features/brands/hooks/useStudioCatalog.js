import { useEffect, useState } from "react";
import {
  brandApi,
  categoryApi,
  getAssetUrl,
  getLocalizedValue,
  serviceApi,
} from "../../../services/api";

function useStudioCatalog(brandId, language, studioDefaults, t) {
  const [brand, setBrand] = useState(studioDefaults);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
              ? `${Number(service.sale_price_isk ?? service.price_isk).toLocaleString(language === "is" ? "is-IS" : "en-IS")} ${t("studio.currencyUnit")}`
              : service.price || t("studio.priceUnavailable"),
            regularPrice: service.price_isk != null && Number.isFinite(Number(service.price_isk))
              ? `${Number(service.price_isk).toLocaleString(language === "is" ? "is-IS" : "en-IS")} ${t("studio.currencyUnit")}`
              : service.price || t("studio.priceUnavailable"),
            salePrice: service.sale_price_isk != null && Number.isFinite(Number(service.sale_price_isk))
              ? `${Number(service.sale_price_isk).toLocaleString(language === "is" ? "is-IS" : "en-IS")} ${t("studio.currencyUnit")}`
              : null,
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

  return { brand, categories, isLoading, contentError };
}

export default useStudioCatalog;
