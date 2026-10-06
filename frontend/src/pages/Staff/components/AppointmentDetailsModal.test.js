import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

describe("AppointmentDetailsModal payment status", () => {
  const appointment = {
    id: 1,
    clientName: "Taylor Customer",
    dateKey: "2026-10-06",
    displayTime: "10:00",
    displayEndTime: "11:00",
    service: "Haircut",
    phone: "+354 555 0100",
    email: "taylor@example.com",
    price: "10,000 kr",
    status: "pending",
    fee_status: "none",
    payment_status: "pending",
  };

  it("shows payment status and allows staff to choose accepted or pending", () => {
    const setPaymentStatusDraft = jest.fn();
    render(
      <AppointmentDetailsModal
        appointment={appointment}
        onClose={jest.fn()}
        onSaveStatus={jest.fn()}
        statusEditMode
        setStatusEditMode={jest.fn()}
        statusDraft="pending"
        setStatusDraft={jest.fn()}
        feeStatusDraft="none"
        setFeeStatusDraft={jest.fn()}
        paymentStatusDraft="pending"
        setPaymentStatusDraft={setPaymentStatusDraft}
        cancellationReason=""
        setCancellationReason={jest.fn()}
        error=""
        saving={false}
        formatDate={() => "Tuesday, October 6"}
      />
    );

    const paymentStatusRow = screen.getByText("💵 Payment status", {
      selector: ".appointment-detail-list span",
    }).closest("div");
    expect(within(paymentStatusRow).getByText("Pending")).toBeInTheDocument();
    const paymentStatus = screen.getByRole("combobox", { name: "💵 Payment status" });
    expect(paymentStatus).toHaveValue("pending");
    expect(within(paymentStatus).getByRole("option", { name: "Accepted" })).toBeInTheDocument();
    expect(within(paymentStatus).getByRole("option", { name: "Pending" })).toBeInTheDocument();

    fireEvent.change(paymentStatus, { target: { value: "accepted" } });
    expect(setPaymentStatusDraft).toHaveBeenCalledWith("accepted");
  });
});
