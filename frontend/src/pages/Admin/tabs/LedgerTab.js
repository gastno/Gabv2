import React, { useEffect, useMemo, useState } from "react";
import { apptApi } from "../../../services/api";
import {
  formatPrice,
  formatStudioDate,
  formatStudioTime,
  getStudioDateKey,
} from "../../Staff/staffCalendarUtils";
import "./LedgerTab.css";

const HISTORICAL_STATUSES = new Set(["completed", "cancelled", "no_show"]);
const COLUMNS = [
  { key: "id", label: "Appointment" },
  { key: "customer_name", label: "Customer" },
  { key: "service_name", label: "Service" },
  { key: "staff_name", label: "Staff Member" },
  { key: "start_time", label: "Appointment Date / Time" },
  { key: "price_snapshot_isk", label: "Price" },
  { key: "payment_status", label: "Payment" },
  { key: "fee_status", label: "Fee" },
  { key: "status", label: "Status" },
  { key: "cancellation_reason", label: "Cancellation Reason" },
  { key: "created_at", label: "Booked On" },
  { key: "brand_name", label: "Brand" },
];

function LedgerTab({ brands, loadingBrand }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sort, setSort] = useState({ key: "start_time", direction: "desc" });
  const brandNameById = useMemo(
    () => Object.fromEntries(brands.map((brand) => [String(brand.id), brand.name])),
    [brands]
  );
  const sortedAppointments = useMemo(() => {
    const multiplier = sort.direction === "asc" ? 1 : -1;
    return [...appointments].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      if (sort.key === "id" || sort.key === "price_snapshot_isk") {
        return (Number(leftValue || 0) - Number(rightValue || 0)) * multiplier;
      }
      if (sort.key === "start_time" || sort.key === "created_at") {
        return (new Date(leftValue || 0) - new Date(rightValue || 0)) * multiplier;
      }
      return String(leftValue || "").localeCompare(String(rightValue || ""), undefined, {
        sensitivity: "base",
        numeric: true,
      }) * multiplier;
    });
  }, [appointments, sort]);

  useEffect(() => {
    if (loadingBrand) {
      setLoading(true);
      setError("");
      return undefined;
    }

    const selectedBrands = selectedBrand === "all"
      ? brands
      : brands.filter((brand) => String(brand.id) === selectedBrand);
    if (selectedBrands.length === 0) {
      setAppointments([]);
      setLoading(false);
      setError("Could not resolve the selected brand selection.");
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    Promise.all(selectedBrands.map(async (brand) => {
      const result = await apptApi.listAppointments(brand.id);
      if (!Array.isArray(result?.appointments)) {
        throw new Error(`The appointments response for ${brand.name} was not in the expected format.`);
      }
      return result.appointments.map((appointment) => ({
        ...appointment,
        brand_id: appointment.brand_id || brand.id,
        brand_name: brand.name,
      }));
    }))
      .then((brandAppointments) => {
        if (!isMounted) return;
        setAppointments(
          brandAppointments.flat().filter((appointment) =>
            HISTORICAL_STATUSES.has(String(appointment.status || "").toLowerCase())
          )
        );
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setAppointments([]);
        setError(requestError.message || "Could not load appointment history.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [brands, loadingBrand, selectedBrand]);

  const handleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <section className="admin-section">
      <div className="section-header">
        <div>
          <h3>Appointments Ledger</h3>
          <p className="subtitle">
            Historical completed, cancelled, and no-show appointments across your brands.
          </p>
        </div>
        <label className="ledger-brand-filter">
          Show appointments for
          <select
            aria-label="Filter ledger by brand"
            value={selectedBrand}
            onChange={(event) => setSelectedBrand(event.target.value)}
          >
            <option value="all">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={String(brand.id)}>{brand.name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="ledger-message" role="status">Loading appointment history...</p>
      ) : error ? (
        <p className="ledger-message ledger-error" role="alert">{error}</p>
      ) : appointments.length === 0 ? (
        <p className="ledger-message">No completed, cancelled, or no-show appointments found.</p>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="admin-ledger-table">
            <thead>
              <tr>
                {COLUMNS.map(({ key, label }) => (
                  <th
                    key={key}
                    aria-sort={sort.key === key
                      ? sort.direction === "asc" ? "ascending" : "descending"
                      : "none"}
                  >
                    <button
                      type="button"
                      className="ledger-sort-button"
                      aria-label={`Sort by ${label}`}
                      onClick={() => handleSort(key)}
                    >
                      {label}
                      <span aria-hidden="true">
                        {sort.key === key ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>#{appointment.id}</td>
                  <td>
                    <strong>{appointment.customer_name || "Customer"}</strong>
                    <span className="ledger-detail">{appointment.customer_phone || "No phone"}</span>
                    {appointment.customer_email && (
                      <span className="ledger-detail">{appointment.customer_email}</span>
                    )}
                  </td>
                  <td>
                    <strong>{appointment.service_name || "Service"}</strong>
                    <span className="ledger-detail">
                      {appointment.duration_snapshot_minutes
                        ? `${appointment.duration_snapshot_minutes} minutes`
                        : "Duration unavailable"}
                    </span>
                  </td>
                  <td>{appointment.staff_name || "Staff unavailable"}</td>
                  <td>
                    <strong>{formatStudioDate(getStudioDateKey(appointment.start_time))}</strong>
                    <span className="ledger-detail">
                      {formatStudioTime(appointment.start_time)}–{formatStudioTime(appointment.end_time)}
                    </span>
                  </td>
                  <td>{formatPrice(appointment.price_snapshot_isk)}</td>
                  <td>{appointment.payment_status?.replace(/_/g, " ") || "Unknown"}</td>
                  <td>{appointment.fee_status?.replace(/_/g, " ") || "Unknown"}</td>
                  <td>
                    <span className={`ledger-status status-${appointment.status}`}>
                      {appointment.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>{appointment.cancellation_reason || "—"}</td>
                  <td>
                    {appointment.created_at
                      ? formatStudioDate(getStudioDateKey(appointment.created_at))
                      : "Unavailable"}
                  </td>
                  <td>{appointment.brand_name || brandNameById[String(appointment.brand_id)] || "Brand unavailable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default LedgerTab;
