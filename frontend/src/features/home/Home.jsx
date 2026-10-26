import "./Home.css";
import CustomerLayout from "../../components/layout/CustomerLayout/CustomerLayout";
import BrandChooser from "./BrandChooser";
import { useLanguage } from "../../components/i18n/LanguageContext";

function Home() {
  const { t } = useLanguage();

  return (
    <CustomerLayout pageClassName="home-page">
      <main className="home-content">
        <section className="home-hero" aria-labelledby="home-brand-statement">
          <h1 id="home-brand-statement">
            <span className="home-brand-copy">
              <span className="home-brand-name">gbb &amp; co</span>
            </span>
          </h1>
          <div className="home-hero-copy">
            <p className="home-brand-tagline">{t("home.tagline")}</p>
            <p className="home-location">{t("home.location")}</p>
            <a className="home-primary-action" href="#studio-choices">
              {t("home.chooseStudio")}
            </a>
          </div>
        </section>
        <BrandChooser />
      </main>
    </CustomerLayout>
  );
}

export default Home;