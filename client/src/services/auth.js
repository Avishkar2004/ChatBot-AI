import api, { API_ENDPOINTS, normalizeApiError } from '../config/api.js';

export async function register(username, email, password) {
  try {
    const response = await api.post(API_ENDPOINTS.auth.register, {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Could not create your account. Please try again.');
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
    throw normalizeApiError(error, 'Could not sign you in. Please try again.');
  }
}

export async function fetchMe() {
  try {
    const response = await api.get(API_ENDPOINTS.users.me);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Could not load your profile.');
  }
}

/**
 * Ends the session server-side so the token stops working immediately.
 * Best-effort: the client clears its own storage either way, so a failed
 * request must never leave someone stuck looking signed in.
 */
export async function logout() {
  try {
    await api.post(API_ENDPOINTS.auth.logout);
    return true;
  } catch {
    return false;
  }
}

export async function requestPasswordReset(email) {
  try {
    const response = await api.post(API_ENDPOINTS.auth.forgotPassword, { email });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Could not send the reset email. Please try again.');
  }
}

export async function resetPassword(token, password) {
  try {
    const response = await api.post(API_ENDPOINTS.auth.resetPassword, {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Could not reset your password. Please try again.');
  }
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await api.post(API_ENDPOINTS.auth.changePassword, {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw normalizeApiError(error, 'Could not change your password. Please try again.');
  }
}
