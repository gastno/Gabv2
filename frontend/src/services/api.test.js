import { apptApi } from "./api";

describe("appointment reference image API", () => {
  const originalFetch = global.fetch;
  const customerToken = localStorage.getItem("customer_auth_token");
  const staffToken = localStorage.getItem("staff_auth_token");

  afterEach(() => {
    global.fetch = originalFetch;
    if (customerToken === null) localStorage.removeItem("customer_auth_token");
    else localStorage.setItem("customer_auth_token", customerToken);
    if (staffToken === null) localStorage.removeItem("staff_auth_token");
    else localStorage.setItem("staff_auth_token", staffToken);
  });

  it("sends booking fields and reference images as multipart form data", async () => {
    const image = new File(["image"], "reference.png", { type: "image/png" });
    let requestOptions;
    global.fetch = jest.fn(async (_url, options) => {
      requestOptions = options;
      return { ok: true, json: async () => ({ appointment: { id: 8 } }) };
    });
    localStorage.setItem("customer_auth_token", "customer-token");

    await apptApi.createAppointment({
      consent_privacy: true,
      custom_options: { cancellation_policy_accepted: true },
      service_id: 4,
    }, [image]);

    expect(requestOptions.body).toBeInstanceOf(FormData);
    expect(requestOptions.body.get("consent_privacy")).toBe("true");
    expect(requestOptions.body.get("custom_options")).toBe('{"cancellation_policy_accepted":true}');
    expect(requestOptions.body.get("service_id")).toBe("4");
    expect(requestOptions.body.getAll("reference_images")).toEqual([image]);
    expect(requestOptions.headers["Content-Type"]).toBeUndefined();
    expect(requestOptions.headers.Authorization).toBe("Bearer customer-token");
  });

  it("keeps bookings without images on the existing JSON request path", async () => {
    let requestOptions;
    global.fetch = jest.fn(async (_url, options) => {
      requestOptions = options;
      return { ok: true, json: async () => ({ appointment: { id: 9 } }) };
    });

    const booking = { consent_privacy: true, service_id: 4 };
    await apptApi.createAppointment(booking);

    expect(requestOptions.body).toBe(JSON.stringify(booking));
    expect(requestOptions.headers["Content-Type"]).toBe("application/json");
  });

  it("fetches private reference images only from the appointment endpoint with staff auth", async () => {
    const image = new Blob(["image"], { type: "image/jpeg" });
    let requestOptions;
    global.fetch = jest.fn(async (_url, options) => {
      requestOptions = options;
      return { ok: true, blob: async () => image };
    });
    localStorage.setItem("staff_auth_token", "staff-token");

    await expect(apptApi.getReferenceImage("/api/appointments/8/references/15")).resolves.toBe(image);
    expect(requestOptions.headers.Authorization).toBe("Bearer staff-token");
    await expect(apptApi.getReferenceImage("https://example.com/private")).rejects.toThrow(/invalid/i);
  });
});
