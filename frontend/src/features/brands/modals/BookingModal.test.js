import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookingModal from "./BookingModal";
import { apptApi, staffServiceApi } from "../../../services/api";
import { LanguageProvider } from "../../../components/i18n/LanguageContext";

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
      slots: [{ start_time: `${date}T10:00:00Z`, location: "Main studio", is_alternate_location: false }],
    }));
    apptApi.createAppointment.mockResolvedValue({ appointment: { id: 24 } });
  });

  afterEach(() => {
    cleanup();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    window.alert = alert;
    jest.clearAllMocks();
    localStorage.removeItem("site_language");
  });

  it("renders the booking overlay outside animated page content", async () => {
    render(
      <BookingModal
        service={{ id: 3, name: "Custom design" }}
        brandName="Amor Tattoo"
        onClose={jest.fn()}
      />
    );

    const portal = await screen.findByRole("dialog");
    expect(portal.closest(".booking-modal-portal").parentElement).toBe(document.body);
  });

  it("paginates specialists without making any unavailable", async () => {
    staffServiceApi.getByServiceId.mockResolvedValue(
      Array.from({ length: 5 }, (_, index) => ({ id: index + 1, full_name: `Specialist ${index + 1}` }))
    );
    render(<BookingModal service={{ id: 3, name: "Custom design" }} brandName="Amor Tattoo" onClose={jest.fn()} />);
    expect(await screen.findByRole("button", { name: /Specialist 1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Specialist 4/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: /Specialist 4/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: /Specialist 1/ })).toBeInTheDocument();
  });

  it("includes the selected reference image in the customer booking request", async () => {
    const image = new File(["image"], "design.png", { type: "image/png" });
    render(
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
    const availableDay = await waitFor(() => {
      const day = document.querySelector(".calendar-day-cell.available");
      expect(day).toBeInTheDocument();
      return day;
    });
    fireEvent.click(availableDay);
    expect(screen.queryByRole("button", { name: "Previous month" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change date" }));
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    fireEvent.click(document.querySelector(".calendar-day-cell.available"));
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));

    fireEvent.change(screen.getByLabelText("Full Name *"), { target: { value: "Taylor Customer" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "+354 555 0100" } });
    fireEvent.change(screen.getByLabelText("Kennitala *"), { target: { value: "010190-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Full Name *")).toHaveValue("Taylor Customer");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByLabelText(/I consent to Amor Tattoo/));
    fireEvent.click(screen.getByLabelText(/I have read and accept/));
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));

    await waitFor(() => expect(apptApi.createAppointment).toHaveBeenCalledTimes(1));
    expect(apptApi.createAppointment.mock.calls[0][1]).toEqual([image]);
    expect(apptApi.createAppointment.mock.calls[0][0].expected_location).toBe("Main studio");
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Appointment confirmed"));
  });

  it("warns about the alternate address and includes the displayed location in the booking", async () => {
    apptApi.getAvailability.mockImplementation(({ date }) => Promise.resolve({
      slots: [{ start_time: `${date}T10:00:00Z`, location: "Other studio, 12 Street", is_alternate_location: true }],
    }));
    render(<BookingModal service={{ id: 3, brand_id: 2, name: "Custom design", duration: "60 min", price: "12,000 kr" }} brandName="Amor Tattoo" onClose={jest.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /Morgan Artist/ }));
    const availableDay = await waitFor(() => {
      const day = document.querySelector(".calendar-day-cell.available");
      expect(day).toBeInTheDocument();
      return day;
    });

    fireEvent.click(availableDay);
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));
    expect(screen.getByText("Other studio, 12 Street")).toBeInTheDocument();
    expect(screen.getByText(/different location than the usual studio/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Other studio, 12 Street")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    fireEvent.change(screen.getByLabelText("Full Name *"), { target: { value: "Taylor Customer" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "5550100" } });
    fireEvent.change(screen.getByLabelText("Kennitala *"), { target: { value: "010190-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Other studio, 12 Street")).toBeInTheDocument();
    expect(screen.getByText(/different location than the usual studio/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByLabelText(/I consent to Amor Tattoo/));
    fireEvent.click(screen.getByLabelText(/I have read and accept/));
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));
    await waitFor(() => expect(apptApi.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ expected_location: "Other studio, 12 Street" })
    ));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Other studio, 12 Street"));
  });

  it("does not allow booking a slot with no location", async () => {
    apptApi.getAvailability.mockImplementation(({ date }) => Promise.resolve({
      slots: [{ start_time: `${date}T10:00:00Z` }],
    }));
    render(<BookingModal service={{ id: 3, name: "Custom design" }} brandName="Amor Tattoo" onClose={jest.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /Morgan Artist/ }));
    const availableDay = await waitFor(() => {
      const day = document.querySelector(".calendar-day-cell.available");
      expect(day).toBeInTheDocument();
      return day;
    });
    fireEvent.click(availableDay);
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));
    expect(screen.getByText("Location unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("shows the alternate-location warning in Icelandic", async () => {
    localStorage.setItem("site_language", "is");
    apptApi.getAvailability.mockImplementation(({ date }) => Promise.resolve({
      slots: [{ start_time: `${date}T10:00:00Z`, location: "Önnur stofa", is_alternate_location: true }],
    }));
    render(<LanguageProvider><BookingModal service={{ id: 3, name: "Custom design" }} brandName="Amor Tattoo" onClose={jest.fn()} /></LanguageProvider>);
    fireEvent.click(await screen.findByRole("button", { name: /Morgan Artist/ }));
    const availableDay = await waitFor(() => {
      const day = document.querySelector(".calendar-day-cell.available");
      expect(day).toBeInTheDocument();
      return day;
    });
    fireEvent.click(availableDay);
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));
    expect(screen.getByText("Önnur stofa")).toBeInTheDocument();
    expect(screen.getByText(/þessi tími er á öðrum stað/i)).toBeInTheDocument();
  });

  it("refreshes availability after a conflict and requires a new location review", async () => {
    let address = "Old address";
    apptApi.getAvailability.mockImplementation(({ date }) => Promise.resolve({
      slots: [{ start_time: `${date}T10:00:00Z`, location: address, is_alternate_location: true }],
    }));
    const conflict = new Error("The location changed.");
    conflict.status = 409;
    apptApi.createAppointment.mockRejectedValueOnce(conflict);
    jest.spyOn(console, "error").mockImplementation(() => {});
    render(<BookingModal service={{ id: 3, brand_id: 2, name: "Custom design", duration: "60 min", price: "12,000 kr" }} brandName="Amor Tattoo" onClose={jest.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /Morgan Artist/ }));
    const availableDay = await waitFor(() => {
      const day = document.querySelector(".calendar-day-cell.available");
      expect(day).toBeInTheDocument();
      return day;
    });
    fireEvent.click(availableDay);
    fireEvent.click(screen.getByRole("button", { name: "10:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    fireEvent.change(screen.getByLabelText("Full Name *"), { target: { value: "Taylor Customer" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "5550100" } });
    fireEvent.change(screen.getByLabelText("Kennitala *"), { target: { value: "010190-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByLabelText(/I consent to Amor Tattoo/));
    fireEvent.click(screen.getByLabelText(/I have read and accept/));
    address = "New address";
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please select a time and review the location again");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    const refreshedTime = await screen.findByRole("button", { name: "10:00" });
    fireEvent.click(refreshedTime);
    expect(screen.getByText("New address")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    expect(screen.getByLabelText("Full Name *")).toHaveValue("Taylor Customer");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Book Appointment" }));
    await waitFor(() => expect(apptApi.createAppointment).toHaveBeenLastCalledWith(
      expect.objectContaining({ expected_location: "New address" })
    ));
    console.error.mockRestore();
  });
});
