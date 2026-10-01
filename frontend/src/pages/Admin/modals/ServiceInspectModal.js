import React from "react";

function ServiceInspectModal({
  inspectService,
  setInspectService,
  brandsList,
  categories,
  isEditMode,
  setIsEditMode,
  editServiceImagePreview,
  setEditServiceImagePreview,
  setEditServiceImageFile,
  closeInspectModal,
  handleSaveServiceEdit,
}) {
  return (
    <div className="admin-modal-backdrop" onClick={closeInspectModal}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={closeInspectModal}>
          ✕
        </button>
        <h3>Service Details</h3>
        <form onSubmit={handleSaveServiceEdit} className="admin-form">
          <div className="form-group">
            <label>Service Photo</label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <img
                src={editServiceImagePreview || inspectService.image}
                alt={inspectService.name}
                style={{ width: "90px", height: "60px", borderRadius: "6px", objectFit: "cover" }}
                onError={(e) => { e.target.src = "/placeholder-service.jpg"; }}
              />
              {isEditMode && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setEditServiceImageFile(file);
                      setEditServiceImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Brand</label>
              {isEditMode ? (
                <select
                  value={inspectService.brand}
                  onChange={(e) => setInspectService({ ...inspectService, brand: e.target.value })}
                >
                  {brandsList.map((brand) => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                </select>
              ) : (
                <div className="read-only-field">{inspectService.brand}</div>
              )}
            </div>
            <div className="form-group">
              <label>Category</label>
              {isEditMode ? (
                <select
                  value={inspectService.category}
                  onChange={(e) => setInspectService({ ...inspectService, category: e.target.value })}
                >
                  {categories.map((category) => <option key={category.id} value={category.title}>{category.title}</option>)}
                </select>
              ) : (
                <div className="read-only-field">{inspectService.category}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Service Name</label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={inspectService.name}
                onChange={(e) => setInspectService({ ...inspectService, name: e.target.value })}
              />
            ) : (
              <div className="read-only-field">{inspectService.name}</div>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            {isEditMode ? (
              <textarea
                rows="3"
                value={inspectService.description}
                onChange={(e) => setInspectService({ ...inspectService, description: e.target.value })}
              />
            ) : (
              <div className="read-only-field">{inspectService.description}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estimated Time</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={inspectService.duration}
                  onChange={(e) => setInspectService({ ...inspectService, duration: e.target.value })}
                />
              ) : (
                <div className="read-only-field">{inspectService.duration}</div>
              )}
            </div>
            <div className="form-group">
              <label>Price</label>
              {isEditMode ? (
                <input
                  type="text"
                  required
                  value={inspectService.price}
                  onChange={(e) => setInspectService({ ...inspectService, price: e.target.value })}
                />
              ) : (
                <div className="read-only-field">{inspectService.price}</div>
              )}
            </div>
          </div>

          <div className="modal-actions-row">
            {!isEditMode ? (
              <button
                type="button"
                className="edit-toggle-btn"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsEditMode(true);
                }}
              >
                Edit
              </button>
            ) : (
              <button type="submit" className="save-submit-btn">
                Save Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServiceInspectModal;