import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-content">

        {/* Top Section */}
        <div className="site-footer-top">

          {/* Logo */}
          <div className="site-footer-logo">
            <div className="site-footer-logo-placeholder">
              Logo
            </div>
          </div>

          {/* Top Buttons */}
          <div className="site-footer-top-buttons">
            <button
              className="site-footer-top-button"
              aria-label="Footer action 1"
            />

            <button
              className="site-footer-top-button"
              aria-label="Footer action 2"
            />
          </div>

        </div>

        {/* Divider */}
        <div className="site-footer-divider" />

        {/* Main Content */}
        <div className="site-footer-sections">

          {/* Mission */}
          <div className="site-footer-section">
            <h3 className="site-footer-title">
              Our Mission
            </h3>

            <p className="site-footer-text">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Links */}
          <div className="site-footer-columns">

            {/* Contact */}
            <div className="site-footer-section">
              <h3 className="site-footer-title">
                Contact us
              </h3>

              <button className="site-footer-button">
                Contact
              </button>
            </div>

            {/* Legal */}
            <div className="site-footer-section">
              <h3 className="site-footer-title">
                Legal
              </h3>

              <button className="site-footer-button">
                Privacy policy
              </button>

              <button className="site-footer-button">
                Cookie settings
              </button>
            </div>

            {/* Social */}
            <div className="site-footer-section">
              <h3 className="site-footer-title">
                Find us on
              </h3>

              <button className="site-footer-button">
                Facebook
              </button>

              <button className="site-footer-button">
                Instagram
              </button>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;