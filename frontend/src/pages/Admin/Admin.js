import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi, brandApi } from "../../services/api"; // Adjust relative import path
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();

  // Navigation & Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar"); // 'calendar' | 'brands' | 'categories' | 'services' | 'staff' | 'ledger'

  // Master Brand Filter
  const [selectedBrand, setSelectedBrand] = useState("Gabbablu");

  // Brands State
  const [brandsList, setBrandsList] = useState([
    {
      id: 1,
      name: "Gabbablu",
      slug: "gabbablu",
      location: "Placeholder Street 123, Reykjavík, Iceland",
      about_description: "Premier beauty and lash extension studio in Reykjavík.",
    },
  ]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Staff Accounts State
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Local Categories & Services State
  const [categories, setCategories] = useState([
    { id: "combos", brand: "Gabbablu", title: "Combos", subtitle: "Combined treatments & packages" },
    { id: "lashes", brand: "Gabbablu", title: "Lashes Extension", subtitle: "Professional eyelash extension services" },
    { id: "eyebrows", brand: "Gabbablu", title: "Eyebrows", subtitle: "Brow shaping, tinting & lamination" },
    { id: "products", brand: "Gabbablu", title: "Products", subtitle: "Aftercare & beauty items" },
  ]);

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

  // Appointments Ledger State
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
    {
      id: 502,
      brand: "Gabbablu",
      staffName: "Sólveig",
      clientName: "Katrín Eiríksdóttir",
      phone: "+354 771 9876",
      service: "Brow Lamination",
      price: "11,000 kr",
      date: "Sep 15, 2026",
      time: "14:00",
      status: "Pending",
    },
  ]);

  // Modals Creation States
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Inspector / Detail Item States
  const [inspectBrand, setInspectBrand] = useState(null);
  const [tempInspectBrand, setTempInspectBrand] = useState(null);

  const [inspectStaff, setInspectStaff] = useState(null);
  const [tempInspectStaff, setTempInspectStaff] = useState(null);

  const [inspectCategory, setInspectCategory] = useState(null);
  const [inspectService, setInspectService] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Creation Form States
  const [newCategory, setNewCategory] = useState({ brand: "Gabbablu", title: "", subtitle: "" });
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
    brands: ["Gabbablu"], // Array of assigned brand names
    photo: "",
  });

  // ================= FETCH DATABASE DATA =================

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
      console.warn("Using local fallback brands list:", err);
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
          id: s.id || s._id,
          userId: s.userId || s.username,
          password: s.password || "••••••••",
          name: s.name || s.full_name,
          description: s.description || s.role || "Staff Member",
          brands: Array.isArray(s.assigned_brands) && s.assigned_brands.length > 0
            ? s.assigned_brands.map((b) => b.name)
            : [s.brand || "Gabbablu"],
          photo: s.photo || s.avatar || "/placeholder-person-1.jpg",
        }));
        setStaffList(formattedStaff);
      }
    } catch (err) {
      console.warn("Failed loading staff from API:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchStaffAccounts();
  }, []);

  // Log Out Handler
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("staff_role");
    localStorage.removeItem("auth_user_name");
    navigate("/staff-login");
  };

  // Close Inspector Modal Helper
  const closeInspectModal = () => {
    setInspectBrand(null);
    setTempInspectBrand(null);
    setInspectStaff(null);
    setTempInspectStaff(null);
    setInspectCategory(null);
    setInspectService(null);
    setIsEditMode(false);
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
    } catch (err) {
      alert(err.message || "Failed to update brand.");
    }
  };

  // ================= STAFF HANDLERS =================

  const handleOpenStaffModal = (emp) => {
    setInspectStaff({ ...emp });
    setTempInspectStaff({ ...emp });
    setIsEditMode(false);
  };

  const handleDiscardStaffChanges = () => {
    setTempInspectStaff({ ...inspectStaff });
    setIsEditMode(false);
  };

  // Multi-Pill Selectors Toggles
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
      if (staffApi && staffApi.create) {
        await staffApi.create({
          username: newStaff.userId,
          userId: newStaff.userId,
          password: newStaff.password,
          full_name: newStaff.name,
          name: newStaff.name,
          description: newStaff.description,
          brand_ids: brandIdsToSave,
          role_id: 3,
          photo: newStaff.photo || "/placeholder-person-1.jpg",
        });
        await fetchStaffAccounts();
      } else {
        setStaffList((prev) => [
          ...prev,
          {
            id: Date.now(),
            ...newStaff,
            photo: newStaff.photo || "/placeholder-person-1.jpg",
          },
        ]);
      }
      setStaffModalOpen(false);
      setNewStaff({ userId: "", password: "", name: "", description: "", brands: ["Gabbablu"], photo: "" });
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
        await fetchStaffAccounts();
      } else {
        setStaffList((prev) =>
          prev.map((s) => (s.id === tempInspectStaff.id ? tempInspectStaff : s))
        );
      }
      closeInspectModal();
    } catch (err) {
      alert(err.message || "Failed to update staff account.");
    }
  };

  // ================= CATEGORY & SERVICE HANDLERS =================

  const handleAddCategory = (e) => {
    e.preventDefault();
    setCategories((prev) => [
      ...prev,
      { id: newCategory.title.toLowerCase().replace(/\s+/g, "-"), ...newCategory },
    ]);
    setCategoryModalOpen(false);
    setNewCategory({ brand: "Gabbablu", title: "", subtitle: "" });
  };

  const handleAddService = (e) => {
    e.preventDefault();
    setServices((prev) => [
      ...prev,
      { id: Date.now(), ...newService, image: newService.image || "/placeholder-service.jpg" },
    ]);
    setServiceModalOpen(false);
    setNewService({ brand: "Gabbablu", category: categories[0]?.title || "General", name: "", description: "", duration: "60 min", price: "", image: "" });
  };

  const handleSaveCategoryEdit = (e) => {
    e.preventDefault();
    if (!isEditMode) return;
    setCategories((prev) => prev.map((c) => (c.id === inspectCategory.id ? inspectCategory : c)));
    closeInspectModal();
  };

  const handleSaveServiceEdit = (e) => {
    e.preventDefault();
    if (!isEditMode) return;
    setServices((prev) => prev.map((s) => (s.id === inspectService.id ? inspectService : s)));
    closeInspectModal();
  };

  const handleStatusChange = (id, newStatus) => {
    setAppointments((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  return (
    <div className={`admin-container ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileSidebarOpen ? "mobile-sidebar-active" : ""}`}>
      {/* MOBILE BACKDROP */}
      {mobileSidebarOpen && <div className="admin-mobile-backdrop" onClick={() => setMobileSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-text">⚡ Admin HQ</div>
          <button className="collapse-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? "❯" : "❮"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "calendar" ? "active" : ""}`} onClick={() => handleTabSelect("calendar")}>
            <span className="nav-icon">📅</span>
            <span className="nav-label">Global Calendar</span>
          </button>

          <button className={`nav-item ${activeTab === "brands" ? "active" : ""}`} onClick={() => handleTabSelect("brands")}>
            <span className="nav-icon">🏛️</span>
            <span className="nav-label">Brands</span>
          </button>

          <button className={`nav-item ${activeTab === "categories" ? "active" : ""}`} onClick={() => handleTabSelect("categories")}>
            <span className="nav-icon">🗂️</span>
            <span className="nav-label">Categories</span>
          </button>

          <button className={`nav-item ${activeTab === "services" ? "active" : ""}`} onClick={() => handleTabSelect("services")}>
            <span className="nav-icon">✨</span>
            <span className="nav-label">Service Catalog</span>
          </button>

          <button className={`nav-item ${activeTab === "staff" ? "active" : ""}`} onClick={() => handleTabSelect("staff")}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Staff Accounts</span>
          </button>

          <button className={`nav-item ${activeTab === "ledger" ? "active" : ""}`} onClick={() => handleTabSelect("ledger")}>
            <span className="nav-icon">📋</span>
            <span className="nav-label">Appointments Ledger</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        {/* TOP BAR WITH LOG OUT BUTTON */}
        <header className="admin-top-bar">
          <div className="top-bar-left">
            <button className="mobile-menu-trigger" onClick={() => setMobileSidebarOpen(true)}>
              ☰
            </button>
            <h2>Brand Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <label className="brand-select-label">Brand:</label>
            <select className="brand-select" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              {brandsList.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <button type="button" className="admin-logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </header>

        <div className="admin-tab-content">
          {/* SECTION 1: GLOBAL CALENDAR */}
          {activeTab === "calendar" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Master Schedule ({selectedBrand})</h3>
                  <p className="subtitle">All staff appointments across store locations</p>
                </div>
              </div>

              <div className="master-calendar-grid">
                {staffList.map((staff) => {
                  const staffAppts = appointments.filter((a) => a.staffName === staff.name && a.brand === selectedBrand);

                  return (
                    <div className="staff-calendar-column" key={staff.id}>
                      <div className="staff-column-header">
                        <img src={staff.photo} alt={staff.name} className="staff-thumb" />
                        <div>
                          <h4>{staff.name}</h4>
                          <span className="staff-role">{staff.description}</span>
                        </div>
                      </div>

                      <div className="column-slots-list">
                        {staffAppts.map((appt) => (
                          <div className={`admin-appt-card status-${appt.status.toLowerCase()}`} key={appt.id}>
                            <div className="card-top-row">
                              <span className="card-time">{appt.time}</span>
                              <span className={`status-pill ${appt.status.toLowerCase()}`}>{appt.status}</span>
                            </div>
                            <div className="card-client-name">{appt.clientName}</div>
                            <div className="card-service">{appt.service}</div>
                            <div className="card-price">{appt.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: BRANDS MANAGEMENT */}
          {activeTab === "brands" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Brand Information</h3>
                  <p className="subtitle">Manage existing brand locations, names, and descriptions</p>
                </div>
              </div>

              {loadingBrands ? (
                <p>Loading brands...</p>
              ) : (
                <div className="brands-admin-grid">
                  {brandsList.map((brand) => (
                    <div className="admin-brand-card clickable" key={brand.id} onClick={() => handleOpenBrandModal(brand)}>
                      <div className="brand-card-header">
                        <span className="brand-icon-circle">🏛️</span>
                        <span className="brand-slug-tag">{brand.slug}</span>
                      </div>
                      <h4>{brand.name}</h4>
                      <p className="brand-location">📍 {brand.location}</p>
                      <p className="brand-about">{brand.about_description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION 3: CATEGORIES MANAGEMENT */}
          {activeTab === "categories" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Category Management</h3>
                  <p className="subtitle">Organize services into accordion sections for customer view</p>
                </div>
                <button className="primary-action-btn" onClick={() => setCategoryModalOpen(true)}>
                  + Add New Category
                </button>
              </div>

              <div className="categories-admin-grid">
                {categories
                  .filter((cat) => cat.brand === selectedBrand)
                  .map((cat) => (
                    <div
                      className="admin-category-card clickable"
                      key={cat.id}
                      onClick={() => {
                        setInspectCategory({ ...cat });
                        setIsEditMode(false);
                      }}
                    >
                      <div className="category-card-header">
                        <span className="category-icon-circle">✦</span>
                        <span className="brand-tag">{cat.brand}</span>
                      </div>
                      <h4>{cat.title}</h4>
                      <p>{cat.subtitle}</p>
                      <div className="category-meta">
                        <span>Services in Category: {services.filter((s) => s.category === cat.title).length}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* SECTION 4: SERVICE CATALOG */}
          {activeTab === "services" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Service Management</h3>
                  <p className="subtitle">Define services, pricing, duration, and categories</p>
                </div>
                <button className="primary-action-btn" onClick={() => setServiceModalOpen(true)}>
                  + Add New Service
                </button>
              </div>

              <div className="services-admin-grid">
                {services.map((item) => (
                  <div
                    className="admin-service-card clickable"
                    key={item.id}
                    onClick={() => {
                      setInspectService({ ...item });
                      setIsEditMode(false);
                    }}
                  >
                    <div className="service-card-img">
                      <img src={item.image} alt={item.name} />
                      <div className="card-top-tags">
                        <span className="category-tag">{item.category}</span>
                        <span className="brand-tag">{item.brand}</span>
                      </div>
                    </div>
                    <div className="service-card-body">
                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      <div className="service-meta-row">
                        <span>⏱ {item.duration}</span>
                        <span className="price-tag">{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 5: STAFF ACCOUNTS TABLE WITH MULTI-BRAND PILLS */}
          {activeTab === "staff" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Staff Accounts & Credentials</h3>
                  <p className="subtitle">Manage employee portal logins, roles, and assigned brands</p>
                </div>
                <button className="primary-action-btn" onClick={() => setStaffModalOpen(true)}>
                  + Create Staff Account
                </button>
              </div>

              {loadingStaff ? (
                <p>Loading staff accounts from database...</p>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="admin-ledger-table staff-table-interactive">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Full Name</th>
                        <th>Role / Title</th>
                        <th>User ID</th>
                        <th>Password</th>
                        <th>Assigned Brands</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((emp) => (
                        <tr key={emp.id} className="interactive-staff-row" onClick={() => handleOpenStaffModal(emp)}>
                          <td>
                            <img src={emp.photo} alt={emp.name} className="staff-table-avatar" />
                          </td>
                          <td>
                            <strong>{emp.name}</strong>
                          </td>
                          <td>{emp.description}</td>
                          <td>
                            <code>{emp.userId}</code>
                          </td>
                          <td>
                            <span className="password-mask">{emp.password}</span>
                          </td>
                          <td>
                            <div className="brand-pills-row">
                              {emp.brands.map((brandName) => (
                                <span key={brandName} className="brand-tag-table">
                                  {brandName}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* SECTION 6: APPOINTMENTS LEDGER */}
          {activeTab === "ledger" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Master Appointments Ledger</h3>
                  <p className="subtitle">Track completed, pending, and cancelled bookings</p>
                </div>
              </div>

              <div className="table-responsive-wrapper">
                <table className="admin-ledger-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date/Time</th>
                      <th>Client Info</th>
                      <th>Service</th>
                      <th>Specialist</th>
                      <th>Price</th>
                      <th>Status Lifecycle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>#{appt.id}</td>
                        <td>
                          {appt.date} - {appt.time}
                        </td>
                        <td>
                          <strong>{appt.clientName}</strong>
                          <br />
                          <small>{appt.phone}</small>
                        </td>
                        <td>{appt.service}</td>
                        <td>{appt.staffName}</td>
                        <td>{appt.price}</td>
                        <td>
                          <select
                            className={`status-select status-${appt.status.toLowerCase()}`}
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* INSPECT / EDIT BRAND MODAL */}
      {tempInspectBrand && (
        <div className="admin-modal-backdrop" onClick={closeInspectModal}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeInspectModal}>
              ✕
            </button>
            <h3>Brand Details</h3>

            <form onSubmit={handleSaveBrandEdit} className="admin-form">
              <div className="form-group">
                <label>Brand Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    required
                    value={tempInspectBrand.name}
                    onChange={(e) => setTempInspectBrand({ ...tempInspectBrand, name: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{tempInspectBrand.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Slug Identifier</label>
                <div className="read-only-field disabled-slug">{tempInspectBrand.slug}</div>
              </div>

              <div className="form-group">
                <label>Address / Location</label>
                {isEditMode ? (
                  <input
                    type="text"
                    required
                    value={tempInspectBrand.location}
                    onChange={(e) => setTempInspectBrand({ ...tempInspectBrand, location: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{tempInspectBrand.location}</div>
                )}
              </div>

              <div className="form-group">
                <label>About / Description</label>
                {isEditMode ? (
                  <textarea
                    rows="4"
                    value={tempInspectBrand.about_description || ""}
                    onChange={(e) => setTempInspectBrand({ ...tempInspectBrand, about_description: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{tempInspectBrand.about_description || "N/A"}</div>
                )}
              </div>

              <div className="modal-actions-row">
                {!isEditMode ? (
                  <button
                    type="button"
                    className="edit-toggle-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditMode(true);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button type="submit" className="save-submit-btn">
                      Save Changes
                    </button>
                    <button type="button" className="discard-cancel-btn" onClick={handleDiscardBrandChanges}>
                      Discard Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT / EDIT STAFF MODAL (MULTI-PILL BRAND SELECTOR) */}
      {tempInspectStaff && (
        <div className="admin-modal-backdrop" onClick={closeInspectModal}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeInspectModal}>
              ✕
            </button>
            <h3>Staff Account Details</h3>

            <form onSubmit={handleSaveStaffEdit} className="admin-form">
              <div className="form-group">
                <label>Full Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    required
                    value={tempInspectStaff.name}
                    onChange={(e) => setTempInspectStaff({ ...tempInspectStaff, name: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{tempInspectStaff.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Role / Title Description</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={tempInspectStaff.description}
                    onChange={(e) => setTempInspectStaff({ ...tempInspectStaff, description: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{tempInspectStaff.description}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>User ID</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      required
                      value={tempInspectStaff.userId}
                      onChange={(e) => setTempInspectStaff({ ...tempInspectStaff, userId: e.target.value })}
                    />
                  ) : (
                    <div className="read-only-field">{tempInspectStaff.userId}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Password</label>
                  {isEditMode ? (
                    <input
                      type="password"
                      required
                      value={tempInspectStaff.password}
                      onChange={(e) => setTempInspectStaff({ ...tempInspectStaff, password: e.target.value })}
                    />
                  ) : (
                    <div className="read-only-field">{tempInspectStaff.password}</div>
                  )}
                </div>
              </div>

              {/* MULTI-PILL BRAND SELECTOR */}
              <div className="form-group">
                <label>Assigned Brands (Click to toggle)</label>
                <div className="brand-pills-selector">
                  {brandsList.map((b) => {
                    const isSelected = tempInspectStaff.brands.includes(b.name);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={`brand-select-pill ${isSelected ? "selected" : ""} ${!isEditMode ? "disabled" : ""}`}
                        onClick={() => handleToggleBrandForInspectStaff(b.name)}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions-row">
                {!isEditMode ? (
                  <button
                    type="button"
                    className="edit-toggle-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditMode(true);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button type="submit" className="save-submit-btn">
                      Save Changes
                    </button>
                    <button type="button" className="discard-cancel-btn" onClick={handleDiscardStaffChanges}>
                      Discard Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT / EDIT CATEGORY MODAL */}
      {inspectCategory && (
        <div className="admin-modal-backdrop" onClick={closeInspectModal}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeInspectModal}>
              ✕
            </button>
            <h3>Category Details</h3>
            <form onSubmit={handleSaveCategoryEdit} className="admin-form">
              <div className="form-group">
                <label>Brand</label>
                {isEditMode ? (
                  <select
                    value={inspectCategory.brand}
                    onChange={(e) => setInspectCategory({ ...inspectCategory, brand: e.target.value })}
                  >
                    {brandsList.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="read-only-field">{inspectCategory.brand}</div>
                )}
              </div>

              <div className="form-group">
                <label>Category Title</label>
                {isEditMode ? (
                  <input
                    type="text"
                    required
                    value={inspectCategory.title}
                    onChange={(e) => setInspectCategory({ ...inspectCategory, title: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{inspectCategory.title}</div>
                )}
              </div>

              <div className="form-group">
                <label>Subtitle / Description</label>
                {isEditMode ? (
                  <input
                    type="text"
                    required
                    value={inspectCategory.subtitle}
                    onChange={(e) => setInspectCategory({ ...inspectCategory, subtitle: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{inspectCategory.subtitle}</div>
                )}
              </div>

              <div className="modal-actions-row">
                {!isEditMode ? (
                  <button
                    type="button"
                    className="edit-toggle-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditMode(true);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <button type="submit" className="save-submit-btn">
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT / EDIT SERVICE MODAL */}
      {inspectService && (
        <div className="admin-modal-backdrop" onClick={closeInspectModal}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeInspectModal}>
              ✕
            </button>
            <h3>Service Details</h3>
            <form onSubmit={handleSaveServiceEdit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Brand</label>
                  {isEditMode ? (
                    <select
                      value={inspectService.brand}
                      onChange={(e) => setInspectService({ ...inspectService, brand: e.target.value })}
                    >
                      {brandsList.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="read-only-field">{inspectService.brand}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Category</label>
                  {isEditMode ? (
                    <select
                      value={inspectService.category}
                      onChange={(e) => setInspectService({ ...inspectService, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.title}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="read-only-field">{inspectService.category}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Service Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    required
                    value={inspectService.name}
                    onChange={(e) => setInspectService({ ...inspectService, name: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{inspectService.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                {isEditMode ? (
                  <textarea
                    rows="3"
                    value={inspectService.description}
                    onChange={(e) => setInspectService({ ...inspectService, description: e.target.value })}
                  />
                ) : (
                  <div className="read-only-field">{inspectService.description}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estimated Time</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={inspectService.duration}
                      onChange={(e) => setInspectService({ ...inspectService, duration: e.target.value })}
                    />
                  ) : (
                    <div className="read-only-field">{inspectService.duration}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Price</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      required
                      value={inspectService.price}
                      onChange={(e) => setInspectService({ ...inspectService, price: e.target.value })}
                    />
                  ) : (
                    <div className="read-only-field">{inspectService.price}</div>
                  )}
                </div>
              </div>

              <div className="modal-actions-row">
                {!isEditMode ? (
                  <button
                    type="button"
                    className="edit-toggle-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditMode(true);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <button type="submit" className="save-submit-btn">
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCategoryModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCategoryModalOpen(false)}>
              ✕
            </button>
            <h3>Create Service Category</h3>
            <form onSubmit={handleAddCategory} className="admin-form">
              <div className="form-group">
                <label>Brand</label>
                <select value={newCategory.brand} onChange={(e) => setNewCategory({ ...newCategory, brand: e.target.value })}>
                  {brandsList.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category Title</label>
                <input
                  type="text"
                  required
                  value={newCategory.title}
                  onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                  placeholder="e.g. Eyebrows & Lashes"
                />
              </div>

              <div className="form-group">
                <label>Subtitle / Description</label>
                <input
                  type="text"
                  required
                  value={newCategory.subtitle}
                  onChange={(e) => setNewCategory({ ...newCategory, subtitle: e.target.value })}
                  placeholder="e.g. Brow shaping, tinting & lamination"
                />
              </div>

              <button type="submit" className="save-submit-btn">
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SERVICE MODAL */}
      {serviceModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setServiceModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setServiceModalOpen(false)}>
              ✕
            </button>
            <h3>Create New Service</h3>
            <form onSubmit={handleAddService} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Brand</label>
                  <select value={newService.brand} onChange={(e) => setNewService({ ...newService, brand: e.target.value })}>
                    {brandsList.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })}>
                    {categories
                      .filter((c) => c.brand === newService.brand)
                      .map((cat) => (
                        <option key={cat.id} value={cat.title}>
                          {cat.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Service Name</label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g. Mega Volume Extensions"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estimated Time</label>
                  <input
                    type="text"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="text"
                    required
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    placeholder="e.g. 15,000 kr"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Photo URL</label>
                <input
                  type="text"
                  value={newService.image}
                  onChange={(e) => setNewService({ ...newService, image: e.target.value })}
                  placeholder="/placeholder-service.jpg"
                />
              </div>

              <button type="submit" className="save-submit-btn">
                Save Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL WITH MULTI-PILL BRAND SELECTOR */}
      {staffModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setStaffModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setStaffModalOpen(false)}>
              ✕
            </button>
            <h3>Create Staff Account</h3>
            <form onSubmit={handleAddStaff} className="admin-form">
              {/* MULTI-PILL BRAND SELECTOR */}
              <div className="form-group">
                <label>Assigned Brands (Select one or more)</label>
                <div className="brand-pills-selector">
                  {brandsList.map((b) => {
                    const isSelected = newStaff.brands.includes(b.name);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={`brand-select-pill ${isSelected ? "selected" : ""}`}
                        onClick={() => handleToggleBrandForNewStaff(b.name)}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Guðrún"
                />
              </div>

              <div className="form-group">
                <label>Role / Title Description</label>
                <input
                  type="text"
                  value={newStaff.description}
                  onChange={(e) => setNewStaff({ ...newStaff, description: e.target.value })}
                  placeholder="e.g. Junior Lash Specialist"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>User ID</label>
                  <input
                    type="text"
                    required
                    value={newStaff.userId}
                    onChange={(e) => setNewStaff({ ...newStaff, userId: e.target.value })}
                    placeholder="gudrun_gabbablu"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Avatar Photo URL</label>
                <input
                  type="text"
                  value={newStaff.photo}
                  onChange={(e) => setNewStaff({ ...newStaff, photo: e.target.value })}
                  placeholder="/placeholder-person-1.jpg"
                />
              </div>

              <button type="submit" className="save-submit-btn">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;