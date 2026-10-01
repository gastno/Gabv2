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

export const categoryApi = {
  getAll: () => request("/categories"),

  create: (data) =>
    request("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const serviceApi = {
  getAll: () => request("/services"),

  create: (data) =>
    request("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadImage: async (serviceId, file) => {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("auth_token");

    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/image`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to upload service image");
    }

    return await response.json();
  },
};

export const staffServiceApi = {
  // GET /api/staffservices/by-staff/:staffId - Get services assigned to a specific staff member
  getByStaffId: (staffId) => request(`/staffservices/by-staff/${staffId}`),

  // GET /api/staffservices/by-service/:serviceId - Get workers assigned to a service
  getByServiceId: (serviceId) => request(`/staffservices/by-service/${serviceId}`),
  
  // PUT /api/staffservices/by-staff/:staffId - Bulk sync service IDs for a staff member
  syncServices: (staffId, serviceIds) =>
    request(`/staffservices/by-staff/${staffId}`, {
      method: "PUT",
      body: JSON.stringify({ service_ids: (serviceIds || []).map(Number) }),
    }),

  // PUT /api/staffservices/by-service/:serviceId - Bulk sync worker IDs for a specific service
  syncServiceWorkers: (serviceId, staffIds) =>
    request(`/staffservices/by-service/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify({ staff_ids: (staffIds || []).map(Number) }),
    }),
};