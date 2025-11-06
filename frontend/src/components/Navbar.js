import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (user.role === 'citizen') return '/citizen/dashboard';
    if (user.role === 'official') return '/official/dashboard';
    if (user.role === 'higherofficial') return '/higher-official/dashboard';
    return '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={getDashboardLink()} className="navbar-logo">
          🏛️ CitySolve360
        </Link>
        
        <div className="navbar-menu">
          <Link to={getDashboardLink()} className="navbar-link">
            Dashboard
          </Link>
          
          {user.role === 'citizen' && (
            <Link to="/citizen/raise-issue" className="navbar-link">
              Raise Issue
            </Link>
          )}
          
          <div className="navbar-user">
            <span className="navbar-username">{user.name}</span>
            <span className="navbar-role">
              ({user.role === 'higherofficial' ? 'Higher Official' : user.role})
            </span>
          </div>
          
          <button onClick={handleLogout} className="navbar-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
