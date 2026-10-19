import "./Home.css";
import CustomerLayout from "../../components/layout/CustomerLayout/CustomerLayout";
import BrandChooser from "./BrandChooser";

function Home() {
  return (
    <CustomerLayout pageClassName="home-page">
      <main className="home-content">
        <section className="gradient-space" aria-labelledby="home-brand-statement">
          <p className="home-eyebrow">Reykjavík · Iceland</p>
          <h1 id="home-brand-statement">
            <img src="/gbbco.svg" alt="" aria-hidden="true" />
            <span className="home-brand-copy">
              <span className="home-brand-name">gbb &amp; co</span>
              <span className="home-brand-tagline">Independent beauty &amp; tattoo studios</span>
            </span>
          </h1>
        </section>
        <BrandChooser />
      </main>
    </CustomerLayout>
  );
}

export default Home;