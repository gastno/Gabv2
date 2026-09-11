import React, { useState } from "react";
import "./Home.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function Home() {
  const [language, setLanguage] = useState("en");

  return (
    <div className="home-page">
      {/* Reusable Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onLoginClick={() => alert("Login clicked")}
      />

      <main className="home-content">
        {/* Gradient Space */}
        <div className="gradient-space" />

        {/* Interactive Dual Section */}
        <div className="interactive-container">
          {/* Gabbablu */}
          <div className="interactive-side beauty-side">
            <img
              src="/gabbablulogo.png"
              alt="Gabbablu"
              className="interactive-logo"
            />

            <div className="interactive-subtitle">
              Gabbablu
            </div>
          </div>

          {/* Amor Tattoo */}
          <div className="interactive-side tattoo-side">
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