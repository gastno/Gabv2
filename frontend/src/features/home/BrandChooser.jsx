import { Link } from "react-router-dom";

function BrandChooser() {
  return (
    <div className="interactive-container" id="studio-choices">
      <Link
        to="/studios/gabbablu"
        className="interactive-side beauty-side"
      >
        <img className="interactive-image" src="/beauty1.jpg" alt="" width="1600" height="1067" />
        <img
          src="/gabbablulogo.png"
          alt=""
          className="interactive-logo"
          width="500"
          height="500"
        />
        <span className="interactive-subtitle">Gabbablu</span>
      </Link>

      <Link
        to="/studios/amortattoo"
        className="interactive-side tattoo-side"
      >
        <img className="interactive-image" src="/tattoo1.jpg" alt="" width="1600" height="1067" />
        <img
          src="/amortattoo.png"
          alt=""
          className="interactive-logo"
          width="500"
          height="500"
        />
        <span className="interactive-subtitle">Amor Tattoo</span>
      </Link>
    </div>
  );
}

export default BrandChooser;