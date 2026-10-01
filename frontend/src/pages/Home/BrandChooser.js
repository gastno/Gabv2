import { Link } from "react-router-dom";

function BrandChooser() {
  return (
    <div className="interactive-container">
      <Link to="/studios/gabbablu" className="interactive-side beauty-side">
        <img
          src="/gabbablulogo.png"
          alt="Gabbablu"
          className="interactive-logo"
        />
        <span className="interactive-subtitle">Gabbablu</span>
      </Link>

      <Link to="/studios/amortattoo" className="interactive-side tattoo-side">
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