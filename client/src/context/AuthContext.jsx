import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe } from '../services/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        setToken(storedToken);

        // If we have a token but no user, try to fetch user data
        if (!storedUser) {
          try {
            const userData = await fetchMe(storedToken);
            setUser(userData.user);
            localStorage.setItem('auth_user', JSON.stringify(userData.user));
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            // Token is invalid, clear everything
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
          }
        } else {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        }
      } else {
        // Clean up invalid tokens
        if (storedToken === 'undefined' || storedToken === 'null') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken, newUser) => {
    if (!newToken || newToken === 'undefined' || newToken === 'null') {
      console.error('Invalid token provided to login');
      return;
    }

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value = useMemo(() => ({
    token,
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!(token && token !== 'undefined' && token !== 'null' && user)
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;


