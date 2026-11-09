import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import StaffPortal from "./StaffPortal";
import { apptApi, staffAvailabilityApi } from "../../services/api";
import { getStudioDateKey } from "../../utils/staffCalendarUtils";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("./components/StaffNotifications", () => () => null);
jest.mock("../../services/api", () => ({
  apptApi: { listAppointments: jest.fn(), getReferenceImage: jest.fn() },
  staffAvailabilityApi: { getForDate: jest.fn(), replaceForDate: jest.fn() },
  staffServiceApi: { getByStaffId: jest.fn(), getByServiceId: jest.fn() },
  getAssetUrl: (value) => value,
}));

const today = getStudioDateKey(new Date());
const shifts = [
  { id: 1, start_time: "09:00:00", end_time: "10:00:00", location: "Other studio", is_active: true },
  { id: 2, start_time: "11:00:00", end_time: "12:00:00", location: "Third studio", is_active: true },
];

beforeEach(() => {
  jest.clearAllMocks();
  apptApi.listAppointments.mockResolvedValue({ appointments: [] });
  staffAvailabilityApi.getForDate.mockImplementation((date) => Promise.resolve({
    availability: date === today ? shifts.map((shift) => ({ ...shift, availability_date: date })) : [],
    unavailabilities: [],
  }));
  staffAvailabilityApi.replaceForDate.mockImplementation((date, saved) => Promise.resolve({
    availability: saved.map((shift, index) => ({ ...shift, id: index + 1, availability_date: date })),
    unavailabilities: [],
  }));
});

test("availability editor loads and saves each shift's alternate address", async () => {
  render(<StaffPortal />);
  fireEvent.click(await screen.findByRole("tab", { name: "Availability" }));
  const locations = await screen.findAllByLabelText("Alternate location (optional)");
  expect(locations[0]).toHaveValue("Other studio");
  expect(locations[1]).toHaveValue("Third studio");
  fireEvent.change(locations[0], { target: { value: " Updated address " } });
  fireEvent.click(screen.getByRole("button", { name: "Save hours" }));
  await waitFor(() => expect(staffAvailabilityApi.replaceForDate).toHaveBeenCalledWith(today, [
    { start_time: "09:00", end_time: "10:00", is_active: true, location: "Updated address" },
    { start_time: "11:00", end_time: "12:00", is_active: true, location: "Third studio" },
  ]));
});

test("calendar shift edits preserve other addresses", async () => {
  render(<StaffPortal />);
  fireEvent.click(await screen.findByRole("tab", { name: "Day" }));
  fireEvent.click(await screen.findByRole("button", { name: /09:00–10:00.*Available/ }));
  expect(screen.getByLabelText("Alternate location (optional)")).toHaveValue("Other studio");
  fireEvent.change(screen.getByLabelText("Alternate location (optional)"), { target: { value: "Updated address" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(staffAvailabilityApi.replaceForDate).toHaveBeenCalledWith(today, [
    { start_time: "11:00", end_time: "12:00", is_active: true, location: "Third studio" },
    { start_time: "09:00", end_time: "10:00", is_active: true, location: "Updated address" },
  ]));
});

test("calendar can add a normal-location shift without changing existing addresses", async () => {
  render(<StaffPortal />);
  fireEvent.click(await screen.findByRole("tab", { name: "Day" }));
  await screen.findByRole("button", { name: /09:00–10:00.*Available/ });
  fireEvent.click(screen.getByRole("button", { name: /Add hours for this date/ }));
  fireEvent.change(screen.getByLabelText("From"), { target: { value: "13:00" } });
  fireEvent.change(screen.getByLabelText("To"), { target: { value: "14:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Save available time" }));
  await waitFor(() => expect(staffAvailabilityApi.replaceForDate).toHaveBeenCalledWith(today, [
    { start_time: "09:00", end_time: "10:00", is_active: true, location: "Other studio" },
    { start_time: "11:00", end_time: "12:00", is_active: true, location: "Third studio" },
    { start_time: "13:00", end_time: "14:00", is_active: true, location: null },
  ]));
});

test("schedule conflict remains visible without discarding the edited address", async () => {
  staffAvailabilityApi.replaceForDate.mockRejectedValueOnce(new Error("Availability changes would change an existing appointment location."));
  render(<StaffPortal />);
  fireEvent.click(await screen.findByRole("tab", { name: "Availability" }));
  const locations = await screen.findAllByLabelText("Alternate location (optional)");
  fireEvent.change(locations[0], { target: { value: "Updated address" } });
  fireEvent.click(screen.getByRole("button", { name: "Save hours" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("change an existing appointment location");
  expect(locations[0]).toHaveValue("Updated address");
});

test("deleting a calendar shift retains the remaining shift's address", async () => {
  render(<StaffPortal />);
  fireEvent.click(await screen.findByRole("tab", { name: "Day" }));
  fireEvent.click(await screen.findByRole("button", { name: /09:00–10:00.*Available/ }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(staffAvailabilityApi.replaceForDate).toHaveBeenCalledWith(today, [
    { start_time: "11:00", end_time: "12:00", is_active: true, location: "Third studio" },
  ]));
});

test("calendar appointment detail shows its saved location", async () => {
  apptApi.listAppointments.mockResolvedValue({ appointments: [{
    id: 7, customer_name: "Customer", service_name: "Service", status: "confirmed",
    start_time: `${today}T10:00:00Z`, end_time: `${today}T11:00:00Z`,
    location: "Other studio", is_alternate_location: true,
  }] });
  render(<StaffPortal />);
  fireEvent.click(await screen.findByRole("button", { name: /Customer · Service/ }));
  const details = screen.getByText("Location").closest("div");
  expect(within(details).getByText("Other studio")).toBeInTheDocument();
  expect(screen.getByText("Different from the usual studio")).toBeInTheDocument();
});
