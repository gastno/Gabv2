import { useCallback, useEffect, useState } from "react";
import {
  brandApi,
  categoryApi,
  getAssetUrl,
  serviceApi,
  staffApi,
} from "../../../services/api";

function useAdminData() {
  const [brandsList, setBrandsList] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoadingBrands(true);
    try {
      if (brandApi?.getAll) {
        const data = await brandApi.getAll();
        if (Array.isArray(data) && data.length > 0) setBrandsList(data);
      }
    } catch (error) {
      console.warn("Error fetching brands:", error);
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  const fetchStaffAccounts = useCallback(async () => {
    setLoadingStaff(true);
    try {
      if (staffApi?.getAll) {
        const data = await staffApi.getAll();
        const formattedStaff = (data || []).map((staff) => ({
          id: staff.id,
          userId: staff.username,
          email: staff.email || "",
          password: "••••••••",
          name: staff.name || staff.full_name,
          description: staff.description_en || staff.description || "Staff Member",
          description_en: staff.description_en || staff.description || "",
          description_is: staff.description_is || "",
          brands:
            Array.isArray(staff.assigned_brands) && staff.assigned_brands.length > 0
              ? staff.assigned_brands.map((brand) => brand.name)
              : ["Gabbablu"],
          brandIds: Array.isArray(staff.assigned_brands)
            ? staff.assigned_brands.map((brand) => String(brand.id))
            : [],
          photo: getAssetUrl(staff.avatar_url),
          rawAvatarUrl: staff.avatar_url,
        }));
        setStaffList(formattedStaff);
      }
    } catch (error) {
      console.warn("Failed loading staff from API:", error);
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      if (categoryApi?.getAll) {
        const data = await categoryApi.getAll();
        const formatted = (data || []).map((category) => ({
          id: category.id,
          brand_id: category.brand_id,
          brand: category.brand || "Gabbablu",
          title: category.title || category.name,
          subtitle: category.subtitle || category.description || "",
          name_en: category.name_en || category.title || category.name || "",
          name_is: category.name_is || "",
          description_en: category.description_en || category.subtitle || category.description || "",
          description_is: category.description_is || "",
        }));
        setCategories(formatted);
      }
    } catch (error) {
      console.warn("Failed loading categories from API:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      if (serviceApi?.getAll) {
        const data = await serviceApi.getAll();
        const formatted = (data || []).map((service) => ({
          id: service.id,
          brand_id: service.brand_id,
          category_id: service.category_id,
          brand: service.brand || "Gabbablu",
          category: service.category || "General",
          name: service.name_en || service.name,
          name_en: service.name_en || service.name || "",
          name_is: service.name_is || "",
          description: service.description_en || service.description || "",
          description_en: service.description_en || service.description || "",
          description_is: service.description_is || "",
          duration: service.duration || `${service.duration_minutes || 60} min`,
          price: service.price || `${service.price_isk || 0} kr`,
          price_isk: service.price_isk,
          sale_price_isk: service.sale_price_isk,
          salePrice: service.sale_price || (service.sale_price_isk != null ? `${service.sale_price_isk} kr` : ""),
          is_active: service.is_active !== false,
          image: getAssetUrl(service.image_url),
          rawImageUrl: service.image_url,
        }));
        setServices(formatted);
      }
    } catch (error) {
      console.warn("Failed loading services from API:", error);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchStaffAccounts();
    fetchCategories();
    fetchServices();
  }, [fetchBrands, fetchCategories, fetchServices, fetchStaffAccounts]);

  return {
    brandsList,
    setBrandsList,
    loadingBrands,
    staffList,
    loadingStaff,
    categories,
    loadingCategories,
    services,
    loadingServices,
    fetchStaffAccounts,
    fetchCategories,
    fetchServices,
  };
}

export default useAdminData;
