import React, { useState } from "react";
import "./Admin.css";

function Admin() {
  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");

  // Master Brand Filter
  const [selectedBrand, setSelectedBrand] = useState("Gabbablu");

  // Services State
  const [services, setServices] = useState([
    {
      id: 1,
      brand: "Gabbablu",
      name: "Classic Lashes",
      description: "Full set classic extension treatment.",
      duration: "90 min",
      price: "14,000 kr",
      image: "/placeholder-service.jpg",
    },
    {
      id: 2,
      brand: "Gabbablu",
      name: "Brow Lamination",
      description: "Brow shaping, tinting & lamination set.",
      duration: "45 min",
      price: "11,000 kr",
      image: "/placeholder-service.jpg",
    },
  ]);

  // Staff Accounts State
  const [staffList, setStaffList] = useState([
    {
      id: 1,
      userId: "anna_gabbablu",
      password: "password123",
      name: "Anna María",
      description: "Lash & Brow Specialist",
      brand: "Gabbablu",
      photo: "/placeholder-person-1.jpg",
    },
    {
      id: 2,
      userId: "solveig_gabbablu",
      password: "password123",
      name: "Sólveig",
      description: "Master Lash Artist",
      brand: "Gabbablu",
      photo: "/placeholder-person-2.jpg",
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
    {
      id: 503,
      brand: "Gabbablu",
      staffName: "Anna María",
      clientName: "Sara Pétursdóttir",
      phone: "+354 660 4321",
      service: "Wet Lashes - Refill",
      price: "12,000 kr",
      date: "Sep 14, 2026",
      time: "11:30",
      status: "Completed",
    },
  ]);

  // Modals Control
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Form States
  const [newService, setNewService] = useState({
    brand: "Gabbablu",
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
    brand: "Gabbablu",
    photo: "",
  });

  // Handlers
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
    setNewService({ brand: "Gabbablu", name: "", description: "", duration: "60 min", price: "", image: "" });
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    setStaffList((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newStaff,
        photo: newStaff.photo || "/placeholder-person-1.jpg",
      },
    ]);
    setStaffModalOpen(false);
    setNewStaff({ userId: "", password: "", name: "", description: "", brand: "Gabbablu", photo: "" });
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
      {/* MOBILE OVERLAY BACKDROP */}
      {mobileSidebarOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-text">⚡ Admin HQ</div>
          <button
            className="collapse-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? "❯" : "❮"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => handleTabSelect("calendar")}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Global Calendar</span>
          </button>

          <button
            className={`nav-item ${activeTab === "services" ? "active" : ""}`}
            onClick={() => handleTabSelect("services")}
          >
            <span className="nav-icon">✨</span>
            <span className="nav-label">Service Catalog</span>
          </button>

          <button
            className={`nav-item ${activeTab === "staff" ? "active" : ""}`}
            onClick={() => handleTabSelect("staff")}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Staff Accounts</span>
          </button>

          <button
            className={`nav-item ${activeTab === "ledger" ? "active" : ""}`}
            onClick={() => handleTabSelect("ledger")}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Appointments Ledger</span>
          </button>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="admin-main">
        {/* TOP BAR */}
        <header className="admin-top-bar">
          <div className="top-bar-left">
            <button
              className="mobile-menu-trigger"
              onClick={() => setMobileSidebarOpen(true)}
            >
              ☰
            </button>
            <h2>Brand Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <label className="brand-select-label">Brand:</label>
            <select
              className="brand-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="Gabbablu">Gabbablu</option>
              <option value="OtherBrand">Secondary Brand</option>
            </select>
          </div>
        </header>

        <div className="admin-tab-content">
          {/* ================= SECTION 1: GLOBAL CALENDAR ================= */}
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
                  const staffAppts = appointments.filter(
                    (a) => a.staffName === staff.name && a.brand === selectedBrand
                  );

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
                          <div
                            className={`admin-appt-card status-${appt.status.toLowerCase()}`}
                            key={appt.id}
                          >
                            <div className="card-top-row">
                              <span className="card-time">{appt.time}</span>
                              <span className={`status-pill ${appt.status.toLowerCase()}`}>
                                {appt.status}
                              </span>
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

          {/* ================= SECTION 2: SERVICE CATALOG ================= */}
          {activeTab === "services" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Service Management</h3>
                  <p className="subtitle">Define services, pricing, and treatment details</p>
                </div>
                <button
                  className="primary-action-btn"
                  onClick={() => setServiceModalOpen(true)}
                >
                  + Add New Service
                </button>
              </div>

              <div className="services-admin-grid">
                {services.map((item) => (
                  <div className="admin-service-card" key={item.id}>
                    <div className="service-card-img">
                      <img src={item.image} alt={item.name} />
                      <span className="brand-tag">{item.brand}</span>
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

          {/* ================= SECTION 3: STAFF ACCOUNTS ================= */}
          {activeTab === "staff" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h3>Staff & Credentials</h3>
                  <p className="subtitle">Manage employee portal logins & roles</p>
                </div>
                <button
                  className="primary-action-btn"
                  onClick={() => setStaffModalOpen(true)}
                >
                  + Create Staff Account
                </button>
              </div>

              <div className="staff-accounts-grid">
                {staffList.map((emp) => (
                  <div className="staff-account-card" key={emp.id}>
                    <img src={emp.photo} alt={emp.name} className="account-avatar" />
                    <div className="account-info">
                      <h4>{emp.name}</h4>
                      <p className="role">{emp.description}</p>
                      <div className="account-credentials">
                        <span>User ID: <strong>{emp.userId}</strong></span>
                        <span>Password: <strong>{emp.password}</strong></span>
                        <span>Brand: <strong>{emp.brand}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= SECTION 4: APPOINTMENTS LEDGER ================= */}
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
                        <td>{appt.date} - {appt.time}</td>
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

      {/* ================= CREATE SERVICE MODAL ================= */}
      {serviceModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setServiceModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setServiceModalOpen(false)}>✕</button>
            <h3>Create New Service</h3>
            <form onSubmit={handleAddService} className="admin-form">
              <div className="form-group">
                <label>Brand</label>
                <select
                  value={newService.brand}
                  onChange={(e) => setNewService({ ...newService, brand: e.target.value })}
                >
                  <option value="Gabbablu">Gabbablu</option>
                </select>
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

              <button type="submit" className="save-submit-btn">Save Service</button>
            </form>
          </div>
        </div>
      )}

      {/* ================= CREATE STAFF MODAL ================= */}
      {staffModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setStaffModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setStaffModalOpen(false)}>✕</button>
            <h3>Create Staff Account</h3>
            <form onSubmit={handleAddStaff} className="admin-form">
              <div className="form-group">
                <label>Brand</label>
                <select
                  value={newStaff.brand}
                  onChange={(e) => setNewStaff({ ...newStaff, brand: e.target.value })}
                >
                  <option value="Gabbablu">Gabbablu</option>
                </select>
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

              <button type="submit" className="save-submit-btn">Create Account</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;