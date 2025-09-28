import api, { API_ENDPOINTS } from '../config/api.js';

export async function register(username, email, password) {
  try {
    const response = await api.post(API_ENDPOINTS.auth.register, {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const response = await api.post(API_ENDPOINTS.auth.login, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function fetchMe() {
  try {
    const response = await api.get(API_ENDPOINTS.users.me);
    return response.data;
  } catch (error) {
    console.error("Fetch user error:", error);
    throw error;
  }
}
