/**
 * Where the session lives.
 *
 * "Remember me" was a checkbox wired to nothing — the token always went to
 * localStorage and survived until it expired a week later, even on a shared
 * machine. Checking it still uses localStorage; leaving it unchecked uses
 * sessionStorage, so closing the tab ends the session.
 *
 * Reads look in both places so a session started either way is found, and so
 * an in-flight upgrade (log in, tick the box next time) never strands a token.
 */

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const PERSIST_KEY = "auth_persist";

const PLACEHOLDERS = new Set(["undefined", "null", ""]);

// Private browsing and some embedded webviews throw on any storage access.
const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const stores = () => safe(() => [window.localStorage, window.sessionStorage], []);

const readFirst = (key) => {
  for (const store of stores()) {
    const value = safe(() => store.getItem(key));
    if (value !== null && value !== undefined) return value;
  }
  return null;
};

const removeEverywhere = (key) => {
  for (const store of stores()) safe(() => store.removeItem(key));
};

const activeStore = () =>
  safe(
    () =>
      window.localStorage.getItem(PERSIST_KEY) === "false"
        ? window.sessionStorage
        : window.localStorage,
    null,
  );

export const getToken = () => {
  const token = readFirst(TOKEN_KEY);
  // Older builds could write the literal string "undefined" here.
  if (!token || PLACEHOLDERS.has(token)) return null;
  return token;
};

export const getStoredUser = () => {
  const raw = readFirst(USER_KEY);
  if (!raw || PLACEHOLDERS.has(raw)) return null;
  try {
    return JSON.parse(raw);
  } catch {
    removeEverywhere(USER_KEY);
    return null;
  }
};

export const saveSession = (token, user, { remember = true } = {}) => {
  clearSession();
  safe(() => window.localStorage.setItem(PERSIST_KEY, String(remember)));
  const store = activeStore();
  if (!store) return;
  safe(() => store.setItem(TOKEN_KEY, token));
  if (user) safe(() => store.setItem(USER_KEY, JSON.stringify(user)));
};

export const saveUser = (user) => {
  const store = activeStore();
  if (!store || !user) return;
  safe(() => store.setItem(USER_KEY, JSON.stringify(user)));
};

export const clearSession = () => {
  removeEverywhere(TOKEN_KEY);
  removeEverywhere(USER_KEY);
};
