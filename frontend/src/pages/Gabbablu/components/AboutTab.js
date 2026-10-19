function AboutTab({ brand }) {
  return (
    <div className="about-section">
      <h2 className="section-heading">About {brand.name}</h2>
      <div className="about-card">
        <div className="about-description">
          {brand.about_description && <p>{brand.about_description}</p>}
        </div>
        <div className="map-container">
          <div className="map-placeholder">
            <span className="map-pin" aria-label="Studio location" role="img" />
          </div>
          <div className="map-address">
            <span>{brand.location}</span>
            <button type="button">Directions ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutTab;
