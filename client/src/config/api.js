import axios from "axios";

// Use environment variable with fallback to localhost
const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:8080";

// Debug: Log the API URL to console
// console.log("🔧 API_URL:", API_URL);

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If the data is FormData, remove the Content-Type header to let the browser set it
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export const API_ENDPOINTS = {
  base: API_URL,

  // Authentication endpoints
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
  },

  // User management endpoints
  users: {
    me: `${API_URL}/api/users/me`,
    updateProfile: `${API_URL}/api/users/me`,
    deleteAccount: `${API_URL}/api/users/me`,
  },

  // Project management endpoints
  projects: {
    list: `${API_URL}/api/projects`,
    create: `${API_URL}/api/projects`,
    get: (id) => `${API_URL}/api/projects/${id}`,
    update: (id) => `${API_URL}/api/projects/${id}`,
    delete: (id) => `${API_URL}/api/projects/${id}`,
  },

  // Prompt management endpoints
  prompts: {
    list: (projectId) => `${API_URL}/api/projects/${projectId}/prompts`,
    create: (projectId) => `${API_URL}/api/projects/${projectId}/prompts`,
    get: (projectId, promptId) =>
      `${API_URL}/api/projects/${projectId}/prompts/${promptId}`,
    update: (projectId, promptId) =>
      `${API_URL}/api/projects/${projectId}/prompts/${promptId}`,
    delete: (projectId, promptId) =>
      `${API_URL}/api/projects/${projectId}/prompts/${promptId}`,
  },

  // Chat endpoints
  chat: {
    send: (projectId) => `${API_URL}/api/projects/${projectId}/chat`,
    history: (projectId) => `${API_URL}/api/projects/${projectId}/chat/history`,
    clear: (projectId) => `${API_URL}/api/projects/${projectId}/chat/clear`,
  },

  // Health and status endpoints
  health: {
    check: `${API_URL}/health`,
    status: `${API_URL}/api/status`,
  },
};
