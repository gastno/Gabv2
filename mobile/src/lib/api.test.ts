import * as SecureStore from "expo-secure-store";
import { createAppointment, getApiBaseUrl, getServices, signInCustomer } from "./api";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockedSecureStore = jest.mocked(SecureStore);

describe("native Gabv2 API client", () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const originalNodeEnv = process.env.NODE_ENV;
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test/api";
    global.fetch = fetchMock;
    fetchMock.mockReset();
    mockedSecureStore.getItemAsync.mockReset();
    mockedSecureStore.setItemAsync.mockReset();
  });

  afterAll(() => {
    if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it("requires HTTPS for production API URLs", () => {
    process.env.NODE_ENV = "production";
    process.env.EXPO_PUBLIC_API_URL = "http://api.example.test/api";
    expect(() => getApiBaseUrl()).toThrow(/HTTPS in production/);
  });

  it("loads public catalog data from the configured absolute API URL", async () => {
    const services = [{ id: 3, brand_id: 2, brand: "Amor Tattoo", name: "Fine line" }];
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => services });

    await expect(getServices()).resolves.toEqual(services);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/services",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("stores only the Gabv2 session token after customer sign-in", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "gabv2-jwt", customer: { full_name: "Customer" } }),
    });

    await expect(signInCustomer("customer@example.test", "password")).resolves.toEqual({
      full_name: "Customer",
    });
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith("customer_auth_token", "gabv2-jwt");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/auth/customer/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends an existing customer token for authenticated bookings", async () => {
    mockedSecureStore.getItemAsync.mockResolvedValue("customer-jwt");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ appointment: { id: 14 } }),
    });

    await createAppointment({ service_id: 2, consent_privacy: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/appointments",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer customer-jwt" }),
      })
    );
  });

  it("surfaces API validation errors instead of disguising them as booking success", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "The selected time is no longer available." }),
    });

    await expect(createAppointment({ service_id: 2 })).rejects.toMatchObject({
      message: "The selected time is no longer available.",
      status: 409,
    });
  });
});
