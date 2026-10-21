import { authApi } from "./api";

describe("customer Clerk API contract", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("sends the Clerk token to the session exchange endpoint without storing it", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "profile_required", profile: { email: "new@example.com" } }),
    });

    await authApi.customerClerkSession("clerk-session-token");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/customer/clerk/session",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer clerk-session-token" }),
      })
    );
    expect(localStorage.getItem("customer_auth_token")).toBeNull();
  });

  it("sends only the specified profile fields with the Clerk bearer token", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "authenticated", token: "app-jwt" }),
    });

    await authApi.customerClerkCompleteProfile("clerk-session-token", {
      full_name: "Taylor Customer",
      phone_number: "+354 555 0100",
      kennitala: "010190-1234",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/customer/clerk/complete-profile",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer clerk-session-token" }),
        body: JSON.stringify({
          full_name: "Taylor Customer",
          phone_number: "+354 555 0100",
          kennitala: "010190-1234",
        }),
      })
    );
    expect(localStorage.getItem("customer_auth_token")).toBeNull();
  });

  it("preserves HTTP status codes for backend conflict handling", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Account conflict." }),
    });

    await expect(authApi.customerClerkSession("clerk-session-token")).rejects.toMatchObject({
      message: "Account conflict.",
      status: 409,
    });
  });
});
