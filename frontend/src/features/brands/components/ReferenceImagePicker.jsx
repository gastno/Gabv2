import { useEffect, useState } from "react";
import { useLanguage } from "../../../components/i18n/LanguageContext";

function ReferenceImagePicker({ files, error, disabled = false, onFilesSelected, onRemove }) {
  const { t } = useLanguage();
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  return (
    <div className="form-group reference-image-picker">
      <label htmlFor="booking-reference-images">{t("booking.referenceImages")}</label>
      <p className="reference-image-help">{t("booking.referenceImagesHelp")}</p>
      <input
        id="booking-reference-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        onChange={(event) => {
          onFilesSelected(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      {error && <p className="booking-submit-error" role="alert">{error}</p>}
      {files.length > 0 && (
        <ul className="reference-image-preview-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`}>
              {previewUrls[index] && (
                <img
                  src={previewUrls[index]}
                  alt={t("booking.referencePreview", { name: file.name })}
                />
              )}
              <span>{file.name}</span>
              <button
                type="button"
                aria-label={t("booking.removeReferenceImage", { name: file.name })}
                disabled={disabled}
                onClick={() => onRemove(index)}
              >
                {t("booking.removeReference")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ReferenceImagePicker;
