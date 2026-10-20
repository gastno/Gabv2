import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./CustomerLayout.css";

function CustomerLayout({ pageClassName, children }) {
  return (
    <div className={`customer-layout ${pageClassName || ""}`.trim()}>
      <Header />
      <div className="customer-layout-content">{children}</div>
      <Footer />
    </div>
  );
}

export default CustomerLayout;