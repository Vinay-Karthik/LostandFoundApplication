import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { setAuthToken } from '../api/axiosClient';

const AuthContext = createContext(null);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('ct_token') || sessionStorage.getItem('ct_token');
    const expiryStr = localStorage.getItem('ct_token_expiry');
    const userStr = localStorage.getItem('ct_user');

    if (!token) return { token: null, user: null };

    // Check if 7 days have passed
    if (expiryStr && Date.now() > parseInt(expiryStr, 10)) {
      localStorage.removeItem('ct_token');
      localStorage.removeItem('ct_token_expiry');
      localStorage.removeItem('ct_user');
      sessionStorage.removeItem('ct_token');
      return { token: null, user: null };
    }

    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const initialAuth = getStoredAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);
  const [loading, setLoading] = useState(!initialAuth.token ? false : true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      authApi.getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('ct_user', JSON.stringify(res.data));
          } else {
            logout();
          }
        })
        .catch(() => {
          // If token has expired on server, logout
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      const { token: jwt, ...userData } = res.data;
      const expiry = Date.now() + SEVEN_DAYS_MS;

      setToken(jwt);
      setUser(userData);
      setAuthToken(jwt);

      localStorage.setItem('ct_token', jwt);
      localStorage.setItem('ct_token_expiry', expiry.toString());
      localStorage.setItem('ct_user', JSON.stringify(userData));
      sessionStorage.setItem('ct_token', jwt);

      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, otp) => {
    const res = await authApi.register({ name, email, password, otp });
    if (res.success && res.data) {
      const { token: jwt, ...userData } = res.data;
      const expiry = Date.now() + SEVEN_DAYS_MS;

      setToken(jwt);
      setUser(userData);
      setAuthToken(jwt);

      localStorage.setItem('ct_token', jwt);
      localStorage.setItem('ct_token_expiry', expiry.toString());
      localStorage.setItem('ct_user', JSON.stringify(userData));
      sessionStorage.setItem('ct_token', jwt);

      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_token_expiry');
    localStorage.removeItem('ct_user');
    sessionStorage.removeItem('ct_token');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('ct_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isVerified: Boolean(user?.verified) || user?.role === 'ADMIN',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
