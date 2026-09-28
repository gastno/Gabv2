import React from "react";

function CreateServiceModal({
  newService,
  setNewService,
  brandsList,
  categories,
  setServiceModalOpen,
  handleAddService,
}) {
  return (
    <div
      className="admin-modal-backdrop"
      onClick={() => setServiceModalOpen(false)}
    >
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={() => setServiceModalOpen(false)}
        >
          ✕
        </button>
        <h3>Create New Service</h3>
        <form onSubmit={handleAddService} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Brand</label>
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
                {categories
                  .filter((c) => c.brand === newService.brand)
                  .map((cat) => (
                    <option key={cat.id} value={cat.title}>
                      {cat.title}
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
              value={newService.name}
              onChange={(e) =>
                setNewService({ ...newService, name: e.target.value })
              }
              placeholder="e.g. Mega Volume Extensions"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="3"
              value={newService.description}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estimated Time</label>
              <input
                type="text"
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
                required
                value={newService.price}
                onChange={(e) =>
                  setNewService({ ...newService, price: e.target.value })
                }
                placeholder="e.g. 15,000 kr"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photo URL</label>
            <input
              type="text"
              value={newService.image}
              onChange={(e) =>
                setNewService({ ...newService, image: e.target.value })
              }
              placeholder="/placeholder-service.jpg"
            />
          </div>

          <button type="submit" className="save-submit-btn">
            Save Service
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateServiceModal;