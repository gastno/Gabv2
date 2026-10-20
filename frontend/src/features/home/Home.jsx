import "./Home.css";
import CustomerLayout from "../../components/layout/CustomerLayout/CustomerLayout";
import BrandChooser from "./BrandChooser";
import { useLanguage } from "../../components/i18n/LanguageContext";

function Home() {
  const { t } = useLanguage();

  return (
    <CustomerLayout pageClassName="home-page">
      <main className="home-content">
        <section className="gradient-space" aria-labelledby="home-brand-statement">
          <p className="home-eyebrow">{t("home.location")}</p>
          <h1 id="home-brand-statement">
            <span className="home-brand-copy">
              <span className="home-brand-name">gbb &amp; co</span>
              <span className="home-brand-tagline">{t("home.tagline")}</span>
            </span>
          </h1>
        </section>
        <BrandChooser />
      </main>
    </CustomerLayout>
  );
}

export default Home;