import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { apptApi } from "../../../services/api";
import LedgerTab from "./LedgerTab";

jest.mock("../../../services/api", () => ({
  apptApi: { listAppointments: jest.fn() },
}));

describe("LedgerTab", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads real brand appointments and lists only historical statuses with details", async () => {
    apptApi.listAppointments.mockResolvedValue({
      appointments: [
        {
          id: 3,
          status: "no_show",
          start_time: "2026-01-17T10:00:00.000Z",
          end_time: "2026-01-17T11:00:00.000Z",
          created_at: "2026-01-01T10:00:00.000Z",
          customer_name: "No-show Client",
          customer_phone: "+354 555 0103",
          service_name: "Nail Service",
          staff_name: "Sam",
          duration_snapshot_minutes: 60,
          price_snapshot_isk: "12000.00",
          payment_status: "pending",
          fee_status: "none",
        },
        {
          id: 1,
          status: "completed",
          start_time: "2026-01-15T10:00:00.000Z",
          end_time: "2026-01-15T11:00:00.000Z",
          created_at: "2026-01-01T10:00:00.000Z",
          customer_name: "Completed Client",
          customer_phone: "+354 555 0101",
          customer_email: "completed@example.com",
          service_name: "Lash Service",
          staff_name: "Alex",
          duration_snapshot_minutes: 60,
          price_snapshot_isk: "14000.00",
          payment_status: "accepted",
          fee_status: "fee_waived",
        },
        {
          id: 2,
          status: "cancelled",
          start_time: "2026-01-16T10:00:00.000Z",
          end_time: "2026-01-16T11:00:00.000Z",
          customer_name: "Cancelled Client",
          customer_phone: "+354 555 0102",
          service_name: "Brow Service",
          staff_name: "Alex",
          cancellation_reason: "Customer request",
          price_snapshot_isk: "8000.00",
        },
        {
          id: 4,
          status: "confirmed",
          start_time: "2026-01-18T10:00:00.000Z",
          customer_name: "Upcoming Client",
        },
      ],
    });

    render(<LedgerTab brands={[{ id: 8, name: "Gabbablu" }]} loadingBrand={false} />);

    expect(await screen.findByText("Completed Client")).toBeInTheDocument();
    expect(apptApi.listAppointments).toHaveBeenCalledWith(8);
    expect(screen.getByText("Cancelled Client")).toBeInTheDocument();
    expect(screen.getByText("No-show Client")).toBeInTheDocument();
    expect(screen.queryByText("Upcoming Client")).not.toBeInTheDocument();
    expect(screen.getByText("completed@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("60 minutes")).toHaveLength(2);
    expect(screen.getByText("fee waived")).toBeInTheDocument();
    expect(screen.getByText("Customer request")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter ledger by brand" })).toHaveValue("all");
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("#3");

    const dateSortButton = screen.getByRole("button", { name: "Sort by Appointment Date / Time" });
    fireEvent.click(dateSortButton);
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("#1");
    fireEvent.click(dateSortButton);
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("#3");
  });

  it("loads all brands and lets the user filter to one brand", async () => {
    apptApi.listAppointments.mockImplementation((brandId) => Promise.resolve({
      appointments: [{
        id: brandId,
        brand_id: brandId,
        status: "completed",
        start_time: "2026-01-15T10:00:00.000Z",
        end_time: "2026-01-15T11:00:00.000Z",
        customer_name: brandId === 8 ? "Gabbablu Client" : "Amor Tattoo Client",
      }],
    }));

    render(<LedgerTab
      brands={[{ id: 8, name: "Gabbablu" }, { id: 9, name: "Amor Tattoo" }]}
      loadingBrand={false}
    />);

    expect(await screen.findByText("Gabbablu Client")).toBeInTheDocument();
    expect(screen.getByText("Amor Tattoo Client")).toBeInTheDocument();
    expect(screen.getByText("Gabbablu", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("Amor Tattoo", { selector: "td" })).toBeInTheDocument();
    expect(apptApi.listAppointments).toHaveBeenCalledWith(8);
    expect(apptApi.listAppointments).toHaveBeenCalledWith(9);

    fireEvent.change(screen.getByRole("combobox", { name: "Filter ledger by brand" }), {
      target: { value: "9" },
    });
    expect(await screen.findByText("Amor Tattoo Client")).toBeInTheDocument();
    expect(screen.queryByText("Gabbablu Client")).not.toBeInTheDocument();
    expect(screen.getByText("Amor Tattoo", { selector: "td" })).toBeInTheDocument();
    expect(apptApi.listAppointments).toHaveBeenLastCalledWith(9);
  });

  it("reports API errors instead of showing an empty ledger", async () => {
    apptApi.listAppointments.mockRejectedValue(new Error("Could not load appointments."));

    render(<LedgerTab brands={[{ id: 8, name: "Gabbablu" }]} loadingBrand={false} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load appointments.");
    expect(screen.queryByText(/No completed, cancelled/)).not.toBeInTheDocument();
  });
});
