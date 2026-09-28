const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "An error occurred with the request.");
  }

  return data;
}

export const authApi = {
  staffLogin: (username, password) =>
    request("/auth/staff/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  customerLogin: (email, password) =>
    request("/auth/customer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  customerRegister: (userData) =>
    request("/auth/customer/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getMe: () => request("/auth/me", { method: "GET" }),
};

export const apptApi = {
  createAppointment: (bookingData) =>
    request("/appointments", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),

  getStaffSchedule: () => request("/appointments/staff-schedule", { method: "GET" }),
};

export const staffApi = {
  getAll: () => request("/staff", { method: "GET" }),

  create: (staffData) =>
    request("/staff", {
      method: "POST",
      body: JSON.stringify(staffData),
    }),

  update: (id, staffData) =>
    request(`/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(staffData),
    }),

  uploadAvatar: async (staffId, file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("auth_token");
    
    const response = await fetch(`${API_BASE_URL}/staff/${staffId}/avatar`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload avatar photo");
    }

    return data;
  },
};

export const brandApi = {
  getAll: () => request("/brands"),

  update: (id, data) =>
    request(`/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};