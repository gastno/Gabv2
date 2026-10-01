import React from "react";
import "./AdminModals.css";

function CreateServiceModal({
  newService,
  setNewService,
  brandsList,
  categories,
  createServiceImagePreview,
  setCreateServiceImagePreview,
  setCreateServiceImageFile,
  setServiceModalOpen,
  handleAddService,
}) {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCreateServiceImageFile(file);
      if (createServiceImagePreview) URL.revokeObjectURL(createServiceImagePreview);
      setCreateServiceImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={() => setServiceModalOpen(false)}
    >
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={() => setServiceModalOpen(false)}
        >
          ✕
        </button>
        <h3>Create New Service</h3>

        <form onSubmit={handleAddService} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Target Brand</label>
              <select
                value={newService.brand}
                onChange={(e) =>
                  setNewService({ ...newService, brand: e.target.value })
                }
              >
                {brandsList.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={newService.category}
                onChange={(e) =>
                  setNewService({ ...newService, category: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Service Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mega Volume Lashes"
              value={newService.name}
              onChange={(e) =>
                setNewService({ ...newService, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="3"
              placeholder="Detail what is included in the service..."
              value={newService.description}
              onChange={(e) =>
                setNewService({ ...newService, description: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                placeholder="60 min"
                value={newService.duration}
                onChange={(e) =>
                  setNewService({ ...newService, duration: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="text"
                placeholder="15,000 kr"
                value={newService.price}
                onChange={(e) =>
                  setNewService({ ...newService, price: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cover Image File</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {createServiceImagePreview && (
              <img
                src={createServiceImagePreview}
                alt="Preview"
                style={{
                  width: "100%",
                  height: 100,
                  objectFit: "cover",
                  marginTop: 8,
                  borderRadius: 6,
                }}
              />
            )}
          </div>

          <button type="submit" className="save-submit-btn">
            Create Service
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateServiceModal;