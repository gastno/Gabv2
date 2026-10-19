import "./Footer.css";

const socialLinks = [
  {
    href: "https://www.instagram.com/gabbablu/",
    label: "Instagram · Gabbablu",
    network: "instagram",
  },
  {
    href: "https://www.facebook.com/gabbablu",
    label: "Facebook · Gabbablu",
    network: "facebook",
  },
  {
    href: "https://www.instagram.com/amorttt.is/",
    label: "Instagram · Amor Tattoo",
    network: "instagram",
  },
];

function SocialIcon({ network }) {
  if (network === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.3H7.2v3.2H10V21h3.4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="site-footer-icon-dot" cx="17.5" cy="6.8" r="1" />
    </svg>
  );
}

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
          <div className="site-footer-links">
            <section className="site-footer-section" aria-labelledby="footer-find-us">
              <h2 id="footer-find-us">Find Us</h2>
              <ul>
                {socialLinks.map(({ href, label, network }) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="noreferrer">
                      <SocialIcon network={network} />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section className="site-footer-section" aria-labelledby="footer-legal">
              <h2 id="footer-legal">Legal</h2>
              <ul>
                <li><a href="/privacy-policy">Privacy policy</a></li>
                <li><a href="/cookie-settings">Cookie settings</a></li>
              </ul>
            </section>
          </div>
        </div>
        <div className="site-footer-divider" />
        <p className="site-footer-text">Independent beauty and tattoo studios in Reykjavík, Iceland.</p>
      </div>
    </footer>
  );
}

export default Footer;