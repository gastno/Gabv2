function AboutTab({ brand }) {
  return (
    <div className="about-section">
      <h2 className="section-heading">About {brand.name}</h2>
      <div className="about-card">
        <div className="about-description">
          <p>{brand.about_description}</p>
        </div>
        <div className="map-container">
          <div className="map-placeholder">
            <span>MAP PLACEHOLDER</span>
            <span className="map-pin">📍</span>
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
