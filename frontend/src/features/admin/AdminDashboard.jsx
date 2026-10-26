import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  staffApi,
  brandApi,
  categoryApi,
  serviceApi,
  staffServiceApi,
} from "../../services/api";
import "./Admin.css";

import AdminWorkspace from "./layout/AdminWorkspace";
import useAdminData from "./hooks/useAdminData";
import BrandModal from "./modals/BrandModal";
import StaffInspectModal from "./modals/StaffInspectModal";
import CategoryInspectModal from "./modals/CategoryInspectModal";
import ServiceInspectModal from "./modals/ServiceInspectModal";
import CreateCategoryModal from "./modals/CreateCategoryModal";
import CreateServiceModal from "./modals/CreateServiceModal";
import CreateStaffModal from "./modals/CreateStaffModal";
import ServiceStaffModal from "./modals/ServiceStaffModal";
import "./AdminBrand.css";
import useWorkspaceTheme from "../shared/theme/useWorkspaceTheme";

function AdminDashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useWorkspaceTheme();

  // Navigation & Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedBrand] = useState("Gabbablu");
  const {
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
  } = useAdminData();

  // File & Image States
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);

  const [createServiceImageFile, setCreateServiceImageFile] = useState(null);
  const [createServiceImagePreview, setCreateServiceImagePreview] = useState(null);
  const [editServiceImageFile, setEditServiceImageFile] = useState(null);
  const [editServiceImagePreview, setEditServiceImagePreview] = useState(null);

  // Modal Control States
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Inspection & Edit States
  const [inspectBrand, setInspectBrand] = useState(null);
  const [tempInspectBrand, setTempInspectBrand] = useState(null);
  const [inspectStaff, setInspectStaff] = useState(null);
  const [tempInspectStaff, setTempInspectStaff] = useState(null);
  const [inspectCategory, setInspectCategory] = useState(null);
  const [inspectService, setInspectService] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [assignedServiceIds, setAssignedServiceIds] = useState([]);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState(null);

  // Creation Form Input States
  const [newCategory, setNewCategory] = useState({
    brand: "Gabbablu",
    title: "",
    subtitle: "",
    title_is: "",
    subtitle_is: "",
  });

  const [newService, setNewService] = useState({
    brand: "Gabbablu",
    category: "Lashes Extension",
    name: "",
    description: "",
    name_is: "",
    description_is: "",
    duration: "60 min",
    price: "",
    sale_price: "",
    is_active: true,
  });

  const [newStaff, setNewStaff] = useState({
    userId: "",
    password: "",
    name: "",
    description: "",
    description_is: "",
    brands: ["Gabbablu"],
    photo: "",
  });

  useEffect(() => {
    return () => {
      if (createAvatarPreview) URL.revokeObjectURL(createAvatarPreview);
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
      if (createServiceImagePreview) URL.revokeObjectURL(createServiceImagePreview);
      if (editServiceImagePreview) URL.revokeObjectURL(editServiceImagePreview);
    };
  }, [
    createAvatarPreview,
    editAvatarPreview,
    createServiceImagePreview,
    editServiceImagePreview,
  ]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("staff_auth_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("staff_id");
    localStorage.removeItem("auth_user_name");
    localStorage.removeItem("auth_user_description");
    navigate("/staff-login");
  }, [navigate]);

  const closeInspectModal = () => {
    setInspectBrand(null);
    setTempInspectBrand(null);
    setInspectStaff(null);
    setTempInspectStaff(null);
    setInspectCategory(null);
    setInspectService(null);
    setSelectedServiceForModal(null);
    setIsEditMode(false);

    setEditAvatarFile(null);
    if (editAvatarPreview) {
      URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(null);
    }

    setEditServiceImageFile(null);
    if (editServiceImagePreview) {
      URL.revokeObjectURL(editServiceImagePreview);
      setEditServiceImagePreview(null);
    }
  };

  // ================= SAVE SERVICE WORKERS =================
  const handleSaveServiceWorkers = async (serviceId, staffIds) => {
    if (staffServiceApi?.syncServiceWorkers) {
      await staffServiceApi.syncServiceWorkers(serviceId, staffIds);
    }
    await fetchStaffAccounts();
  };

  // ================= SERVICE HANDLERS =================
  const handleAddService = async (e) => {
    e.preventDefault();
    const selectedBrandObj = brandsList.find((b) => b.name === newService.brand);
    const brandId = selectedBrandObj?.id;
    const selectedCatObj = categories.find((category) => (
      category.title === newService.category && (
        category.brand_id != null && selectedBrandObj
          ? String(category.brand_id) === String(selectedBrandObj.id)
          : category.brand === newService.brand
      )
    ));
    if (!brandId || !selectedCatObj) {
      alert("Select a valid brand and category before creating the service.");
      return;
    }
    const categoryId = selectedCatObj.id;

    try {
      let createdServiceId = null;
      if (serviceApi?.create) {
        const response = await serviceApi.create({
          brand_id: brandId,
          brand: newService.brand,
          category_id: categoryId,
          category: newService.category,
          name: newService.name,
          name_en: newService.name,
          name_is: newService.name_is,
          description: newService.description,
          description_en: newService.description,
          description_is: newService.description_is,
          duration: newService.duration,
          price: newService.price,
          sale_price_isk: newService.sale_price,
          is_active: newService.is_active,
        });
        createdServiceId = response?.service?.id || response?.id;
      }

      if (createdServiceId && createServiceImageFile && serviceApi.uploadImage) {
        await serviceApi.uploadImage(createdServiceId, createServiceImageFile);
      }

      await fetchServices();
      setServiceModalOpen(false);
      setCreateServiceImageFile(null);
      const resetBrandCategories = categories.filter((category) => (
        category.brand_id != null
          ? String(category.brand_id) === String(brandsList.find((brand) => brand.name === selectedBrand)?.id)
          : category.brand === selectedBrand
      ));
      setNewService({
        brand: selectedBrand,
        category: resetBrandCategories[0]?.title || "",
        name: "",
        description: "",
        name_is: "",
        description_is: "",
        duration: "60 min",
        price: "",
        sale_price: "",
        is_active: true,
      });
    } catch (err) {
      alert(err.message || "Failed to create service.");
    }
  };

  const handleSaveServiceEdit = async (e) => {
    e.preventDefault();
    if (!isEditMode || !inspectService) return;

    const selectedBrandObj = brandsList.find((b) => b.name === inspectService.brand);
    const brandId = selectedBrandObj ? selectedBrandObj.id : inspectService.brand_id;
    const selectedCatObj = categories.find((c) => c.title === inspectService.category);
    const categoryId = selectedCatObj ? selectedCatObj.id : inspectService.category_id;

    try {
      if (serviceApi?.update) {
        await serviceApi.update(inspectService.id, {
          brand_id: brandId,
          brand: inspectService.brand,
          category_id: categoryId,
          category: inspectService.category,
          name: inspectService.name_en || inspectService.name,
          name_en: inspectService.name_en || inspectService.name,
          name_is: inspectService.name_is,
          description: inspectService.description_en ?? inspectService.description,
          description_en: inspectService.description_en ?? inspectService.description,
          description_is: inspectService.description_is,
          duration: inspectService.duration,
          price: inspectService.price,
          sale_price_isk: inspectService.sale_price_isk ?? "",
          is_active: inspectService.is_active,
        });
      }

      if (editServiceImageFile && serviceApi.uploadImage) {
        await serviceApi.uploadImage(inspectService.id, editServiceImageFile);
      }

      await fetchServices();
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update service.");
    }
  };

  // ================= CATEGORY HANDLERS =================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const selectedBrandObj = brandsList.find((b) => b.name === newCategory.brand);
    const brandId = selectedBrandObj ? selectedBrandObj.id : 1;

    try {
      if (categoryApi?.create) {
        await categoryApi.create({
          brand_id: brandId,
          brand: newCategory.brand,
          title: newCategory.title,
          subtitle: newCategory.subtitle,
          name_en: newCategory.title,
          name_is: newCategory.title_is,
          description_en: newCategory.subtitle,
          description_is: newCategory.subtitle_is,
        });
        await fetchCategories();
      }
      setCategoryModalOpen(false);
      setNewCategory({ brand: selectedBrand, title: "", subtitle: "", title_is: "", subtitle_is: "" });
    } catch (err) {
      alert(err.message || "Failed to create category.");
    }
  };

  const handleSaveCategoryEdit = async (e) => {
    e.preventDefault();
    if (!isEditMode || !inspectCategory) return;

    const selectedBrandObj = brandsList.find((b) => b.name === inspectCategory.brand);
    const brandId = selectedBrandObj ? selectedBrandObj.id : inspectCategory.brand_id;

    try {
      if (categoryApi?.update) {
        await categoryApi.update(inspectCategory.id, {
          brand_id: brandId,
          brand: inspectCategory.brand,
          title: inspectCategory.name_en || inspectCategory.title,
          subtitle: inspectCategory.description_en ?? inspectCategory.subtitle,
          name_en: inspectCategory.name_en || inspectCategory.title,
          name_is: inspectCategory.name_is,
          description_en: inspectCategory.description_en ?? inspectCategory.subtitle,
          description_is: inspectCategory.description_is,
        });
        await fetchCategories();
      }
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update category.");
    }
  };

  // ================= BRAND HANDLERS =================
  const handleOpenBrandModal = useCallback((brand) => {
    const localizedBrand = {
      ...brand,
      description_en: brand.description_en ?? brand.about_description ?? "",
      description_is: brand.description_is ?? "",
    };
    setInspectBrand(localizedBrand);
    setTempInspectBrand(localizedBrand);
    setIsEditMode(false);
  }, []);

  const handleDiscardBrandChanges = () => {
    setTempInspectBrand({ ...inspectBrand });
    setIsEditMode(false);
  };

  const handleSaveBrandEdit = async (e) => {
    e.preventDefault();
    if (!isEditMode || !tempInspectBrand) return;

    try {
      let savedBrand = tempInspectBrand;
      if (brandApi?.update) {
        const response = await brandApi.update(tempInspectBrand.id, {
          name: tempInspectBrand.name,
          location: tempInspectBrand.location,
          description_en: tempInspectBrand.description_en,
          description_is: tempInspectBrand.description_is,
        });
        savedBrand = response.brand || tempInspectBrand;
      }

      setBrandsList((prev) =>
        prev.map((b) => (b.id === tempInspectBrand.id ? savedBrand : b))
      );
      setInspectBrand({ ...savedBrand });
      setIsEditMode(false);
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update brand.");
    }
  };

  // ================= STAFF HANDLERS =================
  const handleOpenStaffModal = useCallback(async (emp) => {
    setInspectStaff({ ...emp });
    setTempInspectStaff({ ...emp });
    setIsEditMode(false);
    setEditAvatarFile(null);
    setEditAvatarPreview(null);

    try {
      if (staffServiceApi?.getByStaffId) {
        const data = await staffServiceApi.getByStaffId(emp.id);
        const assignedIds = (data || []).map((item) => item.service_id);
        setAssignedServiceIds(assignedIds);
      }
    } catch (err) {
      console.warn("Could not fetch staff services:", err);
      setAssignedServiceIds([]);
    }
  }, []);

  const handleDiscardStaffChanges = () => {
    setTempInspectStaff({ ...inspectStaff });
    setIsEditMode(false);
    setEditAvatarFile(null);
    if (editAvatarPreview) {
      URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(null);
    }
  };

  const handleToggleBrandForNewStaff = (brandName) => {
    setNewStaff((prev) => {
      const exists = prev.brands.includes(brandName);
      const updated = exists
        ? prev.brands.filter((b) => b !== brandName)
        : [...prev.brands, brandName];
      return { ...prev, brands: updated };
    });
  };

  const handleToggleBrandForInspectStaff = (brandName) => {
    if (!isEditMode) return;
    setTempInspectStaff((prev) => {
      const exists = prev.brands.includes(brandName);
      const updated = exists
        ? prev.brands.filter((b) => b !== brandName)
        : [...prev.brands, brandName];
      return { ...prev, brands: updated };
    });
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (newStaff.brands.length === 0) {
      alert("Please select at least one brand for this staff account.");
      return;
    }

    const brandIdsToSave = brandsList
      .filter((b) => newStaff.brands.includes(b.name))
      .map((b) => b.id);

    try {
      let createdStaffId = null;
      if (staffApi?.create) {
        const response = await staffApi.create({
          username: newStaff.userId,
          userId: newStaff.userId,
          password: newStaff.password,
          full_name: newStaff.name,
          name: newStaff.name,
          description: newStaff.description,
          description_en: newStaff.description,
          description_is: newStaff.description_is,
          brand_ids: brandIdsToSave,
          role_id: 3,
        });
        createdStaffId = response?.staff?.id || response?.id;
      }

      if (createdStaffId && createAvatarFile && staffApi.uploadAvatar) {
        await staffApi.uploadAvatar(createdStaffId, createAvatarFile);
      }

      await fetchStaffAccounts();
      setStaffModalOpen(false);
      setCreateAvatarFile(null);
      setNewStaff({
        userId: "",
        password: "",
        name: "",
        description: "",
        description_is: "",
        brands: ["Gabbablu"],
        photo: "",
      });
    } catch (err) {
      alert(err.message || "Failed to create staff account.");
    }
  };

  const handleSaveStaffEdit = async (e) => {
    e.preventDefault();
    if (!isEditMode || !tempInspectStaff) return;

    if (tempInspectStaff.brands.length === 0) {
      alert("Staff account must have at least one assigned brand.");
      return;
    }

    const brandIdsToSave = brandsList
      .filter((b) => tempInspectStaff.brands.includes(b.name))
      .map((b) => b.id);

    try {
      if (staffApi?.update) {
        await staffApi.update(tempInspectStaff.id, {
          name: tempInspectStaff.name,
          full_name: tempInspectStaff.name,
          description: tempInspectStaff.description_en ?? tempInspectStaff.description,
          description_en: tempInspectStaff.description_en ?? tempInspectStaff.description,
          description_is: tempInspectStaff.description_is,
          userId: tempInspectStaff.userId,
          username: tempInspectStaff.userId,
          password: tempInspectStaff.password,
          brand_ids: brandIdsToSave,
        });
      }

      if (editAvatarFile && staffApi.uploadAvatar) {
        await staffApi.uploadAvatar(tempInspectStaff.id, editAvatarFile);
      }

      if (staffServiceApi?.syncServices) {
        const eligibleServiceIds = new Set(
          services
            .filter((service) => tempInspectStaff.brands.includes(service.brand))
            .map((service) => String(service.id))
        );
        const serviceIdsToSync = assignedServiceIds.filter((serviceId) =>
          eligibleServiceIds.has(String(serviceId))
        );
        await staffServiceApi.syncServices(tempInspectStaff.id, serviceIdsToSync);
      }

      await fetchStaffAccounts();
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update staff account.");
    }
  };

  const handleTabSelect = useCallback((tab) => {
    React.startTransition(() => setActiveTab(tab));
    setMobileSidebarOpen(false);
  }, []);

  const currentStaffId = localStorage.getItem("staff_id");
  const staffRole = localStorage.getItem("staff_role");
  const currentAdmin = staffList.find((staff) => String(staff.id) === String(currentStaffId));
  const manageableBrands = useMemo(() => (
    staffRole === "super_admin"
      ? brandsList
      : staffRole === "admin"
        ? brandsList.filter((brand) => currentAdmin?.brandIds.includes(String(brand.id)))
        : []
  ), [brandsList, currentAdmin, staffRole]);
  const handleSelectStaffService = useCallback(
    (service) => setSelectedServiceForModal(service),
    []
  );
  const handleBrandUpdate = useCallback((brandId, changes) => {
    setBrandsList((currentBrands) => currentBrands.map((brand) => (
      String(brand.id) === String(brandId) ? { ...brand, ...changes } : brand
    )));
  }, [setBrandsList]);

  return (
    <div className="admin-theme-root" data-theme={theme}>
      <AdminWorkspace
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        activeTab={activeTab}
        handleTabSelect={handleTabSelect}
        handleLogout={handleLogout}
        theme={theme}
        onThemeChange={setTheme}
        brandsList={brandsList}
        loadingBrands={loadingBrands}
        staffList={staffList}
        loadingStaff={loadingStaff}
        categories={categories}
        loadingCategories={loadingCategories}
        services={services}
        loadingServices={loadingServices}
        manageableBrands={manageableBrands}
        staffRole={staffRole}
        handleOpenBrandModal={handleOpenBrandModal}
        setCategoryModalOpen={setCategoryModalOpen}
        setInspectCategory={setInspectCategory}
        setServiceModalOpen={setServiceModalOpen}
        setInspectService={setInspectService}
        setIsEditMode={setIsEditMode}
        onSelectStaffService={handleSelectStaffService}
        setStaffModalOpen={setStaffModalOpen}
        handleOpenStaffModal={handleOpenStaffModal}
        onBrandUpdate={handleBrandUpdate}
      />

      {/* NEW SERVICE WORKERS SYNC MODAL OVERLAY */}
      {selectedServiceForModal && (
        <ServiceStaffModal
          selectedService={selectedServiceForModal}
          allStaff={staffList}
          closeModal={closeInspectModal}
          onSaveStaffServices={handleSaveServiceWorkers}
        />
      )}

      {/* OTHER MODALS */}
      {tempInspectBrand && (
        <BrandModal
          tempInspectBrand={tempInspectBrand}
          setTempInspectBrand={setTempInspectBrand}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          closeInspectModal={closeInspectModal}
          handleSaveBrandEdit={handleSaveBrandEdit}
          handleDiscardBrandChanges={handleDiscardBrandChanges}
        />
      )}

      {tempInspectStaff && (
        <StaffInspectModal
          tempInspectStaff={tempInspectStaff}
          setTempInspectStaff={setTempInspectStaff}
          brandsList={brandsList}
          services={services}
          assignedServiceIds={assignedServiceIds}
          setAssignedServiceIds={setAssignedServiceIds}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          editAvatarPreview={editAvatarPreview}
          setEditAvatarPreview={setEditAvatarPreview}
          setEditAvatarFile={setEditAvatarFile}
          handleToggleBrandForInspectStaff={handleToggleBrandForInspectStaff}
          closeInspectModal={closeInspectModal}
          handleSaveStaffEdit={handleSaveStaffEdit}
          handleDiscardStaffChanges={handleDiscardStaffChanges}
        />
      )}

      {inspectCategory && (
        <CategoryInspectModal
          inspectCategory={inspectCategory}
          setInspectCategory={setInspectCategory}
          brandsList={brandsList}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          closeInspectModal={closeInspectModal}
          handleSaveCategoryEdit={handleSaveCategoryEdit}
        />
      )}

      {inspectService && (
        <ServiceInspectModal
          inspectService={inspectService}
          setInspectService={setInspectService}
          brandsList={brandsList}
          categories={categories}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          editServiceImagePreview={editServiceImagePreview}
          setEditServiceImagePreview={setEditServiceImagePreview}
          setEditServiceImageFile={setEditServiceImageFile}
          closeInspectModal={closeInspectModal}
          handleSaveServiceEdit={handleSaveServiceEdit}
        />
      )}

      {categoryModalOpen && (
        <CreateCategoryModal
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          brandsList={brandsList}
          setCategoryModalOpen={setCategoryModalOpen}
          handleAddCategory={handleAddCategory}
        />
      )}

      {serviceModalOpen && (
        <CreateServiceModal
          newService={newService}
          setNewService={setNewService}
          brandsList={brandsList}
          categories={categories}
          createServiceImagePreview={createServiceImagePreview}
          setCreateServiceImagePreview={setCreateServiceImagePreview}
          setCreateServiceImageFile={setCreateServiceImageFile}
          setServiceModalOpen={setServiceModalOpen}
          handleAddService={handleAddService}
        />
      )}

      {staffModalOpen && (
        <CreateStaffModal
          newStaff={newStaff}
          setNewStaff={setNewStaff}
          brandsList={brandsList}
          createAvatarPreview={createAvatarPreview}
          setCreateAvatarPreview={setCreateAvatarPreview}
          setCreateAvatarFile={setCreateAvatarFile}
          handleToggleBrandForNewStaff={handleToggleBrandForNewStaff}
          setStaffModalOpen={setStaffModalOpen}
          handleAddStaff={handleAddStaff}
        />
      )}
    </div>
  );
}

export default AdminDashboard;