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

export const getLocalizedValue = (record, field, language = "en") => {
  if (!record) return "";
  const localizedValue = record[`${field}_${language}`];
  if (localizedValue != null && localizedValue !== "") return localizedValue;
  const englishValue = record[`${field}_en`];
  if (englishValue != null && englishValue !== "") return englishValue;
  return record[field] || "";
};

async function request(endpoint, options = {}, tokenKey = STAFF_TOKEN_KEY) {
  const token = tokenKey === STAFF_TOKEN_KEY
    ? getStaffToken()
    : tokenKey
      ? localStorage.getItem(tokenKey)
      : null;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
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
  createAppointment: (bookingData, referenceImages = []) => {
    if (!referenceImages.length) {
      return request("/appointments", {
        method: "POST",
        body: JSON.stringify(bookingData),
      }, CUSTOMER_TOKEN_KEY);
    }

    const formData = new FormData();
    Object.entries(bookingData).forEach(([key, value]) => {
      formData.append(key, value !== null && typeof value === "object" ? JSON.stringify(value) : String(value));
    });
    referenceImages.forEach((image) => formData.append("reference_images", image));

    return request("/appointments", {
      method: "POST",
      body: formData,
    }, CUSTOMER_TOKEN_KEY);
  },

  getReferenceImage: async (url) => {
    if (typeof url !== "string" || !/^\/api\/appointments\/\d+\/references\/\d+$/.test(url)) {
      throw new Error("Invalid appointment reference image URL.");
    }

    const token = getStaffToken();
    if (!token) throw new Error("Staff authentication is required to view reference images.");

    const response = await fetch(`${SERVER_BASE_URL}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Could not load appointment reference image.");
    }
    return response.blob();
  },

  // Public: get bookable slots for a service (optionally filtered to one staff member) on a given date.
  getAvailability: ({ serviceId, staffId, date }) => {
    const params = new URLSearchParams({ service_id: serviceId, date });
    if (staffId) params.set("staff_id", staffId);
    return request(`/appointments/availability?${params.toString()}`, { method: "GET" }, null);
  },

  listAppointments: (brandId) => {
    const query = brandId ? `?${new URLSearchParams({ brand_id: brandId })}` : "";
    return request(`/appointments${query}`);
  },

  updateStatus: (appointmentId, status) =>
    request(`/appointments/${appointmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateFeeStatus: (appointmentId, feeStatus) =>
    request(`/appointments/${appointmentId}/fee-status`, {
      method: "PATCH",
      body: JSON.stringify({ fee_status: feeStatus }),
    }),

  updatePaymentStatus: (appointmentId, paymentStatus) =>
    request(`/appointments/${appointmentId}/payment-status`, {
      method: "PATCH",
      body: JSON.stringify({ payment_status: paymentStatus }),
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

  getForStaff: (staffId, brandId, date) => {
    const query = new URLSearchParams({ brand_id: brandId, date });
    return request(`/staff-availability/${encodeURIComponent(staffId)}?${query}`);
  },

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

const uploadBrandImage = async (brandId, imageType, file) => {
  const formData = new FormData();
  formData.append("image", file);
  const token = getStaffToken();
  const response = await fetch(`${API_BASE_URL}/brands/${brandId}/${imageType}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload brand image.");
  }

  return data;
};

export const brandPortfolioApi = {
  get: (brandId) => request(`/brands/${brandId}/portfolio`, { method: "GET" }, null),

  uploadLogo: (brandId, file) => uploadBrandImage(brandId, "logo", file),

  uploadCover: (brandId, file) => uploadBrandImage(brandId, "cover", file),

  uploadImage: async (brandId, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const token = getStaffToken();
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/portfolio/images`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload portfolio image.");
    }

    return data;
  },

  deleteImage: (brandId, imageId) =>
    request(`/brands/${brandId}/portfolio/images/${imageId}`, { method: "DELETE" }),

  save: (brandId, portfolio) =>
    request(`/brands/${brandId}/portfolio`, {
      method: "PUT",
      body: JSON.stringify({
        layout: portfolio.layout,
        image_ids: portfolio.imageIds,
      }),
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