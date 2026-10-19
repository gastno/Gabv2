import { useState } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./CustomerLayout.css";

function CustomerLayout({ pageClassName, children }) {
  const [language, setLanguage] = useState("en");

  return (
    <div className={`customer-layout ${pageClassName || ""}`.trim()}>
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="customer-layout-content">{children}</div>
      <Footer />
    </div>
  );
}

export default CustomerLayout;