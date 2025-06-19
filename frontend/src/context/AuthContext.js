import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api'; // Corrected path
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    setLoading(false);
    return;
  }

  try {
    const response = await authAPI.getProfile();
    console.log('Fetched user profile:', response.data);
    setUser(response.data);
  } catch (error) {
    console.error("Failed to fetch user", error);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } finally {
    setLoading(false);
  }
}, []);

const login = async (credentials) => {
  try {
    const response = await authAPI.login(credentials);
    console.log('Login response:', response.data);
    const { access, refresh, user } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(user);
    toast.success('Logged in successfully!');
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    toast.error(error.response?.data?.detail || 'Login failed');
    throw error;
  }
};


  useEffect(() => {
    fetchUser();
  }, [fetchUser]);


  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      await login({ email: userData.email, password: userData.password });
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await authAPI.logout({ refresh: refreshToken }); // call logout endpoint
    }

    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    toast.success('Logged out successfully');
  } catch (error) {
    console.error('Logout failed:', error);
    toast.error('TATA');
  }
};


  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
