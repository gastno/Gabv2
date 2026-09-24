import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function Home() {
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="home-page">
      {/* Reusable Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
      />

      <main className="home-content">
        {/* Gradient Banner Space */}
        <div className="gradient-space" />

        {/* Interactive Dual Section */}
        <div className="interactive-container">
          {/* Gabbablu Card */}
          <div 
            className="interactive-side beauty-side"
            onClick={() => handleNavigate("/studios/gabbablu")}
          >
            <img
              src="/gabbablulogo.png"
              alt="Gabbablu"
              className="interactive-logo"
            />

            <div className="interactive-subtitle">
              Gabbablu
            </div>
          </div>

          {/* Amor Tattoo Card */}
          <div 
            className="interactive-side tattoo-side"
            onClick={() => handleNavigate("/studios/amortattoo")}
          >
            <img
              src="/amortattoo.png"
              alt="Amor Tattoo"
              className="interactive-logo"
            />

            <div className="interactive-subtitle">
              Amor Tattoo
            </div>
          </div>
        </div>
      </main>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}

export default Home;