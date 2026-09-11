import "./Gabbablu.css";
import { useState } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function Gabbablu() {
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("services");

  // Accordion Expand/Collapse State
  const [expandedCategories, setExpandedCategories] = useState({
    "Lashes Extension": false,
  });

  // Modal Flow State: 1: Select Employee, 2: Select Date & Time, 3: Auth Option, 4: Guest Form
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

  // Categories & Provided Services Data
  const categoriesData = [
    {
      id: "combos",
      title: "Combos",
      subtitle: "Combined treatments & packages",
      services: [
        { name: "Lash Lift & Brow Lamination Combo", price: "18,000 kr", image: "/placeholder-service.jpg" },
        { name: "Lash Extension & Eyebrow Styling Combo", price: "22,000 kr", image: "/placeholder-service.jpg" },
      ],
    },
    {
      id: "lashes",
      title: "Lashes Extension",
      subtitle: "Professional eyelash extension services",
      services: [
        { name: "Classic Lashes", price: "14,000 kr", image: "/placeholder-service.jpg" },
        { name: "Classic Lashes - Refill", price: "10,000 kr", image: "/placeholder-service.jpg" },
        { name: "Wet Lashes", price: "15,000 kr", image: "/placeholder-service.jpg" },
        { name: "Wet Lashes - Refill", price: "12,000 kr", image: "/placeholder-service.jpg" },
        { name: "Closed Fans", price: "16,000 kr", image: "/placeholder-service.jpg" },
        { name: "Closed Fans - Refill", price: "12,000 kr", image: "/placeholder-service.jpg" },
        { name: "Tec Volume", price: "15,000 kr", image: "/placeholder-service.jpg" },
        { name: "Tec Volume - Refill", price: "12,000 kr", image: "/placeholder-service.jpg" },
        { name: "Hybrid / Manga / Kim", price: "16,000 kr", image: "/placeholder-service.jpg" },
        { name: "Hybrid / Manga / Kim - Refill", price: "12,000 kr", image: "/placeholder-service.jpg" },
        { name: "American Volume", price: "17,000 kr", image: "/placeholder-service.jpg" },
        { name: "American Volume - Refill", price: "13,000 kr", image: "/placeholder-service.jpg" },
        { name: "Mega Volume", price: "18,000 kr", image: "/placeholder-service.jpg" },
        { name: "Mega Volume - Refill", price: "14,000 kr", image: "/placeholder-service.jpg" },
        { name: "Removal", price: "3,000 kr", image: "/placeholder-service.jpg" },
      ],
    },
    {
      id: "eyebrows",
      title: "Eyebrows",
      subtitle: "Brow shaping, tinting & lamination",
      services: [
        { name: "Eyebrow Shape & Tint", price: "6,000 kr", image: "/placeholder-service.jpg" },
        { name: "Brow Lamination", price: "11,000 kr", image: "/placeholder-service.jpg" },
      ],
    },
    {
      id: "products",
      title: "Products",
      subtitle: "Aftercare & beauty items",
      services: [
        { name: "Lash Cleanser Foam", price: "3,500 kr", image: "/placeholder-service.jpg" },
        { name: "Eyelash Serum", price: "7,900 kr", image: "/placeholder-service.jpg" },
      ],
    },
  ];

  const employees = [
    { id: 1, name: "Anna María", title: "Lash & Brow Specialist", img: "/placeholder-person-1.jpg" },
    { id: 2, name: "Sólveig", title: "Master Lash Artist", img: "/placeholder-person-2.jpg" },
  ];

  const toggleCategory = (title) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const openBooking = (service) => {
    setBookingModal({
      isOpen: true,
      step: 1,
      selectedService: service,
      selectedEmployee: null,
      selectedDate: null,
      selectedTime: null,
    });
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
    <div className="gabbablu-page">
      {/* ========================= HEADER ========================= */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onLoginClick={() => alert("Login clicked")}
      />

      {/* ========================= MAIN CONTENT ========================= */}
      <main className="gabbablu-content">
        {/* ========================= PORTFOLIO GALLERY ========================= */}
        <section className="portfolio-gallery">
          <div className="portfolio-main-image">
            <img src="/portfolio/gabbablu/1.jpg" alt="Gabbablu portfolio" />
          </div>
          <div className="portfolio-grid">
            <div className="portfolio-image"><img src="/portfolio/gabbablu/2.jpg" alt="Portfolio 1" /></div>
            <div className="portfolio-image"><img src="/portfolio/gabbablu/3.jpg" alt="Portfolio 2" /></div>
            <div className="portfolio-image"><img src="/portfolio/gabbablu/4.jpg" alt="Portfolio 3" /></div>
            <div className="portfolio-image"><img src="/portfolio/gabbablu/5.jpg" alt="Portfolio 4" /></div>
          </div>
        </section>

        {/* ========================= STORE INFORMATION ========================= */}
        <section className="store-information">
          <div className="store-details">
            <div className="store-icon">
              <img src="/gabbablulogo.png" alt="Gabbablu logo" />
            </div>
            <div className="store-text">
              <h1 className="store-name">Gabbablu</h1>
              <p className="store-address">📍 Placeholder Street 123, Reykjavík, Iceland</p>
            </div>
          </div>
        </section>

        {/* ========================= TABS ========================= */}
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

        {/* ========================= TAB CONTENT ========================= */}
        <section className="tab-content">
          {/* SERVICES TAB */}
          {activeTab === "services" && (
            <div className="services-section">
              <h2 className="section-heading">Our Services</h2>
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
                              key={idx}
                              className="service-row-item"
                              onClick={() => openBooking(item)}
                            >
                              <div className="service-row-left">
                                <div className="service-thumb-placeholder">
                                  <img src={item.image} alt={item.name} onError={(e) => { e.target.style.display = 'none'; }} />
                                  <span className="thumb-fallback">IMG</span>
                                </div>
                                <span className="service-row-title">{item.name}</span>
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
              <div className="team-grid">
                {employees.map((emp) => (
                  <div className="team-member" key={emp.id}>
                    <img src={emp.img} alt={emp.name} className="team-profile-image" />
                    <h3>{emp.name}</h3>
                    <p>{emp.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="about-section">
              <h2 className="section-heading">About Gabbablu</h2>
              <div className="about-card">
                <div className="about-description">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
                <div className="map-container">
                  <div className="map-placeholder">
                    <span>MAP PLACEHOLDER</span>
                    <span className="map-pin">📍</span>
                  </div>
                  <div className="map-address">
                    <span>Placeholder Street 123, Reykjavík</span>
                    <button>Directions ↗</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ========================= BOOKING MODAL ========================= */}
      {bookingModal.isOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>✕</button>

            {/* STEP 1: CHOOSE EMPLOYEE */}
            {bookingModal.step === 1 && (
              <div className="modal-step">
                <h2>Choose an employee</h2>
                <p className="modal-subtitle">Service: {bookingModal.selectedService?.name}</p>

                <div className="employee-selection-list">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="employee-option-card"
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      <div className="employee-avatar">
                        <img src={emp.img} alt={emp.name} />
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

                {/* Calendar View */}
                <div className="calendar-container">
                  <div className="calendar-header">
                    <span className="calendar-month-title">September 2026</span>
                  </div>

                  {/* Day Headers */}
                  <div className="calendar-weekdays">
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                    <span>Su</span>
                  </div>

                  {/* Calendar Days Grid */}
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

                {/* Available Hours (Visible when an available date is selected) */}
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
                  {/* APPOINTMENT SUMMARY DETAIL VIEW */}
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

                  {/* CONSENT CHECKBOX */}
                  <div className="form-checkbox-group">
                    <input
                      type="checkbox"
                      id="consentKennitala"
                      checked={guestForm.consentKennitala}
                      onChange={(e) => setGuestForm({ ...guestForm, consentKennitala: e.target.checked })}
                    />
                    <label htmlFor="consentKennitala">
                      I consent to Gabbablu storing and processing my Kennitala, phone number, and related customer information for appointment management, customer identification, service records, and applicable cancellation or no-show policies.
                    </label>
                  </div>

                  {/* NO-SHOW / CANCELLATION WARNING */}
                  <div className="cancellation-warning-box">
                    <strong>Cancellation & No-Show Policy</strong>
                    <p>
                      Appointments cancelled less than 48 hours before the scheduled time, and appointments missed without notice, may result in a 5,000 ISK fee. Any applicable fee is handled manually by Gabbablu staff.
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

      {/* ========================= FOOTER ========================= */}
      <Footer />
    </div>
  );
}

export default Gabbablu;