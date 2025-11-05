import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import '../styles/Pages.css';

const Login = () => {
  return (
    <div className="page-container">
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-branding">
            <h1>🏛️ CitySolve360</h1>
            <p className="tagline">Empowering Citizens, Building Better Communities</p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <div>
                  <h3>Easy Reporting</h3>
                  <p>Report civic issues in seconds with photos and location</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <div>
                  <h3>Track Progress</h3>
                  <p>Monitor the status of your reported issues in real-time</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤝</span>
                <div>
                  <h3>Quick Resolution</h3>
                  <p>Direct communication between citizens and officials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-right">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;