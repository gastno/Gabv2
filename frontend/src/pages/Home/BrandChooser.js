import { Link } from "react-router-dom";

function BrandChooser() {
  return (
    <div className="interactive-container">
      <Link
        to="/studios/gabbablu"
        className="interactive-side beauty-side"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 19, 22, 0.65), rgba(18, 19, 22, 0.85)), url('/beauty1.jpg')",
        }}
      >
        <img
          src="/gabbablulogo.png"
          alt="Gabbablu"
          className="interactive-logo"
        />
        <span className="interactive-subtitle">Gabbablu</span>
      </Link>

      <Link
        to="/studios/amortattoo"
        className="interactive-side tattoo-side"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 19, 22, 0.65), rgba(18, 19, 22, 0.85)), url('/tattoo1.jpg')",
        }}
      >
        <img
          src="/amortattoo.png"
          alt="Amor Tattoo"
          className="interactive-logo"
        />
        <span className="interactive-subtitle">Amor Tattoo</span>
      </Link>
    </div>
  );
}

export default BrandChooser;