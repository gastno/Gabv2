import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="site-footer-top">
          <div className="site-footer-logo">
            <img src="/gbbco.svg" alt="" aria-hidden="true" />
            <div className="site-footer-brand-copy">
              <span className="site-footer-wordmark">gbb &amp; co</span>
              <span className="site-footer-tagline">Beauty &amp; tattoo studios</span>
            </div>
          </div>
        </div>
        <div className="site-footer-divider" />
        <p className="site-footer-text">Independent beauty and tattoo studios in Reykjavík, Iceland.</p>
      </div>
    </footer>
  );
}

export default Footer;