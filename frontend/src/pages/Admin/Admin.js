// src/pages/Admin/Admin.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi, brandApi, categoryApi, getAssetUrl } from "../../services/api";
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

// Modals
import BrandModal from "./modals/BrandModal";
import StaffInspectModal from "./modals/StaffInspectModal";
import CategoryInspectModal from "./modals/CategoryInspectModal";
import ServiceInspectModal from "./modals/ServiceInspectModal";
import CreateCategoryModal from "./modals/CreateCategoryModal";
import CreateServiceModal from "./modals/CreateServiceModal";
import CreateStaffModal from "./modals/CreateStaffModal";

function Admin() {
  const navigate = useNavigate();

  // Navigation & Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedBrand, setSelectedBrand] = useState("Gabbablu");

  // Master Entity Lists
  const [brandsList, setBrandsList] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // File & Avatar States
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);

  // Local Services & Ledger State
  const [services, setServices] = useState([
    {
      id: 1,
      brand: "Gabbablu",
      category: "Lashes Extension",
      name: "Classic Lashes",
      description: "Full set classic extension treatment.",
      duration: "90 min",
      price: "14,000 kr",
      image: "/placeholder-service.jpg",
    },
    {
      id: 2,
      brand: "Gabbablu",
      category: "Eyebrows",
      name: "Brow Lamination",
      description: "Brow shaping, tinting & lamination set.",
      duration: "45 min",
      price: "11,000 kr",
      image: "/placeholder-service.jpg",
    },
  ]);

  const [appointments, setAppointments] = useState([
    {
      id: 501,
      brand: "Gabbablu",
      staffName: "Anna María",
      clientName: "Guðrún Jónsdóttir",
      phone: "+354 892 1234",
      service: "Classic Lashes",
      price: "14,000 kr",
      date: "Sep 15, 2026",
      time: "10:00",
      status: "Confirmed",
    },
  ]);

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
    image: "",
  });

  const [newStaff, setNewStaff] = useState({
    userId: "",
    password: "",
    name: "",
    description: "",
    brands: ["Gabbablu"],
    photo: "",
  });

  // ================= API FETCHERS =================

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      if (brandApi && brandApi.getAll) {
        const data = await brandApi.getAll();
        if (Array.isArray(data) && data.length > 0) {
          setBrandsList(data);
        }
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
      if (staffApi && staffApi.getAll) {
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
      if (categoryApi && categoryApi.getAll) {
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

  useEffect(() => {
    fetchBrands();
    fetchStaffAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (createAvatarPreview) URL.revokeObjectURL(createAvatarPreview);
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
    };
  }, [createAvatarPreview, editAvatarPreview]);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("auth_user_name");
    navigate("/staff-login");
  };

  // Close Inspection Modals
  const closeInspectModal = () => {
    setInspectBrand(null);
    setTempInspectBrand(null);
    setInspectStaff(null);
    setTempInspectStaff(null);
    setInspectCategory(null);
    setInspectService(null);
    setIsEditMode(false);
    setEditAvatarFile(null);
    if (editAvatarPreview) {
      URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarPreview(null);
    }
  };

  // ================= CATEGORY HANDLERS =================

  const handleAddCategory = async (e) => {
    e.preventDefault();

    const selectedBrandObj = brandsList.find((b) => b.name === newCategory.brand);
    const brandId = selectedBrandObj ? selectedBrandObj.id : 1;

    try {
      if (categoryApi && categoryApi.create) {
        await categoryApi.create({
          brand_id: brandId,
          brand: newCategory.brand,
          title: newCategory.title,
          subtitle: newCategory.subtitle,
        });
        await fetchCategories();
      } else {
        setCategories((prev) => [
          ...prev,
          {
            id: Date.now(),
            brand_id: brandId,
            ...newCategory,
          },
        ]);
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
      if (categoryApi && categoryApi.update) {
        await categoryApi.update(inspectCategory.id, {
          brand_id: brandId,
          brand: inspectCategory.brand,
          title: inspectCategory.title,
          subtitle: inspectCategory.subtitle,
        });
        await fetchCategories();
      } else {
        setCategories((prev) =>
          prev.map((c) => (c.id === inspectCategory.id ? inspectCategory : c))
        );
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
      if (brandApi && brandApi.update) {
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

  const handleOpenStaffModal = (emp) => {
    setInspectStaff({ ...emp });
    setTempInspectStaff({ ...emp });
    setIsEditMode(false);
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
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

      if (staffApi && staffApi.create) {
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

      if (createdStaffId && createAvatarFile && staffApi && staffApi.uploadAvatar) {
        await staffApi.uploadAvatar(createdStaffId, createAvatarFile);
      }

      await fetchStaffAccounts();
      setStaffModalOpen(false);
      setCreateAvatarFile(null);
      if (createAvatarPreview) {
        URL.revokeObjectURL(createAvatarPreview);
        setCreateAvatarPreview(null);
      }
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
      if (staffApi && staffApi.update) {
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

      if (editAvatarFile && staffApi && staffApi.uploadAvatar) {
        await staffApi.uploadAvatar(tempInspectStaff.id, editAvatarFile);
      }

      await fetchStaffAccounts();
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update staff account.");
    }
  };

  // ================= SERVICES & LEDGER HANDLERS =================

  const handleAddService = (e) => {
    e.preventDefault();
    setServices((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newService,
        image: newService.image || "/placeholder-service.jpg",
      },
    ]);
    setServiceModalOpen(false);
    setNewService({
      brand: "Gabbablu",
      category: categories[0]?.title || "General",
      name: "",
      description: "",
      duration: "60 min",
      price: "",
      image: "",
    });
  };

  const handleSaveServiceEdit = (e) => {
    e.preventDefault();
    if (!isEditMode) return;
    setServices((prev) =>
      prev.map((s) => (s.id === inspectService.id ? inspectService : s))
    );
    closeInspectModal();
  };

  const handleStatusChange = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
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
      {/* SIDEBAR & BACKDROP */}
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        activeTab={activeTab}
        handleTabSelect={handleTabSelect}
      />

      {/* MAIN LAYOUT */}
      <main className="admin-main">
        <AdminTopBar
          setMobileSidebarOpen={setMobileSidebarOpen}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          brandsList={brandsList}
          handleLogout={handleLogout}
        />

        <div className="admin-tab-content">
          {activeTab === "calendar" && (
            <CalendarTab
              selectedBrand={selectedBrand}
              staffList={staffList}
              appointments={appointments}
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
              selectedBrand={selectedBrand}
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
              services={services}
              setServiceModalOpen={setServiceModalOpen}
              setInspectService={setInspectService}
              setIsEditMode={setIsEditMode}
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
              appointments={appointments}
              handleStatusChange={handleStatusChange}
            />
          )}
        </div>
      </main>

      {/* MODALS */}
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

export default Admin;