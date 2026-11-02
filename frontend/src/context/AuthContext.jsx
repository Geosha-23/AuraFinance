import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, allowance = 15000) => {
    const data = await api.auth.register(name, email, password, allowance);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const loginAsDemo = async () => {
    const demoEmail = 'student@campus.edu';
    const demoPassword = 'collegebudget123';
    try {
      return await login(demoEmail, demoPassword);
    } catch (e) {
      // If user doesn't exist yet, register and auto-seed
      const reg = await register('Aarav Sharma (Student)', demoEmail, demoPassword, 15000);
      try {
        await api.transactions.seedDemo();
      } catch (seedErr) {
        console.warn('Auto seed warning:', seedErr);
      }
      return reg;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      register,
      loginAsDemo,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
