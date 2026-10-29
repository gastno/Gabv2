import { apptApi, notificationApi, staffNotificationApi } from "./api";

describe("customer appointment and notification APIs", () => {
  const originalFetch = global.fetch;
  const previousToken = localStorage.getItem("customer_auth_token");
  const previousStaffToken = localStorage.getItem("staff_auth_token");

  beforeEach(() => {
    localStorage.setItem("customer_auth_token", "customer-session");
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (previousToken === null) localStorage.removeItem("customer_auth_token");
    else localStorage.setItem("customer_auth_token", previousToken);
    if (previousStaffToken === null) localStorage.removeItem("staff_auth_token");
    else localStorage.setItem("staff_auth_token", previousStaffToken);
  });

  it("uses the registered customer token for appointment history", async () => {
    await apptApi.listCustomerAppointments({ period: "previous" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/appointments?period=previous",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer customer-session" }),
      })
    );
  });

  it("reads and writes preferences and notification history with customer authorization", async () => {
    await notificationApi.getPreferences();
    await notificationApi.updatePreferences({ email_enabled: true });
    await notificationApi.list();

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/notifications/preferences",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer customer-session" }) })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/notifications/preferences",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ email_enabled: true }),
        headers: expect.objectContaining({ Authorization: "Bearer customer-session" }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5000/api/notifications",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer customer-session" }) })
    );
  });

  it("marks individual and all notifications read using the customer-scoped endpoint", async () => {
    await notificationApi.markRead([12]);
    await notificationApi.markAllRead();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/customers/notifications/read",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ notification_ids: [12] }),
        headers: expect.objectContaining({
          Authorization: expect.any(String),
          "Content-Type": "application/json",
        }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/customers/notifications/read",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ all: true }),
        headers: expect.objectContaining({
          Authorization: expect.any(String),
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("uses the staff token and staff-scoped endpoints for the staff inbox", async () => {
    localStorage.setItem("staff_auth_token", "staff-session");
    await staffNotificationApi.list();
    await staffNotificationApi.markRead([17]);
    await staffNotificationApi.markAllRead();

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/staff/notifications",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/staff/notifications/read",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ notification_ids: [17] }),
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5000/api/staff/notifications/read",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ all: true }),
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
      })
    );
  });
});
