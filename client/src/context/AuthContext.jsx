import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMe, logout as apiLogout } from "../services/auth.js";
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
  saveUser,
} from "../lib/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore a session from whichever storage it was written to.
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const storedToken = getToken();

      if (!storedToken) {
        clearSession();
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setToken(storedToken);

      const storedUser = getStoredUser();
      if (storedUser) {
        if (!cancelled) setUser(storedUser);
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const data = await fetchMe();
        if (cancelled) return;
        setUser(data.user);
        saveUser(data.user);
      } catch {
        // The token no longer works — start clean rather than half signed in.
        if (cancelled) return;
        clearSession();
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((newToken, newUser, { remember = true } = {}) => {
    if (!newToken) return;
    setToken(newToken);
    setUser(newUser);
    saveSession(newToken, newUser, { remember });
  }, []);

  const logout = useCallback(async () => {
    // Revoke server-side first, while the token is still attached to requests.
    await apiLogout();
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!(token && user),
    }),
    [token, user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
