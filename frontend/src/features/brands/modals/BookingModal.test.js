import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookingModal from "./BookingModal";
import { apptApi, staffServiceApi } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  apptApi: {
    createAppointment: jest.fn(),
    getAvailability: jest.fn(),
  },
  getAssetUrl: jest.fn(() => null),
  staffServiceApi: {
    getByServiceId: jest.fn(),
  },
}));

describe("BookingModal reference images", () => {
  const createObjectURL = URL.createObjectURL;
  const revokeObjectURL = URL.revokeObjectURL;
  const alert = window.alert;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => "blob:booking-reference");
    URL.revokeObjectURL = jest.fn();
    window.alert = jest.fn();
    staffServiceApi.getByServiceId.mockResolvedValue([
      { id: 9, full_name: "Morgan Artist", description_en: "Studio specialist" },
    ]);
    apptApi.getAvailability.mockImplementation(({ date }) => Promise.resolve({
      slots: [{ start_time: `${date}T10:00:00Z` }],
    }));
    apptApi.createAppointment.mockResolvedValue({ appointment: { id: 24 } });
  });

  afterEach(() => {
    cleanup();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    window.alert = alert;
    jest.clearAllMocks();
  });

  it("includes the selected reference image in the customer booking request", async () => {
    const image = new File(["image"], "design.png", { type: "image/png" });
    const { container } = render(
      <BookingModal
        service={{
          id: 3,
          brand_id: 2,
          name: "Custom design",
          duration: "60 min",
          price: "12,000 kr",
        }}
        brandName="Amor Tattoo"
        onClose={jest.fn()}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: /Morgan Artist/ }));
    await waitFor(() => expect(container.querySelector(".calendar-day-cell.available")).toBeInTheDocument());
    fireEvent.click(container.querySelector(".calendar-day-cell.available"));
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));

    fireEvent.change(screen.getByLabelText("Full Name *"), { target: { value: "Taylor Customer" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "+354 555 0100" } });
    fireEvent.change(screen.getByLabelText("Kennitala *"), { target: { value: "010190-1234" } });
    fireEvent.click(screen.getByLabelText(/I consent to Amor Tattoo/));
    fireEvent.click(screen.getByLabelText(/I have read and accept/));
    fireEvent.change(screen.getByLabelText("Reference images (optional)"), {
      target: { files: [new File(["document"], "document.gif", { type: "image/gif" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Reference images must be JPEG, PNG or WebP files.");

    fireEvent.change(screen.getByLabelText("Reference images (optional)"), {
      target: {
        files: Array.from({ length: 6 }, (_, index) =>
          new File(["image"], `design-${index}.png`, { type: "image/png" })
        ),
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("You can add up to 5 reference images.");

    fireEvent.change(screen.getByLabelText("Reference images (optional)"), {
      target: { files: [image] },
    });

    expect(await screen.findByAltText("Preview of design.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));

    await waitFor(() => expect(apptApi.createAppointment).toHaveBeenCalledTimes(1));
    expect(apptApi.createAppointment.mock.calls[0][1]).toEqual([image]);
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Appointment confirmed"));
  });
});
