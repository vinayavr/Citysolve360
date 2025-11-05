import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import '../styles/Pages.css';

const Register = () => {
  return (
    <div className="page-container">
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-branding">
            <h1>🏛️ CitySolve360</h1>
            <p className="tagline">Be Part of the Solution</p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">👤</span>
                <div>
                  <h3>Quick Registration</h3>
                  <p>Create your account in under a minute</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div>
                  <h3>Secure & Private</h3>
                  <p>Your data is encrypted and protected</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <h3>Make an Impact</h3>
                  <p>Help improve your community</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-right">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;