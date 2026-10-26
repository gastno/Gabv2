import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import CalendarTab from "../tabs/CalendarTab";
import BrandsTab from "../tabs/BrandsTab";
import CategoriesTab from "../tabs/CategoriesTab";
import ServicesTab from "../tabs/ServicesTab";
import StaffTab from "../tabs/StaffTab";
import LedgerTab from "../tabs/LedgerTab";
import StaffServicesTab from "../tabs/StaffServicesTab";
import PortfolioTab from "../tabs/PortfolioTab";

const AdminWorkspace = React.memo(function AdminWorkspace({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  activeTab,
  handleTabSelect,
  handleLogout,
  theme,
  onThemeChange,
  brandsList,
  loadingBrands,
  staffList,
  loadingStaff,
  categories,
  loadingCategories,
  services,
  loadingServices,
  manageableBrands,
  staffRole,
  handleOpenBrandModal,
  setCategoryModalOpen,
  setInspectCategory,
  setServiceModalOpen,
  setInspectService,
  setIsEditMode,
  onSelectStaffService,
  setStaffModalOpen,
  handleOpenStaffModal,
  onBrandUpdate,
}) {
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
          theme={theme}
          onThemeChange={onThemeChange}
        />

        <div className="admin-tab-content" key={activeTab}>
          {activeTab === "calendar" && (
            <CalendarTab
              brands={brandsList}
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

          {activeTab === "portfolio" && (
            <PortfolioTab
              brands={manageableBrands}
              loadingBrands={loadingBrands || (staffRole === "admin" && loadingStaff)}
              onBrandUpdate={onBrandUpdate}
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

          {activeTab === "staff_services" && (
            <StaffServicesTab
              brandsList={brandsList}
              categories={categories}
              services={services}
              loadingServices={loadingServices}
              onSelectService={onSelectStaffService}
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
    </div>
  );
});

export default AdminWorkspace;
