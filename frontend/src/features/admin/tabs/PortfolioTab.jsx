import { useEffect, useMemo, useState } from "react";
import { brandPortfolioApi, getAssetUrl } from "../../../services/api";
import "./PortfolioTab.css";

const FALLBACK_LAYOUTS = [
  { id: "grid", name: "Classic grid" },
  { id: "masonry", name: "Masonry grid" },
  { id: "mosaic", name: "Mixed-size grid" },
  { id: "feature", name: "Featured image grid" },
  { id: "carousel", name: "Carousel" },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function PortfolioTab({ brands = [], loadingBrands = false, onBrandUpdate }) {
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioBrandId, setPortfolioBrandId] = useState("");
  const [savedLayout, setSavedLayout] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("");
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedBrand = brands.find((brand) => String(brand.id) === selectedBrandId);
  const portfolioIsCurrent = portfolioBrandId === selectedBrandId;
  const layouts = useMemo(() => (
    portfolio?.available_layouts?.length ? portfolio.available_layouts : FALLBACK_LAYOUTS
  ), [portfolio]);
  const hasUnsavedChanges = Boolean(
    portfolio && (
      selectedLayout !== savedLayout
      || portfolio.images.some((image, index) => String(image.id) !== String(
        portfolio.savedImageIds[index]
      ))
      || portfolio.images.length !== portfolio.savedImageIds.length
    )
  );

  useEffect(() => {
    if (!selectedBrandId && brands.length > 0) {
      setSelectedBrandId(String(brands[0].id));
    }
  }, [brands, selectedBrandId]);

  useEffect(() => {
    if (!selectedBrandId) {
      setPortfolio(null);
      return undefined;
    }

    let isCurrent = true;
    setLoadingPortfolio(true);
    setError("");
    setMessage("");
    setPortfolio(null);

    brandPortfolioApi.get(selectedBrandId)
      .then((data) => {
        if (!isCurrent) return;
        if (!data || !Array.isArray(data.images) || !Array.isArray(data.available_layouts)) {
          throw new Error("The portfolio response was incomplete.");
        }
        const savedImageIds = data.images.map((image) => String(image.id));
        setPortfolio({ ...data, images: data.images, savedImageIds });
        setPortfolioBrandId(selectedBrandId);
        setSavedLayout(data.layout);
        setSelectedLayout(data.layout);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message || "Could not load this portfolio.");
      })
      .finally(() => {
        if (isCurrent) setLoadingPortfolio(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedBrandId]);

  const handleImageSelection = async (event, action, kind) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Images must be 5 MB or smaller.");
      return;
    }

    setUploading(kind);
    try {
      const result = await action(selectedBrandId, file);
      if (kind === "portfolio") {
        if (!result.image?.id || !result.image?.image_url) {
          throw new Error("The upload response did not include the saved image.");
        }
        setPortfolio((current) => ({
          ...current,
          images: [...current.images, result.image],
        }));
        setMessage("Portfolio image added. Save after arranging it to update the display order.");
      } else {
        const field = kind === "logo" ? "logo_url" : "cover_image_url";
        if (!result.brand?.[field]) {
          throw new Error("The upload response did not include the saved image.");
        }
        onBrandUpdate?.(selectedBrandId, { [field]: result.brand[field] });
        setMessage(`${kind === "logo" ? "Studio logo" : "Cover image"} updated.`);
      }
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the image.");
    } finally {
      setUploading("");
    }
  };

  const moveImage = (imageIndex, direction) => {
    setPortfolio((current) => {
      const nextImages = [...current.images];
      const targetIndex = imageIndex + direction;
      if (targetIndex < 0 || targetIndex >= nextImages.length) return current;
      [nextImages[imageIndex], nextImages[targetIndex]] = [
        nextImages[targetIndex],
        nextImages[imageIndex],
      ];
      return { ...current, images: nextImages };
    });
  };

  const handleDeleteImage = async (image) => {
    setError("");
    setMessage("");
    setDeletingImageId(image.id);
    try {
      await brandPortfolioApi.deleteImage(selectedBrandId, image.id);
      setPortfolio((current) => ({
        ...current,
        images: current.images.filter((item) => String(item.id) !== String(image.id)),
      }));
      setMessage("Portfolio image removed.");
    } catch (deleteError) {
      setError(deleteError.message || "Could not remove the image.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSave = async () => {
    if (!portfolio || !hasUnsavedChanges) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const data = await brandPortfolioApi.save(selectedBrandId, {
        layout: selectedLayout,
        imageIds: portfolio.images.map((image) => image.id),
      });
      if (!data || !Array.isArray(data.images) || !Array.isArray(data.available_layouts)) {
        throw new Error("The save response was incomplete.");
      }
      const savedImageIds = data.images.map((image) => String(image.id));
      setPortfolio({ ...data, savedImageIds });
      setSavedLayout(data.layout);
      setSelectedLayout(data.layout);
      setMessage("Gallery layout and image order saved.");
    } catch (saveError) {
      setError(saveError.message || "Could not save the gallery layout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-section portfolio-admin">
      <div className="section-header">
        <div>
          <h1>Studio imagery &amp; portfolio</h1>
          <p className="subtitle">
            Update studio photos, choose a gallery layout, and arrange portfolio images.
          </p>
        </div>
      </div>

      {loadingBrands ? (
        <p>Loading studios...</p>
      ) : brands.length === 0 ? (
        <p className="portfolio-empty">No studios are available to edit.</p>
      ) : (
        <>
          <label className="portfolio-brand-field">
            <span>Studio</span>
            <select
              value={selectedBrandId}
              disabled={Boolean(uploading || saving || deletingImageId)}
              onChange={(event) => setSelectedBrandId(event.target.value)}
            >
              {brands.map((brand) => (
                <option value={brand.id} key={brand.id}>{brand.name}</option>
              ))}
            </select>
          </label>

          {loadingPortfolio && <p className="portfolio-state">Loading portfolio...</p>}
          {error && <p className="portfolio-feedback portfolio-feedback-error" role="alert">{error}</p>}

          {portfolioIsCurrent && portfolio && (
            <div key={selectedBrandId} className="portfolio-studio-content">
              {selectedBrand && (
                <div className="portfolio-brand-images">
                  <ImageUploadField
                    title="Studio logo"
                    description="Square or transparent logos work best."
                    currentUrl={selectedBrand.logo_url}
                    fallbackUrl={selectedBrand.slug === "amor-tattoo" ? "/amortattoo.png" : "/gabbablulogo.png"}
                    busy={uploading === "logo"}
                    disabled={Boolean(uploading || saving || deletingImageId)}
                    onChange={(event) => handleImageSelection(event, brandPortfolioApi.uploadLogo, "logo")}
                  />
                  <ImageUploadField
                    title="Cover image"
                    description="Displayed above the portfolio gallery."
                    currentUrl={selectedBrand.cover_image_url}
                    busy={uploading === "cover"}
                    disabled={Boolean(uploading || saving || deletingImageId)}
                    onChange={(event) => handleImageSelection(event, brandPortfolioApi.uploadCover, "cover")}
                  />
                </div>
              )}

              {message && <p className="portfolio-feedback" role="status">{message}</p>}

              <div className="portfolio-layout-heading">
                <div>
                  <h4>Gallery layout</h4>
                  <p className="subtitle">Choose how images appear on the customer studio page.</p>
                </div>
              </div>

              <div className="portfolio-layout-options" aria-label="Available gallery layouts">
                {layouts.map((layout) => (
                  <button
                    type="button"
                    key={layout.id}
                    className={`portfolio-layout-option ${selectedLayout === layout.id ? "selected" : ""}`}
                    aria-pressed={selectedLayout === layout.id}
                    disabled={Boolean(uploading || saving || deletingImageId)}
                    onClick={() => setSelectedLayout(layout.id)}
                  >
                    <span className={`portfolio-layout-preview preview-${layout.id}`} aria-hidden="true">
                      <i /><i /><i /><i />
                    </span>
                    <span>{layout.name}</span>
                  </button>
                ))}
              </div>

              <div className="portfolio-image-heading">
                <div>
                  <h4>Portfolio images</h4>
                  <p className="subtitle">Use the arrows to set the display order.</p>
                </div>
                <label className="portfolio-upload-button">
                  {uploading === "portfolio" ? "Uploading..." : "Add image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={Boolean(uploading || saving || deletingImageId)}
                    onChange={(event) => handleImageSelection(event, brandPortfolioApi.uploadImage, "portfolio")}
                  />
                </label>
              </div>

              {portfolio.images.length === 0 ? (
                <p className="portfolio-empty">No portfolio images yet. Add an image to get started.</p>
              ) : (
                <ol className="portfolio-image-list">
                  {portfolio.images.map((image, index) => (
                    <li className="portfolio-image-card" key={image.id}>
                      <img src={getAssetUrl(image.image_url)} alt={`${selectedBrand?.name} portfolio ${index + 1}`} />
                      <div className="portfolio-image-actions">
                        <span>Image {index + 1}</span>
                        <div>
                          <button
                            type="button"
                            aria-label={`Move image ${index + 1} up`}
                            disabled={index === 0 || Boolean(deletingImageId || saving || uploading)}
                            onClick={() => moveImage(index, -1)}
                          >↑</button>
                          <button
                            type="button"
                            aria-label={`Move image ${index + 1} down`}
                            disabled={index === portfolio.images.length - 1 || Boolean(deletingImageId || saving || uploading)}
                            onClick={() => moveImage(index, 1)}
                          >↓</button>
                          <button
                            type="button"
                            className="portfolio-delete-button"
                            disabled={Boolean(deletingImageId || saving || uploading)}
                            onClick={() => handleDeleteImage(image)}
                          >
                            {String(deletingImageId) === String(image.id) ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div className="portfolio-save-row">
                {hasUnsavedChanges && <span>Unsaved gallery changes</span>}
                <button
                  type="button"
                  className="primary-action-btn"
                  disabled={!hasUnsavedChanges || saving || loadingPortfolio || Boolean(uploading || deletingImageId)}
                  onClick={handleSave}
                >
                  {saving ? "Saving..." : "Save gallery"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ImageUploadField({
  title,
  description,
  currentUrl,
  fallbackUrl,
  busy,
  disabled,
  onChange,
}) {
  const imageUrl = getAssetUrl(currentUrl) || fallbackUrl;
  return (
    <div className="portfolio-brand-image-card">
      <div className="portfolio-brand-image-preview">
        {imageUrl
          ? <img src={imageUrl} alt={`${title} preview`} />
          : <span>No image set</span>}
      </div>
      <div className="portfolio-brand-image-copy">
        <h4>{title}</h4>
        <p>{description}</p>
        <label className="portfolio-upload-button">
          {busy ? "Uploading..." : "Change image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || disabled}
            onChange={onChange}
          />
        </label>
      </div>
    </div>
  );
}

export default PortfolioTab;
