import "./Gabbablu.css";
import { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import {
  brandApi,
  categoryApi,
  getAssetUrl,
  serviceApi,
  staffServiceApi,
} from "../../services/api";

const STUDIO_DEFAULTS = {
  1: {
    name: "Gabbablu",
    location: "Placeholder Street 123, Reykjavík, Iceland",
    about_description: "Studio information coming soon.",
    logo: "/gabbablulogo.png",
    portfolio: "gabbablu",
  },
  2: {
    name: "Amor Tattoo",
    location: "Placeholder Street 123, Reykjavík, Iceland",
    about_description: "Studio information coming soon.",
    logo: "/amortattoo.png",
    portfolio: "amortattoo",
  },
};

const toTeamMember = (person) => ({
  id: person.id,
  name: person.name || person.full_name || "Team member",
  title: person.description || "Profile details coming soon.",
  img: getAssetUrl(person.avatar_url) || "/placeholder-person-1.jpg",
});

export function StudioPage({ brandId }) {
  const studioDefaults = STUDIO_DEFAULTS[brandId] || STUDIO_DEFAULTS[1];
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("services");
  const [brand, setBrand] = useState(studioDefaults);
  const [categoriesData, setCategoriesData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [contentError, setContentError] = useState("");
  const [bookingEmployees, setBookingEmployees] = useState([]);
  const [bookingEmployeesLoading, setBookingEmployeesLoading] = useState(false);

  // Accordion Expand/Collapse State
  const [expandedCategories, setExpandedCategories] = useState({
    "Lashes Extension": false,
  });

  // Modal Flow State
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    step: 1,
    selectedService: null,
    selectedEmployee: null,
    selectedDate: null,
    selectedTime: null,
  });

  // Form State
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    phone: "",
    kennitala: "",
    healthInfo: "",
    consentKennitala: false,
  });

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
      const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
      const services = servicesResult.status === "fulfilled" ? servicesResult.value : [];
      const brandRecord = Array.isArray(brands)
        ? brands.find((item) => Number(item.id) === Number(brandId))
        : null;
      const categoryRecords = Array.isArray(categories)
        ? categories.filter((item) => Number(item.brand_id) === Number(brandId))
        : [];
      const serviceRecords = Array.isArray(services)
        ? services.filter((item) => Number(item.brand_id) === Number(brandId))
        : [];

      setBrand({
        ...studioDefaults,
        ...(brandRecord || {}),
        name: brandRecord?.name || studioDefaults.name,
        location: brandRecord?.location || studioDefaults.location,
        about_description: brandRecord?.about_description || studioDefaults.about_description,
      });
      setCategoriesData(categoryRecords.map((category) => ({
        id: category.id,
        title: category.title || category.name || "Category details coming soon",
        subtitle: category.subtitle || category.description || "Category description coming soon.",
        services: serviceRecords
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
      categoriesData.flatMap((category) => category.services.map((service) => service.id))
    )];

    if (serviceIds.length === 0) {
      setEmployees([]);
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
  }, [activeTab, categoriesData]);

  // Full Month Calendar Matrix Mock Data
  const calendarDays = [
    { dayNumber: 1, isAvailable: false },
    { dayNumber: 2, isAvailable: false },
    { dayNumber: 3, isAvailable: false },
    { dayNumber: 4, isAvailable: false },
    { dayNumber: 5, isAvailable: false },
    { dayNumber: 6, isAvailable: false },
    { dayNumber: 7, isAvailable: false },
    { dayNumber: 8, isAvailable: false },
    { dayNumber: 9, isAvailable: false },
    { dayNumber: 10, isAvailable: false },
    { dayNumber: 11, isAvailable: false },
    { dayNumber: 12, isAvailable: false },
    { dayNumber: 13, isAvailable: false },
    { dayNumber: 14, isAvailable: true, dayName: "Mon", fullDate: "Mon, Sep 14" },
    { dayNumber: 15, isAvailable: true, dayName: "Tue", fullDate: "Tue, Sep 15" },
    { dayNumber: 16, isAvailable: true, dayName: "Wed", fullDate: "Wed, Sep 16" },
    { dayNumber: 17, isAvailable: true, dayName: "Thu", fullDate: "Thu, Sep 17" },
    { dayNumber: 18, isAvailable: true, dayName: "Fri", fullDate: "Fri, Sep 18" },
    { dayNumber: 19, isAvailable: false },
    { dayNumber: 20, isAvailable: false },
    { dayNumber: 21, isAvailable: true, dayName: "Mon", fullDate: "Mon, Sep 21" },
    { dayNumber: 22, isAvailable: true, dayName: "Tue", fullDate: "Tue, Sep 22" },
    { dayNumber: 23, isAvailable: false },
    { dayNumber: 24, isAvailable: true, dayName: "Thu", fullDate: "Thu, Sep 24" },
    { dayNumber: 25, isAvailable: true, dayName: "Fri", fullDate: "Fri, Sep 25" },
    { dayNumber: 26, isAvailable: false },
    { dayNumber: 27, isAvailable: false },
    { dayNumber: 28, isAvailable: false },
    { dayNumber: 29, isAvailable: true, dayName: "Tue", fullDate: "Tue, Sep 29" },
    { dayNumber: 30, isAvailable: true, dayName: "Wed", fullDate: "Wed, Sep 30" },
  ];

  const availableTimes = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

  const toggleCategory = (title) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const openBooking = async (service) => {
    setBookingModal({
      isOpen: true,
      step: 1,
      selectedService: service,
      selectedEmployee: null,
      selectedDate: null,
      selectedTime: null,
    });
    setBookingEmployees([]);
    setBookingEmployeesLoading(true);

    try {
      const workers = await staffServiceApi.getByServiceId(service.id);
      setBookingEmployees((workers || []).map(toTeamMember));
    } catch (error) {
      console.warn("Could not load service staff:", error);
    } finally {
      setBookingEmployeesLoading(false);
    }
  };

  const closeModal = () => {
    setBookingModal({
      isOpen: false,
      step: 1,
      selectedService: null,
      selectedEmployee: null,
      selectedDate: null,
      selectedTime: null,
    });
    setGuestForm({
      fullName: "",
      phone: "",
      kennitala: "",
      healthInfo: "",
      consentKennitala: false,
    });
  };

  const handleSelectEmployee = (emp) => {
    setBookingModal((prev) => ({
      ...prev,
      selectedEmployee: emp,
      step: 2,
    }));
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!guestForm.consentKennitala) {
      alert("Please check the consent box regarding Kennitala processing to continue.");
      return;
    }
    alert(`Appointment confirmed for ${bookingModal.selectedService.name} with ${bookingModal.selectedEmployee.name} on ${bookingModal.selectedDate?.fullDate} at ${bookingModal.selectedTime}!`);
    closeModal();
  };

  return (
    <div className="gabbablu-page studio-page">
      {/* HEADER */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onLoginClick={() => alert("Login clicked")}
      />

      {/* MAIN CONTENT */}
      <main className="gabbablu-content">
        {/* PORTFOLIO GALLERY */}
        <section className="portfolio-gallery">
          <div className="portfolio-main-image">
            <img src={`/portfolio/${studioDefaults.portfolio}/1.jpg`} alt={`${brand.name} portfolio`} />
          </div>
          <div className="portfolio-grid">
            {[2, 3, 4, 5].map((imageNumber) => (
              <div className="portfolio-image" key={imageNumber}>
                <img src={`/portfolio/${studioDefaults.portfolio}/${imageNumber}.jpg`} alt={`${brand.name} portfolio ${imageNumber}`} />
              </div>
            ))}
          </div>
        </section>

        {/* STORE INFORMATION */}
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

        {/* TABS */}
        <section className="store-tabs">
          <button
            className={`tab-button ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </button>
          <button
            className={`tab-button ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            Our Team
          </button>
          <button
            className={`tab-button ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
        </section>

        {/* TAB CONTENT */}
        <section className="tab-content">
          {/* SERVICES TAB */}
          {activeTab === "services" && (
            <div className="services-section">
              <h2 className="section-heading">Our Services</h2>
              {contentError && <p className="placeholder-message">{contentError}</p>}
              {isLoading ? (
                <p className="placeholder-message">Loading studio services...</p>
              ) : categoriesData.length === 0 ? (
                <p className="placeholder-message">Services and categories coming soon.</p>
              ) : null}
              <div className="services-accordion-list">
                {categoriesData.map((category) => {
                  const isExpanded = !!expandedCategories[category.title];
                  return (
                    <div className="accordion-category" key={category.id}>
                      <div
                        className="accordion-header"
                        onClick={() => toggleCategory(category.title)}
                      >
                        <div className="accordion-header-left">
                          <div className="category-icon-circle">
                            <span>✦</span>
                          </div>
                          <div className="category-header-text">
                            <h3>{category.title}</h3>
                            <p>{category.subtitle}</p>
                          </div>
                        </div>
                        <span className={`accordion-arrow ${isExpanded ? "open" : ""}`}>
                          ❯
                        </span>
                      </div>

                      <div className={`accordion-content-wrapper ${isExpanded ? "expanded" : ""}`}>
                        <div className="accordion-content">
                          {category.services.map((item, idx) => (
                            <div
                              key={item.id || `${category.id}-${idx}`}
                              className="service-row-item"
                              onClick={() => openBooking(item)}
                            >
                              <div className="service-row-left">
                                <div className="service-thumb-placeholder">
                                  <img src={item.image} alt={item.name} onError={(e) => { e.target.style.display = 'none'; }} />
                                  <span className="thumb-fallback">IMG</span>
                                </div>
                                <div className="service-info-col">
                                  <span className="service-row-title">{item.name}</span>
                                  <span className="service-duration-badge">⏱ {item.duration}</span>
                                </div>
                              </div>
                              <span className="service-row-price">{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === "team" && (
            <div className="team-section">
              <h2 className="section-heading">The People</h2>
              {teamLoading ? (
                <p className="placeholder-message">Loading team profiles...</p>
              ) : employees.length === 0 ? (
                <p className="placeholder-message">Team profiles coming soon.</p>
              ) : <div className="team-grid">
                {employees.map((emp) => (
                  <div className="team-member" key={emp.id}>
                    <UserAvatar src={emp.img} alt={emp.name} className="team-profile-image" />
                    <h3>{emp.name}</h3>
                    <p>{emp.title}</p>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="about-section">
              <h2 className="section-heading">About {brand.name}</h2>
              <div className="about-card">
                <div className="about-description">
                  <p>{brand.about_description}</p>
                </div>
                <div className="map-container">
                  <div className="map-placeholder">
                    <span>MAP PLACEHOLDER</span>
                    <span className="map-pin">📍</span>
                  </div>
                  <div className="map-address">
                    <span>{brand.location}</span>
                    <button>Directions ↗</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* BOOKING MODAL */}
      {bookingModal.isOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>✕</button>

            {/* STEP 1: CHOOSE EMPLOYEE */}
            {bookingModal.step === 1 && (
              <div className="modal-step">
                <h2>Choose an employee</h2>
                <p className="modal-subtitle">Service: {bookingModal.selectedService?.name} (⏱ {bookingModal.selectedService?.duration})</p>

                <div className="employee-selection-list">
                  {bookingEmployeesLoading ? (
                    <p className="placeholder-message">Loading available team members...</p>
                  ) : bookingEmployees.length === 0 ? (
                    <p className="placeholder-message">No team members are assigned to this service yet.</p>
                  ) : bookingEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="employee-option-card"
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      <div className="employee-avatar">
                        <UserAvatar src={emp.img} alt={emp.name} />
                      </div>
                      <div className="employee-info">
                        <h4>{emp.name}</h4>
                        <p>{emp.title}</p>
                      </div>
                      <span className="select-arrow">❯</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: FULL CALENDAR GRID & TIME SELECTION */}
            {bookingModal.step === 2 && (
              <div className="modal-step">
                <h2>Select Date & Time</h2>
                <p className="modal-subtitle">
                  {bookingModal.selectedService?.name} with {bookingModal.selectedEmployee?.name}
                </p>

                <div className="calendar-container">
                  <div className="calendar-header">
                    <span className="calendar-month-title">September 2026</span>
                  </div>

                  <div className="calendar-weekdays">
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                    <span>Su</span>
                  </div>

                  <div className="calendar-days-grid">
                    {calendarDays.map((day, idx) => {
                      const isSelected = bookingModal.selectedDate?.dayNumber === day.dayNumber;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!day.isAvailable}
                          className={`calendar-day-cell ${
                            day.isAvailable ? "available" : "disabled"
                          } ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            if (day.isAvailable) {
                              setBookingModal((prev) => ({
                                ...prev,
                                selectedDate: day,
                                selectedTime: null,
                              }));
                            }
                          }}
                        >
                          {day.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {bookingModal.selectedDate && (
                  <div className="time-slots-section">
                    <label className="picker-label">Available Hours ({bookingModal.selectedDate.fullDate})</label>
                    <div className="times-grid">
                      {availableTimes.map((timeStr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`time-chip ${bookingModal.selectedTime === timeStr ? "selected" : ""}`}
                          onClick={() => setBookingModal((prev) => ({ ...prev, selectedTime: timeStr }))}
                        >
                          {timeStr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="modal-next-btn"
                  disabled={!bookingModal.selectedDate || !bookingModal.selectedTime}
                  onClick={() => setBookingModal((prev) => ({ ...prev, step: 3 }))}
                >
                  Next
                </button>
              </div>
            )}

            {/* STEP 3: AUTH CHOICE */}
            {bookingModal.step === 3 && (
              <div className="modal-step">
                <h2>Booking Details</h2>
                <p className="modal-subtitle">
                  {bookingModal.selectedService?.name} on {bookingModal.selectedDate?.fullDate} at {bookingModal.selectedTime}
                </p>

                <div className="auth-choice-container">
                  <button className="auth-btn primary" onClick={() => alert("Redirecting to Log in...")}>
                    Log In
                  </button>
                  <div className="auth-divider"><span>or</span></div>
                  <button
                    className="auth-btn secondary"
                    onClick={() => setBookingModal((prev) => ({ ...prev, step: 4 }))}
                  >
                    Continue as Guest
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: GUEST INFORMATION FORM */}
            {bookingModal.step === 4 && (
              <div className="modal-step">
                <h2>Customer Information</h2>
                <p className="modal-subtitle">Complete your details to finish booking</p>

                <form className="guest-booking-form" onSubmit={handleGuestSubmit}>
                  <div className="appointment-summary-card">
                    <div className="summary-header">
                      <span className="summary-badge">Appointment Details</span>
                    </div>
                    <div className="summary-body">
                      <div className="summary-row">
                        <span className="summary-label">Service:</span>
                        <span className="summary-value">{bookingModal.selectedService?.name}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Duration:</span>
                        <span className="summary-value">⏱ {bookingModal.selectedService?.duration}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Price:</span>
                        <span className="summary-value highlight">{bookingModal.selectedService?.price}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Specialist:</span>
                        <span className="summary-value">{bookingModal.selectedEmployee?.name}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Date & Time:</span>
                        <span className="summary-value highlight">
                          {bookingModal.selectedDate?.fullDate} at {bookingModal.selectedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={guestForm.fullName}
                      onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
                      placeholder="e.g. Guðrún Jónsdóttir"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      placeholder="e.g. 123 4567"
                    />
                  </div>

                  <div className="form-group">
                    <label>Kennitala *</label>
                    <input
                      type="text"
                      required
                      value={guestForm.kennitala}
                      onChange={(e) => setGuestForm({ ...guestForm, kennitala: e.target.value })}
                      placeholder="e.g. 123456-7890"
                    />
                  </div>

                  <div className="form-group">
                    <label>Health, Allergy & Safety Info</label>
                    <textarea
                      rows="3"
                      value={guestForm.healthInfo}
                      onChange={(e) => setGuestForm({ ...guestForm, healthInfo: e.target.value })}
                      placeholder="Please state any allergies, skin sensitivities or medical conditions..."
                    />
                  </div>

                  <div className="form-checkbox-group">
                    <input
                      type="checkbox"
                      id="consentKennitala"
                      checked={guestForm.consentKennitala}
                      onChange={(e) => setGuestForm({ ...guestForm, consentKennitala: e.target.checked })}
                    />
                    <label htmlFor="consentKennitala">
                      I consent to {brand.name} storing and processing my Kennitala, phone number, and related customer information for appointment management, customer identification, service records, and applicable cancellation or no-show policies.
                    </label>
                  </div>

                  <div className="cancellation-warning-box">
                    <strong>Cancellation & No-Show Policy</strong>
                    <p>
                      Appointments cancelled less than 48 hours before the scheduled time, and appointments missed without notice, may result in a 5,000 ISK fee. Any applicable fee is handled manually by {brand.name} staff.
                    </p>
                  </div>

                  <button type="submit" className="submit-booking-btn">
                    Confirm & Book Appointment
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

function Gabbablu() {
  return <StudioPage brandId={1} />;
}

export default Gabbablu;