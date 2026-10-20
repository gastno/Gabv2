import { Link } from "react-router-dom";
import CustomerLayout from "../components/layout/CustomerLayout/CustomerLayout";
import { useLanguage } from "../components/i18n/LanguageContext";
import "./LegalPages.css";

function CookieSettingsPage() {
  const { t } = useLanguage();

  return (
    <CustomerLayout pageClassName="legal-page">
      <main className="legal-content">
        <p className="legal-eyebrow">{t("legal.cookieEyebrow")}</p>
        <h1>{t("legal.cookiesTitle")}</h1>
        <p className="legal-intro">{t("legal.cookieIntro")}</p>

        <section className="cookie-setting-card" aria-labelledby="necessary-storage">
          <div>
            <h2 id="necessary-storage">{t("legal.essentialStorage")}</h2>
            <p>{t("legal.cookieStorage")}</p>
          </div>
          <span className="cookie-setting-status">{t("legal.alwaysActive")}</span>
        </section>

        <section>
          <h2>{t("legal.optionalCookies")}</h2>
          <p>{t("legal.noOptionalCookies")}</p>
        </section>

        <section>
          <h2>{t("legal.manageStorage")}</h2>
          <p>{t("legal.storageHelp")}</p>
          <p>
            {t("legal.readMore")} <Link to="/privacy-policy">{t("legal.privacyLink")}</Link>.
          </p>
        </section>

        <aside className="legal-notice" role="note">
          {t("legal.cookieNotice")}
        </aside>
      </main>
    </CustomerLayout>
  );
}

export default CookieSettingsPage;
