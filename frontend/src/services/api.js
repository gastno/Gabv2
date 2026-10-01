const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const STAFF_TOKEN_KEY = "staff_auth_token";
const CUSTOMER_TOKEN_KEY = "customer_auth_token";

function getStaffToken() {
  return localStorage.getItem(STAFF_TOKEN_KEY)
    || (localStorage.getItem("staff_role") ? localStorage.getItem("auth_token") : null);
}

export const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

async function request(endpoint, options = {}, tokenKey = STAFF_TOKEN_KEY) {
  const token = tokenKey === STAFF_TOKEN_KEY
    ? getStaffToken()
    : tokenKey
      ? localStorage.getItem(tokenKey)
      : null;

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
    }, null),

  customerLogin: async (email, password) => {
    const data = await request("/auth/customer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, null);
    if (data.token) localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
    return data;
  },

  customerRegister: async (userData) => {
    const data = await request("/auth/customer/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }, null);
    if (data.token) localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
    return data;
  },

  getMe: () => request("/auth/me", { method: "GET" }, CUSTOMER_TOKEN_KEY),
};

export const apptApi = {
  createAppointment: (bookingData) =>
    request("/appointments", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }, CUSTOMER_TOKEN_KEY),

  // Public: get bookable slots for a service (optionally filtered to one staff member) on a given date.
  getAvailability: ({ serviceId, staffId, date }) => {
    const params = new URLSearchParams({ service_id: serviceId, date });
    if (staffId) params.set("staff_id", staffId);
    return request(`/appointments/availability?${params.toString()}`, { method: "GET" }, null);
  },

  listAppointments: () => request("/appointments"),

  updateStatus: (appointmentId, status) =>
    request(`/appointments/${appointmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  cancelAppointment: (appointmentId, reason) =>
    request(`/appointments/${appointmentId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getStaffSchedule: () => request("/appointments/staff-schedule", { method: "GET" }),
};

export const staffAvailabilityApi = {
  getForDate: (date) =>
    request(`/staff-availability/me/availability/${encodeURIComponent(date)}`),

  replaceForDate: (date, shifts) =>
    request(`/staff-availability/me/availability/${encodeURIComponent(date)}`, {
      method: "PUT",
      body: JSON.stringify({ shifts }),
    }),

  addUnavailability: (period) =>
    request("/staff-availability/me/unavailabilities", {
      method: "POST",
      body: JSON.stringify(period),
    }),

  removeUnavailability: (id) =>
    request(`/staff-availability/me/unavailabilities/${id}`, {
      method: "DELETE",
    }),
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

    const token = getStaffToken();

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

    const token = getStaffToken();

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