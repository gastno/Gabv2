import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import StaffNotifications from "./StaffNotifications";
import { staffNotificationApi } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  staffNotificationApi: {
    list: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

describe("StaffNotifications", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows staff bookings in the bell inbox and marks a selected booking read", async () => {
    staffNotificationApi.list.mockResolvedValue({
      unread_count: 1,
      notifications: [{
        id: 8,
        appointment_id: 32,
        service_name: "Lash lift",
        brand_name: "Gabbablu",
        start_time: "2026-11-03T10:00:00Z",
        is_read: false,
      }],
    });
    staffNotificationApi.markRead.mockResolvedValue({ unread_count: 0 });

    const { unmount } = render(<StaffNotifications />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));

    const panel = screen.getByRole("region", { name: "Notifications" });
    const booking = within(panel).getByRole("button", { name: /New booking · Lash lift/ });
    expect(within(booking).getByText("Gabbablu")).toBeInTheDocument();
    fireEvent.click(booking);

    await waitFor(() => expect(staffNotificationApi.markRead).toHaveBeenCalledWith([8]));
    await waitFor(() => expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument());
    unmount();
  });

  it("surfaces API errors and provides a retry action", async () => {
    staffNotificationApi.list
      .mockRejectedValueOnce(new Error("Notifications are unavailable."))
      .mockResolvedValueOnce({ unread_count: 0, notifications: [] });

    render(<StaffNotifications />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Notifications are unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText("No service bookings yet.")).toBeInTheDocument());
    expect(staffNotificationApi.list).toHaveBeenCalledTimes(2);
  });
});
