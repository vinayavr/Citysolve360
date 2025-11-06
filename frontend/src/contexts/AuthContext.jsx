import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password
      });

      console.log('Login response:', response.data);

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return user;
    } catch (error) {
      // Get specific error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('Login error:', errorMessage);
      throw errorMessage;
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration with email:', userData.email);
      
      // Add this console log before the axios call
      console.log('API URL:', process.env.REACT_APP_API_URL);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, userData);

      console.log('Registration response:', response.data);

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      console.error('Registration error:', errorMessage);
      throw errorMessage;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
