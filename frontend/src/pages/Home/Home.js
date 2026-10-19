import "./Home.css";
import CustomerLayout from "../../components/CustomerLayout/CustomerLayout";
import BrandChooser from "./BrandChooser";

function Home() {
  return (
    <CustomerLayout pageClassName="home-page">
      <main className="home-content">
        <section className="gradient-space" aria-labelledby="home-brand-statement">
          <p className="home-eyebrow">Reykjavík · Iceland</p>
          <h1 id="home-brand-statement">
            HÚÐ &amp; BLEK
            <span>— DERMO-TATTOO CARE &amp; ARTISTRY</span>
          </h1>
        </section>
        <BrandChooser />
      </main>
    </CustomerLayout>
  );
}

export default Home;