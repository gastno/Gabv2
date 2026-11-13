describe("same-origin API configuration", () => {
  const previousApiUrl = process.env.REACT_APP_API_URL;
  const previousFetch = global.fetch;

  afterEach(() => {
    if (previousApiUrl === undefined) delete process.env.REACT_APP_API_URL;
    else process.env.REACT_APP_API_URL = previousApiUrl;
    global.fetch = previousFetch;
    jest.resetModules();
  });

  it("uses the proxy for API requests and uploaded assets", async () => {
    process.env.REACT_APP_API_URL = "/api";
    jest.resetModules();
    const { apptApi, getAssetUrl } = require("./api");
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }));

    await apptApi.createAppointment({ service_id: 4 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/appointments",
      expect.objectContaining({ method: "POST" })
    );
    expect(getAssetUrl("/uploads/avatars/example.webp")).toBe("/uploads/avatars/example.webp");
  });
});
