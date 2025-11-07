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

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ Auth initialized. User:', parsedUser.name);
    }
    setLoading(false);
  }, []);

const login = async (email, password) => {
  try {
    console.log('Attempting login with email:', email);
    
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/login`,
      { email, password }
    );

    console.log('Login response:', response.data);

    // ✅ Check what your backend actually returns
    const responseData = response.data.data || response.data;

    if (response.data.success || responseData) {
      // ✅ Handle different response structures
      const userData = {
        id: responseData.id || responseData.user?.id,
        name: responseData.name || responseData.user?.name || responseData.email,
        email: responseData.email || responseData.user?.email,
        role: responseData.role || responseData.user?.role
      };

      const token = responseData.token || response.data.data?.token || response.data.token;

      if (!token) {
        throw new Error('No token received from server');
      }

      // ✅ Store data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);

      console.log('✅ Login successful. User name:', userData.name);
      return userData;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    console.error('❌ Login error:', errorMessage);
    console.error('Full response:', error.response?.data);
    throw errorMessage;
  }
};

  // ✅ REGISTER - with name storage
  const register = async (userData) => {
    try {
      console.log('Attempting registration with email:', userData.email);
      console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/register`,
        userData
      );

      console.log('Registration response:', response.data);

      if (response.data.success) {
        const newUser = {
          id: response.data.data.id,
          name: response.data.data.name || userData.name,  // ✅ Name stored
          email: response.data.data.email,
          role: response.data.data.role
        };

        const token = response.data.data.token;

        // ✅ Store token
        localStorage.setItem('token', token);

        // ✅ Store user with name
        localStorage.setItem('user', JSON.stringify(newUser));

        // ✅ Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // ✅ Update state
        setUser(newUser);

        console.log('✅ Registration successful. User name:', newUser.name);
        return newUser;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      console.error('❌ Registration error:', errorMessage);
      throw errorMessage;
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    console.log('✅ Logout successful');
  };

  // ✅ UPDATE USER (if needed)
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('✅ User updated:', updatedUser.name);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
