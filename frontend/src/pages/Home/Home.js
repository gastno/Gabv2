import "./Home.css";
import CustomerLayout from "../../components/CustomerLayout/CustomerLayout";
import BrandChooser from "./BrandChooser";

function Home() {
  return (
    <CustomerLayout pageClassName="home-page">
      <main className="home-content">
        <div className="gradient-space" />
        <BrandChooser />
      </main>
    </CustomerLayout>
  );
}

export default Home;