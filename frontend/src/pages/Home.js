import { useState } from "react";

function Home() {
  const [language, setLanguage] = useState("en");

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo-space" />

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

          <button className="login-button">Log in</button>
        </div>
      </div>

      {/* Gradient Space */}
      <div className="gradient-space" />

      {/* Interactive Dual Section */}
      <div className="interactive-container">
        {/* Gabbablu */}
        <div className="interactive-side beauty-side">
          <img
            src="/gabbablulogo.png"
            alt="Gabbablu"
            className="interactive-logo"
          />

          <div className="interactive-subtitle">Gabbablu</div>
        </div>

        {/* Amor Tattoo */}
        <div className="interactive-side tattoo-side">
          <img
            src="/amortattoo.png"
            alt="Amor Tattoo"
            className="interactive-logo"
          />

          <div className="interactive-subtitle">Amor Tattoo</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          {/* Logo and Top Buttons */}
          <div className="footer-top">
            <div className="footer-logo">
              <div className="footer-logo-placeholder" />
            </div>

            <div className="footer-top-buttons">
              <button className="footer-top-button" />
              <button className="footer-top-button" />
            </div>
          </div>

          <div className="footer-divider" />

          {/* Footer Sections */}
          <div className="footer-sections">
            {/* Mission */}
            <div className="footer-section">
              <h3 className="footer-title">Our Mission</h3>

              <p className="footer-text">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            {/* Footer Columns */}
            <div className="footer-columns">
              {/* Contact */}
              <div className="footer-section">
                <h3 className="footer-title">Contact us</h3>
                <button className="footer-button">Contact</button>
              </div>

              {/* Legal */}
              <div className="footer-section">
                <h3 className="footer-title">Legal</h3>
                <button className="footer-button">Privacy policy</button>
                <button className="footer-button">Cookie settings</button>
              </div>

              {/* Social */}
              <div className="footer-section">
                <h3 className="footer-title">Find us on</h3>
                <button className="footer-button">Facebook</button>
                <button className="footer-button">Instagram</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;