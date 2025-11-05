import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/dashboard" className="header-logo">
          <span className="logo-icon">🏛️</span>
          <span className="logo-text">CitySolve360</span>
        </Link>

        <nav className="header-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard')}`}
          >
            Dashboard
          </Link>
          
          {user?.role === 'citizen' && (
            <>
              <Link 
                to="/report-issue" 
                className={`nav-link ${isActive('/report-issue')}`}
              >
                Report Issue
              </Link>
              <Link 
                to="/my-issues" 
                className={`nav-link ${isActive('/my-issues')}`}
              >
                My Issues
              </Link>
            </>
          )}
        </nav>

        <div className="header-actions">
          <div className="user-menu">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
            >
              <div className="user-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="user-name">{user?.name}</span>
              <span className="dropdown-icon">▼</span>
            </button>

            {showMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <strong>{user?.name}</strong>
                    <span className="user-email">{user?.email}</span>
                    <span className="user-role-badge">
                      {user?.role === 'official' ? '👮 Official' : '👤 Citizen'}
                    </span>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setShowMenu(false)}
                >
                  <span>👤</span> My Profile
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button 
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;