const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "An error occurred with the request.");
  }

  return data;
}

// Authentication API Endpoints
export const authApi = {
  // Staff Login
  staffLogin: (username, password) =>
    request("/auth/staff/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  // Customer Login
  customerLogin: (email, password) =>
    request("/auth/customer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Customer Registration
  customerRegister: (userData) =>
    request("/auth/customer/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // Get current logged-in user details
  getMe: () => request("/auth/me", { method: "GET" }),
};

// Appointments API Endpoints
export const apptApi = {
  // Create Appointment (Guest or Registered)
  createAppointment: (bookingData) =>
    request("/appointments", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),

  // Fetch protected staff schedule
  getStaffSchedule: () => request("/appointments/staff-schedule", { method: "GET" }),
};

export const staffApi = {
  // Fetch all staff accounts
  getAll: () => request("/staff"),

  // Create a new staff account
  create: (data) =>
    request("/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update existing staff account
  update: (id, data) =>
    request(`/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const brandApi = {
  // Fetch all brands
  getAll: () => request("/brands"),

  // Update a brand (name, location, about_description)
  update: (id, data) =>
    request(`/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};