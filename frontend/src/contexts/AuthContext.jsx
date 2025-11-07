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

  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ [AUTH] User restored from localStorage:', parsedUser.role);
      } catch (error) {
        console.error('❌ [AUTH] Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('📍 [AUTH] Attempting login with email:', email);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      console.log('📍 [AUTH] Full response:', response.data);

      // ⭐ FIXED: Backend sends { success, token, user } directly
      const { success, token, user: userData } = response.data;

      console.log('📍 [AUTH] success:', success);
      console.log('📍 [AUTH] token exists:', !!token);
      console.log('📍 [AUTH] userData:', userData);

      if (!success) {
        throw new Error(response.data.message || 'Login failed');
      }

      if (!token) {
        console.error('❌ Token missing');
        throw new Error('No token in response');
      }

      if (!userData) {
        console.error('❌ User data missing');
        throw new Error('No user data in response');
      }

      console.log('📍 [AUTH] Valid response - User role:', userData.role);

      // Store token
      localStorage.setItem('token', token);
      console.log('✅ [AUTH] Token stored');

      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ [AUTH] User data stored');

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ [AUTH] Authorization header set');

      // Update state
      setUser(userData);
      console.log('✅ [AUTH] User state updated');
      console.log('=' .repeat(60));
      console.log('✅ [AUTH] LOGIN SUCCESSFUL');
      console.log('=' .repeat(60));

      return userData;

    } catch (error) {
      console.error('=' .repeat(60));
      console.error('❌ [AUTH] LOGIN FAILED');
      console.error('=' .repeat(60));

      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('❌ [AUTH] Error:', errorMessage);

      // Clear any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];

      throw errorMessage;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📍 [AUTH] Attempting registration with email:', userData.email);
      
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);

      console.log('📍 [AUTH] Full response:', response.data);

      // ⭐ FIXED: Backend sends { success, token, user } directly
      const { success, token, user: registeredUser } = response.data;

      console.log('📍 [AUTH] success:', success);
      console.log('📍 [AUTH] token exists:', !!token);
      console.log('📍 [AUTH] userData:', registeredUser);

      if (!success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      if (!token) {
        console.error('❌ Token missing');
        throw new Error('No token in response');
      }

      if (!registeredUser) {
        console.error('❌ User data missing');
        throw new Error('No user data in response');
      }

      console.log('📍 [AUTH] Valid response - User role:', registeredUser.role);

      // Store token
      localStorage.setItem('token', token);
      console.log('✅ [AUTH] Token stored');

      // Store user data
      localStorage.setItem('user', JSON.stringify(registeredUser));
      console.log('✅ [AUTH] User data stored');

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ [AUTH] Authorization header set');

      // Update state
      setUser(registeredUser);
      console.log('✅ [AUTH] User state updated');
      console.log('=' .repeat(60));
      console.log('✅ [AUTH] REGISTRATION SUCCESSFUL');
      console.log('=' .repeat(60));

      return registeredUser;

    } catch (error) {
      console.error('=' .repeat(60));
      console.error('❌ [AUTH] REGISTRATION FAILED');
      console.error('=' .repeat(60));

      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      console.error('❌ [AUTH] Error:', errorMessage);

      // Clear any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];

      throw errorMessage;
    }
  };

  const logout = () => {
    console.log('📍 [AUTH] Logging out user...');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ [AUTH] localStorage cleared');

    delete axios.defaults.headers.common['Authorization'];
    console.log('✅ [AUTH] Authorization header removed');

    setUser(null);
    console.log('✅ [AUTH] User state cleared');
    console.log('✅ [AUTH] LOGOUT SUCCESSFUL');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
