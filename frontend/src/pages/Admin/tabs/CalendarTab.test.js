import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CalendarTab from "./CalendarTab";
import { getStudioDateKey } from "../../Staff/staffCalendarUtils";
import { apptApi, staffAvailabilityApi } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  apptApi: { listAppointments: jest.fn() },
  staffAvailabilityApi: { getForStaff: jest.fn() },
}));

function studioTimestamp(dateKey, hour) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour)).toISOString();
}

describe("CalendarTab", () => {
  const staffList = [
    { id: 1, name: "Alex", brands: ["Gabbablu"], description: "Lashes" },
    { id: 2, name: "Sam", brands: ["Gabbablu"], description: "Nails" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const today = getStudioDateKey(new Date());
    apptApi.listAppointments.mockResolvedValue({
      appointments: [
        {
          id: 11,
          staff_id: 1,
          start_time: studioTimestamp(today, 10),
          end_time: studioTimestamp(today, 11),
          customer_name: "Alex Client",
          customer_phone: "+354 555 0100",
          customer_email: "alex@example.com",
          service_name: "Lash Service",
          price_snapshot_isk: 14000,
          fee_status: "fee_waived",
          payment_status: "accepted",
          status: "confirmed",
        },
        {
          id: 22,
          staff_id: 2,
          start_time: studioTimestamp(today, 12),
          end_time: studioTimestamp(today, 13),
          customer_name: "Sam Client",
          service_name: "Nail Service",
          status: "pending",
        },
      ],
    });
    staffAvailabilityApi.getForStaff.mockImplementation((staffId, _brandId, date) => Promise.resolve({
      availability: date === today
        ? [{ id: staffId, availability_date: date, start_time: "09:00", end_time: "17:00" }]
        : [],
      unavailabilities: date === today
        ? [{
          id: staffId,
          block_start: studioTimestamp(date, 14),
          block_end: studioTimestamp(date, 15),
          reason: "Personal time",
        }]
        : [],
    }));
  });

  it("shows staff-specific appointment and availability blocks, and filters by staff", async () => {
    render(
      <CalendarTab
        selectedBrand="Gabbablu"
        brandId={1}
        loadingBrand={false}
        staffList={staffList}
        loadingStaff={false}
      />
    );

    const firstAppointment = await screen.findByText("Alex Client · Lash Service");
    const secondAppointment = screen.getByText("Sam Client · Nail Service");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(firstAppointment.closest(".admin-calendar-event")).toHaveStyle({
      "--staff-calendar-color": "#9d4edd",
    });
    expect(secondAppointment.closest(".admin-calendar-event")).toHaveStyle({
      "--staff-calendar-color": "#2a9d8f",
    });
    const availabilityColors = Array.from(document.querySelectorAll(".event-available"))
      .map((block) => block.style.getPropertyValue("--staff-calendar-color"));
    expect(availabilityColors).toContain("#9d4edd");
    expect(availabilityColors).toContain("#2a9d8f");
    await waitFor(() => expect(staffAvailabilityApi.getForStaff).toHaveBeenCalledWith(
      1,
      1,
      getStudioDateKey(new Date())
    ));

    fireEvent.change(screen.getByRole("combobox", { name: "Filter calendar by staff" }), {
      target: { value: "2" },
    });
    expect(screen.queryByText("Alex Client · Lash Service")).not.toBeInTheDocument();
    expect(screen.getByText("Sam Client · Nail Service")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("opens detailed modals for appointment, availability, and unavailable blocks", async () => {
    render(
      <CalendarTab
        selectedBrand="Gabbablu"
        brandId={1}
        loadingBrand={false}
        staffList={staffList}
        loadingStaff={false}
      />
    );

    await screen.findByText("Alex Client · Lash Service");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /View Alex's appointment block/ }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Alex Client");
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Lash Service")).toBeInTheDocument();
    expect(screen.getByText("fee waived")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /View Alex's available block/ })[0]);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Available hours");
    expect(screen.getByText("Scheduled working hours")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close block details" }));

    fireEvent.click(screen.getByRole("button", { name: /View Alex's unavailable block/ }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Personal time");
    expect(screen.getByText("Unavailable time")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
