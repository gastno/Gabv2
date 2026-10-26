import * as SecureStore from "expo-secure-store";

const CUSTOMER_TOKEN_KEY = "customer_auth_token";
const API_URL_ERROR =
  "Set EXPO_PUBLIC_API_URL to the deployed Gabv2 API URL ending in /api.";

export type Brand = {
  id: number | string;
  name: string;
  slug: string;
  description_en?: string | null;
};

export type Service = {
  id: number | string;
  brand_id: number | string;
  brand: string;
  category?: string;
  name_en?: string | null;
  name_is?: string | null;
  name: string;
  description_en?: string | null;
  duration_minutes: number;
  price_isk: number | string;
  sale_price_isk?: number | string | null;
  image_url?: string | null;
};

export type AvailabilitySlot = {
  staff_id: number | string;
  staff_name: string;
  brand_id: number | string;
  start_time: string;
  end_time: string;
};

export type Appointment = {
  id: number | string;
  service_name: string;
  brand_name: string;
  staff_name: string;
  start_time: string;
  end_time: string;
  status: string;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  authenticated?: boolean;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!configuredUrl) throw new ApiError(API_URL_ERROR);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new ApiError(API_URL_ERROR);
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.pathname.endsWith("/api")) {
    throw new ApiError(API_URL_ERROR);
  }
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new ApiError(API_URL_ERROR);
  }
  if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
    throw new ApiError("The Gabv2 API URL must use HTTPS in production.");
  }
  return configuredUrl;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body) headers["Content-Type"] = "application/json";

  if (options.authenticated) {
    const token = await SecureStore.getItemAsync(CUSTOMER_TOKEN_KEY);
    if (!token) throw new ApiError("Sign in to your customer account to continue.", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Could not connect to the Gabv2 API."
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("The Gabv2 API returned an invalid response.", response.status);
  }

  if (!response.ok) {
    const body = data as { error?: unknown; message?: unknown };
    const message = typeof body.error === "string"
      ? body.error
      : typeof body.message === "string"
        ? body.message
        : "The request could not be completed.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function getBrands(): Promise<Brand[]> {
  const brands = await request<unknown>("/brands");
  if (!Array.isArray(brands)) throw new ApiError("The Gabv2 API returned an invalid brand list.");
  return brands as Brand[];
}

export async function getServices(): Promise<Service[]> {
  const services = await request<unknown>("/services");
  if (!Array.isArray(services)) throw new ApiError("The Gabv2 API returned an invalid service list.");
  return services as Service[];
}

export async function getAvailability(serviceId: string, date: string) {
  return request<{ time_zone: string; slots: AvailabilitySlot[] }>(
    `/appointments/availability?${new URLSearchParams({ service_id: serviceId, date })}`
  );
}

export async function createAppointment(booking: Record<string, unknown>) {
  return request<{ appointment: Appointment }>("/appointments", {
    method: "POST",
    body: booking,
    authenticated: Boolean(await SecureStore.getItemAsync(CUSTOMER_TOKEN_KEY)),
  });
}

export async function signInCustomer(email: string, password: string) {
  const result = await request<{ token: string; customer: { full_name: string; email: string } }>(
    "/auth/customer/login",
    { method: "POST", body: { email, password } }
  );
  if (!result.token) throw new ApiError("The sign-in response did not include a customer session.");
  await SecureStore.setItemAsync(CUSTOMER_TOKEN_KEY, result.token);
  return result.customer;
}

export async function registerCustomer(details: {
  full_name: string;
  phone_number: string;
  kennitala: string;
  email: string;
  password: string;
}) {
  const result = await request<{ token: string; customer: { full_name: string; email: string } }>(
    "/auth/customer/register",
    { method: "POST", body: details }
  );
  if (!result.token) throw new ApiError("The registration response did not include a customer session.");
  await SecureStore.setItemAsync(CUSTOMER_TOKEN_KEY, result.token);
  return result.customer;
}

export async function getCustomerAppointments(): Promise<Appointment[]> {
  const result = await request<{ appointments: Appointment[] }>("/appointments?period=upcoming", {
    authenticated: true,
  });
  if (!Array.isArray(result.appointments)) {
    throw new ApiError("The Gabv2 API returned an invalid appointment list.");
  }
  return result.appointments;
}

export async function hasCustomerSession(): Promise<boolean> {
  return Boolean(await SecureStore.getItemAsync(CUSTOMER_TOKEN_KEY));
}

export async function signOutCustomer() {
  await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
}

export function getAssetUrl(assetPath: string | null | undefined): string | null {
  if (!assetPath) return null;
  if (/^(https?:|data:)/i.test(assetPath)) return assetPath;
  return `${getApiBaseUrl().replace(/\/api$/, "")}${assetPath.startsWith("/") ? "" : "/"}${assetPath}`;
}

export function getStudioDateKey(date: Date, offset = 0): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Reykjavik",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offset))
    .toISOString()
    .slice(0, 10);
}

export function formatStudioSlot(isoTime: string, timeZone = "Europe/Reykjavik"): string {
  return new Intl.DateTimeFormat("en-IS", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTime));
}
