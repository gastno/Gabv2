import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./CustomerLayout.css";

function CustomerLayout({ pageClassName, background, children }) {
  return (
    <div className={`customer-layout ${pageClassName || ""}`.trim()}>
      {background}
      <Header />
      <div className="customer-layout-content">{children}</div>
      <Footer />
    </div>
  );
}

export default CustomerLayout;