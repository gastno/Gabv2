import { useState } from "react";

function Gabbablu() {
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("services");

  return (
    <div className="gabbablu-page">

      {/* =========================
          TOP BAR
      ========================= */}
      <header className="top-bar">
        <div className="logo-space">
          LOGO
        </div>

        <div className="spacer" />

        <div className="controls">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-dropdown"
          >
            <option value="en">English</option>
            <option value="is">Íslenska</option>
          </select>

          <button className="login-button">
            Log in
          </button>
        </div>
      </header>


      {/* =========================
          MAIN CONTENT
      ========================= */}
      <main className="gabbablu-content">


        {/* =========================
            PORTFOLIO GALLERY
        ========================= */}
        <section className="portfolio-gallery">

          {/* Large Image */}
          <div className="portfolio-main-image">
            <img
              src="/placeholder-main.jpg"
              alt="Gabbablu portfolio"
            />
          </div>


          {/* Four Smaller Images */}
          <div className="portfolio-grid">

            <div className="portfolio-image">
              <img
                src="/placeholder-1.jpg"
                alt="Portfolio 1"
              />
            </div>

            <div className="portfolio-image">
              <img
                src="/placeholder-2.jpg"
                alt="Portfolio 2"
              />
            </div>

            <div className="portfolio-image">
              <img
                src="/placeholder-3.jpg"
                alt="Portfolio 3"
              />
            </div>

            <div className="portfolio-image">
              <img
                src="/placeholder-4.jpg"
                alt="Portfolio 4"
              />
            </div>

          </div>

        </section>


        {/* =========================
            STORE INFORMATION
        ========================= */}
        <section className="store-information">

          {/* Store Details */}
          <div className="store-details">

            <div className="store-icon">
              G
            </div>

            <div className="store-text">

              <h1 className="store-name">
                Gabbablu
              </h1>

              <p className="store-address">
                📍 Placeholder Street 123, Reykjavík, Iceland
              </p>

            </div>

          </div>


          {/* Business Hours */}
          <div className="business-hours">

            <h3>Business hours</h3>

            <div className="hours-row">
              <span>Monday - Friday</span>
              <span>09:00 - 18:00</span>
            </div>

            <div className="hours-row">
              <span>Saturday</span>
              <span>10:00 - 16:00</span>
            </div>

            <div className="hours-row">
              <span>Sunday</span>
              <span>Closed</span>
            </div>

          </div>

        </section>


        {/* =========================
            TABS
        ========================= */}
        <section className="store-tabs">

          <button
            className={`tab-button ${
              activeTab === "services" ? "active" : ""
            }`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </button>

          <button
            className={`tab-button ${
              activeTab === "team" ? "active" : ""
            }`}
            onClick={() => setActiveTab("team")}
          >
            Our Team
          </button>

          <button
            className={`tab-button ${
              activeTab === "about" ? "active" : ""
            }`}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>

        </section>


        {/* =========================
            TAB CONTENT
        ========================= */}
        <section className="tab-content">


          {/* =========================
              SERVICES
          ========================= */}
          {activeTab === "services" && (
            <div className="services-section">

              <h2 className="section-heading">
                Our Services
              </h2>

              <div className="services-grid">

                <div className="service-card">
                  <div className="service-image-placeholder">
                    IMAGE
                  </div>

                  <div className="service-content">
                    <h3>Service Placeholder</h3>

                    <p>
                      Lorem ipsum dolor sit amet, consectetur
                      adipiscing elit.
                    </p>

                    <span className="service-price">
                      From $00
                    </span>
                  </div>
                </div>


                <div className="service-card">
                  <div className="service-image-placeholder">
                    IMAGE
                  </div>

                  <div className="service-content">
                    <h3>Service Placeholder</h3>

                    <p>
                      Lorem ipsum dolor sit amet, consectetur
                      adipiscing elit.
                    </p>

                    <span className="service-price">
                      From $00
                    </span>
                  </div>
                </div>


                <div className="service-card">
                  <div className="service-image-placeholder">
                    IMAGE
                  </div>

                  <div className="service-content">
                    <h3>Service Placeholder</h3>

                    <p>
                      Lorem ipsum dolor sit amet, consectetur
                      adipiscing elit.
                    </p>

                    <span className="service-price">
                      From $00
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}


          {/* =========================
              TEAM
          ========================= */}
          {activeTab === "team" && (
            <div className="team-section">

              <h2 className="section-heading">
                The People
              </h2>

              <div className="team-grid">


                {/* Person 1 */}
                <div className="team-member">

                  <img
                    src="/placeholder-person-1.jpg"
                    alt="Team member"
                    className="team-profile-image"
                  />

                  <h3>Person Name</h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit.
                  </p>

                </div>


                {/* Person 2 */}
                <div className="team-member">

                  <img
                    src="/placeholder-person-2.jpg"
                    alt="Team member"
                    className="team-profile-image"
                  />

                  <h3>Person Name</h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit.
                  </p>

                </div>


                {/* Person 3 */}
                <div className="team-member">

                  <img
                    src="/placeholder-person-3.jpg"
                    alt="Team member"
                    className="team-profile-image"
                  />

                  <h3>Person Name</h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit.
                  </p>

                </div>


                {/* Person 4 */}
                <div className="team-member">

                  <img
                    src="/placeholder-person-4.jpg"
                    alt="Team member"
                    className="team-profile-image"
                  />

                  <h3>Person Name</h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit.
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =========================
              ABOUT
          ========================= */}
          {activeTab === "about" && (
            <div className="about-section">

              <h2 className="section-heading">
                About Gabbablu
              </h2>


              <div className="about-card">

                {/* Description */}
                <div className="about-description">

                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing
                    elit. Sed do eiusmod tempor incididunt ut labore et
                    dolore magna aliqua.
                  </p>

                  <p>
                    Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo
                    consequat.
                  </p>

                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate
                    velit esse cillum dolore eu fugiat nulla pariatur.
                  </p>

                </div>


                {/* Map */}
                <div className="map-container">

                  <div className="map-placeholder">
                    <span>MAP PLACEHOLDER</span>
                    <span className="map-pin">📍</span>
                  </div>

                  <div className="map-address">

                    <span>
                      Placeholder Street 123, Reykjavík
                    </span>

                    <button>
                      Directions ↗
                    </button>

                  </div>

                </div>

              </div>

            </div>
          )}

        </section>

      </main>


      {/* =========================
          FOOTER
      ========================= */}
      <footer className="footer">

        <div className="footer-content">


          {/* Footer Top */}
          <div className="footer-top">

            <div className="footer-logo">
              <div className="footer-logo-placeholder">
                LOGO
              </div>
            </div>


            <div className="footer-top-buttons">
              <button className="footer-top-button">
                ↗
              </button>

              <button className="footer-top-button">
                ●
              </button>
            </div>

          </div>


          <div className="footer-divider" />


          {/* Footer Content */}
          <div className="footer-sections">


            {/* Mission */}
            <div className="footer-section">

              <h3 className="footer-title">
                Our Mission
              </h3>

              <p className="footer-text">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Sed do eiusmod tempor incididunt ut labore et dolore
                magna aliqua.
              </p>

            </div>


            {/* Columns */}
            <div className="footer-columns">


              <div className="footer-section">

                <h3 className="footer-title">
                  Contact us
                </h3>

                <button className="footer-button">
                  Contact
                </button>

              </div>


              <div className="footer-section">

                <h3 className="footer-title">
                  Legal
                </h3>

                <button className="footer-button">
                  Privacy policy
                </button>

                <button className="footer-button">
                  Cookie settings
                </button>

              </div>


              <div className="footer-section">

                <h3 className="footer-title">
                  Find us on
                </h3>

                <button className="footer-button">
                  Facebook
                </button>

                <button className="footer-button">
                  Instagram
                </button>

              </div>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Gabbablu;