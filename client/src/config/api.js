import axios from "axios";
import { clearSession, getToken } from "../lib/authStorage";

// Use environment variable with fallback to localhost
const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/**
 * Endpoints that answer 401 as a normal outcome rather than an expired session.
 * A wrong password is not a reason to wipe storage and reload the page — doing
 * that is what made failed logins look like the form silently reset itself.
 */
const AUTH_ENDPOINTS = /\/api\/auth\/(login|register|forgot-password|reset-password)$/;

const isCredentialCheck = (url = "") => AUTH_ENDPOINTS.test(url.split("?")[0]);

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // Free-tier hosts cold-start well past ten seconds; the old timeout turned
  // a slow first request into "Network Error" on every page at once.
  timeout: Number(process.env.REACT_APP_API_TIMEOUT_MS) || 45000,
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
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
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !isCredentialCheck(url)) {
      // A genuinely expired session: drop it and send the user to log in.
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Turn any axios failure into an Error whose `message` is safe to render.
 *
 * Services used to rethrow the raw axios error, so forms displayed
 * "Request failed with status code 500" — technically true, useless to read.
 */
export const normalizeApiError = (error, fallback = "Something went wrong.") => {
  const data = error?.response?.data;

  const message =
    data?.message ||
    data?.errors?.[0]?.msg ||
    (typeof data === "string" && data.length < 300 ? data : null);

  if (message) {
    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.field = data?.field;
    normalized.retryAfter = data?.retryAfter;
    normalized.requestId = data?.requestId;
    return normalized;
  }

  if (error?.code === "ECONNABORTED") {
    return new Error(
      "The server took too long to respond. It may be waking up — try again."
    );
  }

  if (error?.message === "Network Error" || !error?.response) {
    return new Error(
      "Can't reach the server. Check your connection and try again."
    );
  }

  const normalized = new Error(fallback);
  normalized.status = error.response?.status;
  return normalized;
};

export default api;

export const API_ENDPOINTS = {
  base: API_URL,

  // Authentication endpoints
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    logout: `${API_URL}/api/auth/logout`,
    forgotPassword: `${API_URL}/api/auth/forgot-password`,
    resetPassword: `${API_URL}/api/auth/reset-password`,
    changePassword: `${API_URL}/api/auth/change-password`,
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

  // Conversation threads within a project
  conversations: {
    list: (projectId) => `${API_URL}/api/projects/${projectId}/conversations`,
    create: (projectId) => `${API_URL}/api/projects/${projectId}/conversations`,
    rename: (projectId, conversationId) =>
      `${API_URL}/api/projects/${projectId}/conversations/${conversationId}`,
    delete: (projectId, conversationId) =>
      `${API_URL}/api/projects/${projectId}/conversations/${conversationId}`,
    search: (projectId) =>
      `${API_URL}/api/projects/${projectId}/conversations/search`,
  },

  // Chat endpoints
  chat: {
    send: (projectId) => `${API_URL}/api/projects/${projectId}/chat`,
    stream: (projectId) => `${API_URL}/api/projects/${projectId}/chat/stream`,
    history: (projectId) => `${API_URL}/api/projects/${projectId}/chat/history`,
    clear: (projectId) => `${API_URL}/api/projects/${projectId}/chat/clear`,
  },

  // Health and status endpoints
  health: {
    check: `${API_URL}/health`,
    status: `${API_URL}/api/status`,
  },
};
