import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    if (error) {
      setError('');
    }
  };

  // Frontend validation function
  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 255) {
      errors.name = 'Name must be less than 255 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters and spaces';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format (e.g., user@example.com)';
    } else if (formData.email.length > 255) {
      errors.email = 'Email must be less than 255 characters';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone must be exactly 10 digits (no spaces or dashes)';
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      errors.address = 'Address must be at least 10 characters';
    } else if (formData.address.trim().length > 500) {
      errors.address = 'Address must be less than 500 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    console.log('📍 Form submitted');

    // Frontend validation (instant feedback)
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ Frontend validation failed:', validationErrors);
      setFieldErrors(validationErrors);
      setError('Please fix the errors above before submitting');
      return;
    }

    console.log('✅ Frontend validation passed');
    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        address: formData.address.trim()
      });
      
      console.log('✅ Registration successful');
      navigate('/citizen/dashboard');
    } catch (err) {
      console.error('❌ Registration error:', err);
      
      // Handle backend validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMap = {};
        err.response.data.errors.forEach(error => {
          if (error.field) {
            if (!errorMap[error.field]) {
              errorMap[error.field] = [];
            }
            errorMap[error.field].push(error.message);
          }
        });
        setFieldErrors(errorMap);
        
        const errorMessages = [];
        Object.entries(errorMap).forEach(([field, messages]) => {
          errorMessages.push(`${field.toUpperCase()}: ${messages.join(', ')}`);
        });
        setError(errorMessages.join(' | '));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">🏛️ CitySolve360</h1>
          <p className="auth-subtitle">Municipal Issue Management System</p>
        </div>
        
        <h2 className="auth-heading">Create Citizen Account</h2>
        
        {error && (
          <div className="auth-error">
            <strong>❌ Registration Failed:</strong>
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">
              Full Name {fieldErrors.name && <span className="required-error">*</span>}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              disabled={loading}
              className={fieldErrors.name ? 'input-error' : ''}
            />
            {fieldErrors.name && (
              <small className="field-error">
                {Array.isArray(fieldErrors.name) 
                  ? fieldErrors.name.join(' | ') 
                  : fieldErrors.name}
              </small>
            )}
            <small className="helper-text">Letters and spaces only, 2-255 characters</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              Email Address {fieldErrors.email && <span className="required-error">*</span>}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., john@example.com"
              disabled={loading}
              className={fieldErrors.email ? 'input-error' : ''}
            />
            {fieldErrors.email && (
              <small className="field-error">
                {Array.isArray(fieldErrors.email) 
                  ? fieldErrors.email.join(' | ') 
                  : fieldErrors.email}
              </small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">
              Phone Number {fieldErrors.phone && <span className="required-error">*</span>}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
              disabled={loading}
              maxLength="10"
              className={fieldErrors.phone ? 'input-error' : ''}
            />
            {fieldErrors.phone && (
              <small className="field-error">
                {Array.isArray(fieldErrors.phone) 
                  ? fieldErrors.phone.join(' | ') 
                  : fieldErrors.phone}
              </small>
            )}
            <small className="helper-text">Exactly 10 digits, no spaces or dashes</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="address">
              Address {fieldErrors.address && <span className="required-error">*</span>}
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street, Chennai, Tamil Nadu"
              rows="3"
              disabled={loading}
              className={fieldErrors.address ? 'input-error' : ''}
            />
            {fieldErrors.address && (
              <small className="field-error">
                {Array.isArray(fieldErrors.address) 
                  ? fieldErrors.address.join(' | ') 
                  : fieldErrors.address}
              </small>
            )}
            <small className="helper-text">10-500 characters</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Password {fieldErrors.password && <span className="required-error">*</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="e.g., Test@123"
              disabled={loading}
              className={fieldErrors.password ? 'input-error' : ''}
            />
            {fieldErrors.password && (
              <small className="field-error">
                {Array.isArray(fieldErrors.password) 
                  ? fieldErrors.password.join(' | ') 
                  : fieldErrors.password}
              </small>
            )}
            <small className="helper-text">
              Min 6 chars: 1 uppercase, 1 lowercase, 1 number
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password {fieldErrors.confirmPassword && <span className="required-error">*</span>}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              disabled={loading}
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
            />
            {fieldErrors.confirmPassword && (
              <small className="field-error">
                {Array.isArray(fieldErrors.confirmPassword) 
                  ? fieldErrors.confirmPassword.join(' | ') 
                  : fieldErrors.confirmPassword}
              </small>
            )}
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '✅ Sign Up'}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
