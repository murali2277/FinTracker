import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/users/login', { email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || error.message;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const register = async (name, email, phone, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/users', { name, email, phone, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || error.message;
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.put('/api/users/profile', profileData, config);
        // Persist new data (including updated phone potentially)
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setLoading(false);
        return data;
    } catch (error) {
        setLoading(false);
        throw error.response?.data?.message || error.message;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
