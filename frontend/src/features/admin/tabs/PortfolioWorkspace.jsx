import { useEffect, useState } from "react";
import { brandApi } from "../../../services/api";
import PortfolioTab from "./PortfolioTab";

function PortfolioWorkspace({ onBrandUpdate }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError("");
    setBrands([]);

    brandApi.getManageable()
      .then((data) => {
        if (!Array.isArray(data) || data.some((brand) => (
          !brand || brand.id == null || typeof brand.name !== "string"
        ))) {
          throw new Error("The studios response was incomplete.");
        }
        if (isCurrent) setBrands(data);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message || "Could not load studios.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [attempt]);

  const handleBrandUpdate = (brandId, changes) => {
    setBrands((current) => current.map((brand) => (
      String(brand.id) === String(brandId) ? { ...brand, ...changes } : brand
    )));
    onBrandUpdate?.(brandId, changes);
  };

  return (
    <PortfolioTab
      brands={brands}
      loadingBrands={loading}
      brandsError={error}
      onRetryBrands={() => setAttempt((current) => current + 1)}
      onBrandUpdate={handleBrandUpdate}
    />
  );
}

export default PortfolioWorkspace;
