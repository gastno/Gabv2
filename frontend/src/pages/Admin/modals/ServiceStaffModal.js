import React, { useState, useEffect } from "react";
import "./ServiceStaffModal.css";
import { staffServiceApi, getAssetUrl } from "../../../services/api";
import UserAvatar from "../../../components/UserAvatar/UserAvatar";

function ServiceStaffModal({
  selectedService,
  allStaff = [],
  closeModal,
  onSaveStaffServices,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [assignedStaffIds, setAssignedStaffIds] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [tempAssignedStaffIds, setTempAssignedStaffIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filter staff to ensure we only show workers assigned to this service's brand
  const brandStaff = allStaff.filter((s) => {
    if (!s.brands && !s.brand) return true;
    if (Array.isArray(s.brands)) return s.brands.includes(selectedService?.brand);
    return String(s.brand) === String(selectedService?.brand);
  });

  useEffect(() => {
    if (!selectedService) return;

    const fetchAssignedStaff = async () => {
      setLoading(true);
      setLoadError("");
      setAssignedStaff([]);
      setAssignedStaffIds([]);
      setTempAssignedStaffIds([]);
      try {
        // Fetch securely using the API wrapper
        const data = await staffServiceApi.getByServiceId(selectedService.id);
        if (!Array.isArray(data)) {
          throw new Error("Unexpected response while loading assigned staff.");
        }
        const fetchedStaff = data;
        const fetchedIds = fetchedStaff.map((worker) => String(worker.id));
        setAssignedStaff(fetchedStaff);
        setAssignedStaffIds(fetchedIds);
        setTempAssignedStaffIds(fetchedIds);
      } catch (err) {
        console.warn("Could not fetch service staff:", err);
        setLoadError(err.message || "Could not load assigned staff.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedStaff();
  }, [selectedService]);

  const assignedStaffById = new Map(
    assignedStaff.map((worker) => [String(worker.id), worker])
  );
  const visibleStaff = [
    ...assignedStaff.map((worker) => {
      const staffRecord = allStaff.find(
        (staff) => String(staff.id) === String(worker.id)
      );
      return {
        ...worker,
        ...staffRecord,
        id: worker.id,
        name: worker.name || worker.full_name || staffRecord?.name || worker.username,
        photo:
          staffRecord?.photo ||
          getAssetUrl(worker.avatar_url) ||
          worker.avatar_url,
      };
    }),
    ...brandStaff.filter((worker) => !assignedStaffById.has(String(worker.id))),
  ];

  const handleToggleWorker = (staffId) => {
    if (!isEditMode) return;
    const stringId = String(staffId);
    setTempAssignedStaffIds((prev) =>
      prev.includes(stringId)
        ? prev.filter((id) => id !== stringId)
        : [...prev, stringId]
    );
  };

  const handleSave = async () => {
    try {
      if (onSaveStaffServices) {
        await onSaveStaffServices(
          selectedService.id,
          tempAssignedStaffIds.map((id) => Number(id))
        );
      }
    } catch (err) {
      alert(err.message || "Failed to update service workers.");
      return;
    }
    setAssignedStaffIds(tempAssignedStaffIds);
    setIsEditMode(false);
  };

  const handleDiscard = () => {
    setTempAssignedStaffIds(assignedStaffIds);
    setIsEditMode(false);
  };

  if (!selectedService) return null;

  return (
    <div className="admin-modal-backdrop" onClick={closeModal}>
      <div
        className="admin-modal-box service-staff-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={closeModal}>
          ✕
        </button>

        <h3>Assigned Workers for {selectedService.name}</h3>
        <p className="subtitle" style={{ marginBottom: "16px", color: "#aaa" }}>
          Brand: <strong>{selectedService.brand}</strong> | Category:{" "}
          <strong>{selectedService.category}</strong>
        </p>

        {loading ? (
          <p className="loading-text">Loading assigned workers...</p>
        ) : loadError ? (
          <p className="empty-text" role="alert">{loadError}</p>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="admin-form">
            <div className="workers-cards-container">
              {brandStaff.length === 0 ? (
                <p className="empty-text">No staff accounts found for this brand.</p>
              ) : (
                <div className="staff-cards-grid">
                  {visibleStaff.map((worker) => {
                    const workerIdStr = String(worker.id);
                    const isAssigned = isEditMode
                      ? tempAssignedStaffIds.includes(workerIdStr)
                      : assignedStaffIds.includes(workerIdStr);

                    // Hide unassigned staff when in read-only mode
                    if (!isEditMode && !isAssigned) return null;

                    return (
                      <div
                        key={worker.id}
                        className={`staff-mini-card ${isAssigned ? "selected" : ""} ${
                          isEditMode ? "editable" : "read-only"
                        }`}
                        onClick={() => handleToggleWorker(worker.id)}
                      >
                        <div className="staff-card-avatar-wrapper">
                          <UserAvatar
                            src={worker.photo || worker.avatar_url}
                            alt={worker.name}
                            className="staff-card-avatar"
                          />
                          {isAssigned && <span className="card-check-badge">✓</span>}
                        </div>

                        <div className="staff-card-info">
                          <strong className="staff-card-name">
                            {worker.name}
                          </strong>
                          <span className="staff-card-title">
                            {worker.description || "Staff Member"}
                          </span>
                        </div>

                        {isEditMode && (
                          <span
                            className={`card-status-tag ${
                              isAssigned ? "active" : "inactive"
                            }`}
                          >
                            {isAssigned ? "Selected" : "+ Add"}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {!isEditMode && assignedStaffIds.length === 0 && (
                    <p className="empty-text">
                      No staff members are currently assigned to this service.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions-row" style={{ marginTop: "24px" }}>
              {!isEditMode ? (
                <button
                  key="edit"
                  type="button"
                  className="edit-toggle-btn"
                  onClick={() => setIsEditMode(true)}
                >
                  Edit Worker List
                </button>
              ) : (
                <>
                  {/* Plain button: a submit button here would be activated by the same click that enters edit mode */}
                  <button
                    key="save"
                    type="button"
                    className="save-submit-btn"
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                  <button
                    key="discard"
                    type="button"
                    className="discard-cancel-btn"
                    onClick={handleDiscard}
                  >
                    Discard Changes
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ServiceStaffModal;