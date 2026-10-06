import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  staffApi,
  brandApi,
  categoryApi,
  serviceApi,
  staffServiceApi,
  getAssetUrl,
} from "../../services/api";
import "./Admin.css";

// Layout
import AdminSidebar from "./layout/AdminSidebar";
import AdminTopBar from "./layout/AdminTopBar";

// Tabs
import CalendarTab from "./tabs/CalendarTab";
import BrandsTab from "./tabs/BrandsTab";
import CategoriesTab from "./tabs/CategoriesTab";
import ServicesTab from "./tabs/ServicesTab";
import StaffTab from "./tabs/StaffTab";
import LedgerTab from "./tabs/LedgerTab";
import StaffServicesTab from "./tabs/StaffServicesTab";

// Modals
import BrandModal from "./modals/BrandModal";
import StaffInspectModal from "./modals/StaffInspectModal";
import CategoryInspectModal from "./modals/CategoryInspectModal";
import ServiceInspectModal from "./modals/ServiceInspectModal";
import CreateCategoryModal from "./modals/CreateCategoryModal";
import CreateServiceModal from "./modals/CreateServiceModal";
import CreateStaffModal from "./modals/CreateStaffModal";
import ServiceStaffModal from "./modals/ServiceStaffModal";

function AdminDashboard() {
  const navigate = useNavigate();

  // Navigation & Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedBrand] = useState("Gabbablu");

  // Master Entity Lists
  const [brandsList, setBrandsList] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

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
  });

  const [newService, setNewService] = useState({
    brand: "Gabbablu",
    category: "Lashes Extension",
    name: "",
    description: "",
    duration: "60 min",
    price: "",
  });

  const [newStaff, setNewStaff] = useState({
    userId: "",
    password: "",
    name: "",
    description: "",
    brands: ["Gabbablu"],
    photo: "",
  });

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      if (brandApi?.getAll) {
        const data = await brandApi.getAll();
        if (Array.isArray(data) && data.length > 0) setBrandsList(data);
      }
    } catch (err) {
      console.warn("Error fetching brands:", err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchStaffAccounts = async () => {
    setLoadingStaff(true);
    try {
      if (staffApi?.getAll) {
        const data = await staffApi.getAll();
        const formattedStaff = (data || []).map((s) => ({
          id: s.id,
          userId: s.username,
          password: "••••••••",
          name: s.name || s.full_name,
          description: s.description || "Staff Member",
          brands:
            Array.isArray(s.assigned_brands) && s.assigned_brands.length > 0
              ? s.assigned_brands.map((b) => b.name)
              : ["Gabbablu"],
          photo: getAssetUrl(s.avatar_url),
          rawAvatarUrl: s.avatar_url,
        }));
        setStaffList(formattedStaff);
      }
    } catch (err) {
      console.warn("Failed loading staff from API:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      if (categoryApi?.getAll) {
        const data = await categoryApi.getAll();
        const formatted = (data || []).map((c) => ({
          id: c.id,
          brand_id: c.brand_id,
          brand: c.brand || "Gabbablu",
          title: c.title || c.name,
          subtitle: c.subtitle || c.description || "",
        }));
        setCategories(formatted);
      }
    } catch (err) {
      console.warn("Failed loading categories from API:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      if (serviceApi?.getAll) {
        const data = await serviceApi.getAll();
        const formatted = (data || []).map((s) => ({
          id: s.id,
          brand_id: s.brand_id,
          category_id: s.category_id,
          brand: s.brand || "Gabbablu",
          category: s.category || "General",
          name: s.name,
          description: s.description || "",
          duration: s.duration || `${s.duration_minutes || 60} min`,
          price: s.price || `${s.price_isk || 0} kr`,
          image: getAssetUrl(s.image_url),
          rawImageUrl: s.image_url,
        }));
        setServices(formatted);
      }
    } catch (err) {
      console.warn("Failed loading services from API:", err);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchStaffAccounts();
    fetchCategories();
    fetchServices();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("staff_auth_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("staff_id");
    localStorage.removeItem("auth_user_name");
    localStorage.removeItem("auth_user_description");
    navigate("/staff-login");
  };

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
          description: newService.description,
          duration: newService.duration,
          price: newService.price,
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
        duration: "60 min",
        price: "",
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
          name: inspectService.name,
          description: inspectService.description,
          duration: inspectService.duration,
          price: inspectService.price,
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
        });
        await fetchCategories();
      }
      setCategoryModalOpen(false);
      setNewCategory({ brand: selectedBrand, title: "", subtitle: "" });
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
          title: inspectCategory.title,
          subtitle: inspectCategory.subtitle,
        });
        await fetchCategories();
      }
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update category.");
    }
  };

  // ================= BRAND HANDLERS =================
  const handleOpenBrandModal = (brand) => {
    setInspectBrand({ ...brand });
    setTempInspectBrand({ ...brand });
    setIsEditMode(false);
  };

  const handleDiscardBrandChanges = () => {
    setTempInspectBrand({ ...inspectBrand });
    setIsEditMode(false);
  };

  const handleSaveBrandEdit = async (e) => {
    e.preventDefault();
    if (!isEditMode || !tempInspectBrand) return;

    try {
      if (brandApi?.update) {
        await brandApi.update(tempInspectBrand.id, {
          name: tempInspectBrand.name,
          location: tempInspectBrand.location,
          about_description: tempInspectBrand.about_description,
        });
      }

      setBrandsList((prev) =>
        prev.map((b) => (b.id === tempInspectBrand.id ? tempInspectBrand : b))
      );
      setInspectBrand({ ...tempInspectBrand });
      setIsEditMode(false);
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update brand.");
    }
  };

  // ================= STAFF HANDLERS =================
  const handleOpenStaffModal = async (emp) => {
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
  };

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
          description: tempInspectStaff.description,
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

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  return (
    <div
      className={`admin-container ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${
        mobileSidebarOpen ? "mobile-sidebar-active" : ""
      }`}
    >
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        activeTab={activeTab}
        handleTabSelect={handleTabSelect}
      />

      <main className="admin-main">
        <AdminTopBar
          setMobileSidebarOpen={setMobileSidebarOpen}
          handleLogout={handleLogout}
        />

        <div className="admin-tab-content" key={activeTab}>
          {activeTab === "calendar" && (
            <CalendarTab
              selectedBrand={selectedBrand}
              brandId={brandsList.find((brand) => brand.name === selectedBrand)?.id}
              loadingBrand={loadingBrands}
              staffList={staffList}
              loadingStaff={loadingStaff}
            />
          )}

          {activeTab === "brands" && (
            <BrandsTab
              loadingBrands={loadingBrands}
              brandsList={brandsList}
              handleOpenBrandModal={handleOpenBrandModal}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesTab
              brands={brandsList}
              categories={categories}
              services={services}
              loadingCategories={loadingCategories}
              setCategoryModalOpen={setCategoryModalOpen}
              setInspectCategory={setInspectCategory}
              setIsEditMode={setIsEditMode}
            />
          )}

          {activeTab === "services" && (
            <ServicesTab
              brands={brandsList}
              services={services}
              loadingServices={loadingServices}
              setServiceModalOpen={setServiceModalOpen}
              setInspectService={setInspectService}
              setIsEditMode={setIsEditMode}
            />
          )}

          {/* NEW STAFF SERVICES TAB RENDER */}
          {activeTab === "staff_services" && (
            <StaffServicesTab
              brandsList={brandsList}
              categories={categories}
              services={services}
              loadingServices={loadingServices}
              onSelectService={(service) => setSelectedServiceForModal(service)}
            />
          )}

          {activeTab === "staff" && (
            <StaffTab
              loadingStaff={loadingStaff}
              staffList={staffList}
              setStaffModalOpen={setStaffModalOpen}
              handleOpenStaffModal={handleOpenStaffModal}
            />
          )}

          {activeTab === "ledger" && (
            <LedgerTab
              brands={brandsList}
              loadingBrand={loadingBrands}
            />
          )}
        </div>
      </main>

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