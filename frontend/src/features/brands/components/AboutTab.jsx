import { useLanguage } from "../../../components/i18n/LanguageContext";

function AboutTab({ brand }) {
  const { t } = useLanguage();

  return (
    <div className="about-section">
      <h2 className="section-heading">{t("studio.aboutHeading", { brand: brand.name })}</h2>
      <div className="about-card">
        <div className="about-description">
          {brand.about_description && <p>{brand.about_description}</p>}
        </div>
        <div className="map-container">
          <div className="map-placeholder">
            <span className="map-pin" aria-label={t("studio.location")} role="img" />
          </div>
          <div className="map-address">
            <span>{brand.location}</span>
            <button type="button">{t("studio.directions")} ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutTab;
