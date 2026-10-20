import CustomerLayout from "../components/layout/CustomerLayout/CustomerLayout";
import { useLanguage } from "../components/i18n/LanguageContext";
import "./LegalPages.css";

function PrivacyPolicyPage() {
  const { language, t } = useLanguage();
  const informationItems = [1, 2, 3, 4, 5].map((number) => t(`privacy.information.${number}`));
  const purposeItems = [1, 2, 3, 4].map((number) => t(`privacy.purpose.${number}`));

  return (
    <CustomerLayout pageClassName="legal-page">
      <main className="legal-content">
        <p className="legal-eyebrow">{t("legal.customerInfo")}</p>
        <h1>{t("legal.privacyTitle")}</h1>
        <p className="legal-intro">{t("privacy.intro")}</p>
        <aside className="legal-notice" role="note">
          <strong>{t("legal.provisional")}</strong> {t("privacy.provisional")}
        </aside>

        <section>
          <h2>{t("privacy.controller.title")}</h2>
          <p>{t("privacy.controller.body")}</p>
        </section>

        <section>
          <h2>{t("privacy.information.title")}</h2>
          <ul>{informationItems.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>{t("privacy.information.note")}</p>
        </section>

        <section>
          <h2>{t("privacy.purpose.title")}</h2>
          <ul>{purposeItems.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>{t("privacy.purpose.note")}</p>
        </section>

        <section>
          <h2>{t("privacy.cancellation.title")}</h2>
          <p>{t("privacy.cancellation.body")}</p>
          <blockquote>{t("privacy.cancellation.quote")}</blockquote>
          <p>{t("privacy.cancellation.note")}</p>
        </section>

        <section>
          <h2>{t("privacy.tattoo.title")}</h2>
          <p>{t("privacy.tattoo.1")}</p>
          <p>{t("privacy.tattoo.2")}</p>
        </section>

        <section>
          <h2>{t("privacy.recipients.title")}</h2>
          <p>{t("privacy.recipients.body")}</p>
        </section>

        <section>
          <h2>{t("privacy.retention.title")}</h2>
          <p>{t("privacy.retention.body")}</p>
        </section>

        <section>
          <h2>{t("privacy.rights.title")}</h2>
          <p>{t("privacy.rights.body")} <a href="https://www.personuvernd.is/" target="_blank" rel="noreferrer">{language === "is" ? "Persónuverndar" : "Persónuvernd"}</a>. {t("privacy.rights.afterLink")}</p>
        </section>

        <section>
          <h2>{t("privacy.changes.title")}</h2>
          <p>{t("privacy.changes.body")}</p>
        </section>
      </main>
    </CustomerLayout>
  );
}

export default PrivacyPolicyPage;
