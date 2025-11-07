import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
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

  // Frontend validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Frontend validation
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 [LOGIN] Attempting login with email:', formData.email.toLowerCase());
      
      const user = await login(formData.email.trim().toLowerCase(), formData.password);
      
      console.log('✅ [LOGIN] Login successful');
      console.log('📍 [LOGIN] User data:', user);
      console.log('📍 [LOGIN] User role:', user.role);
      
      // ⭐ FIXED: Role mapping (note: backend sends 'higherofficial' lowercase)
      const rolePathMap = {
        'citizen': '/citizen/dashboard',
        'official': '/official/dashboard',
        'higherofficial': '/higher-official/dashboard'  // ✅ FIXED: lowercase
      };

      const redirectPath = rolePathMap[user.role];
      
      console.log('📍 [LOGIN] Role from backend:', user.role);
      console.log('📍 [LOGIN] Redirect path:', redirectPath);

      if (!redirectPath) {
        console.error('❌ [LOGIN] Unknown role:', user.role);
        setError(`Unknown role: ${user.role}`);
        setLoading(false);
        return;
      }

      console.log('✅ [LOGIN] Navigating to:', redirectPath);
      navigate(redirectPath, { replace: true });

    } catch (err) {
      console.error('❌ [LOGIN] Login error:', err);
      const errorMessage = typeof err === 'string' ? err : 'Login failed. Please check your credentials.';
      setError(errorMessage);
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
        
        <h2 className="auth-heading">Sign In</h2>
        
        {error && (
          <div className="auth-error">
            <strong>❌ Login Failed:</strong>
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Enter your email"
              disabled={loading}
              className={fieldErrors.email ? 'input-error' : ''}
            />
            {fieldErrors.email && (
              <small className="field-error">{fieldErrors.email}</small>
            )}
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
              placeholder="Enter your password"
              disabled={loading}
              className={fieldErrors.password ? 'input-error' : ''}
            />
            {fieldErrors.password && (
              <small className="field-error">{fieldErrors.password}</small>
            )}
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '⏳ Signing In...' : '🔐 Sign In'}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up as Citizen</Link>
        </p>

        {/* Test Credentials Help */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.85rem' }}>
          <strong>📋 Test Credentials:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>👤 Citizen: alice1@example.com</li>
            <li>👨‍💼 Official: frank.official1@citysolve.com</li>
            <li>👨‍⚖️ Higher Official: isabel.higher@citysolve.com</li>
          </ul>
          <p style={{ margin: '0.5rem 0', color: '#666' }}>Password: (Check your backend)</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
