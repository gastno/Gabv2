import { Link } from "react-router-dom";
import CustomerLayout from "../components/layout/CustomerLayout/CustomerLayout";
import "./LegalPages.css";

function CookieSettingsPage() {
  return (
    <CustomerLayout pageClassName="legal-page">
      <main className="legal-content">
        <p className="legal-eyebrow">gbb &amp; co · Your browser choices</p>
        <h1>Cookie settings</h1>
        <p className="legal-intro">
          We aim to use only the browser storage needed to provide the booking
          service. We do not currently use optional analytics or advertising
          cookies in this website.
        </p>

        <section className="cookie-setting-card" aria-labelledby="necessary-storage">
          <div>
            <h2 id="necessary-storage">Essential account storage</h2>
            <p>
              The site uses your browser’s local storage to keep account
              session information and, when signed in, your display name. This
              is browser storage, not a cookie. It supports sign-in and
              account-related features.
            </p>
          </div>
          <span className="cookie-setting-status">Always active</span>
        </section>

        <section>
          <h2>Optional cookies</h2>
          <p>
            No optional analytics, advertising or personalization cookies are
            currently configured by the website, so there are no optional
            cookie categories to enable or disable here. If optional cookies
            are introduced, this page and the consent controls will be
            updated before they are used.
          </p>
        </section>

        <section>
          <h2>Managing browser storage</h2>
          <p>
            You can clear this site’s stored data through your browser
            settings. Clearing local storage may sign you out and remove saved
            session information. You can also sign out using the site’s
            account controls.
          </p>
          <p>
            For details about the personal information used by the booking
            system, read our <Link to="/privacy-policy">Privacy policy</Link>.
          </p>
        </section>

        <aside className="legal-notice" role="note">
          This description reflects the website application as currently
          configured. Hosting or other third-party services may use their own
          storage; the operator must verify the production setup and update
          this page if it changes.
        </aside>
      </main>
    </CustomerLayout>
  );
}

export default CookieSettingsPage;
