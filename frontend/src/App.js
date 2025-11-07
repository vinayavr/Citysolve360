import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import HigherOfficialDashboard from './pages/HigherOfficialDashboard';
import CreateIssue from './pages/CreateIssue';
import IssueDetails from './pages/IssueDetails';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ======================================== 
              PUBLIC ROUTES 
              ======================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ======================================== 
              CITIZEN ROUTES 
              ======================================== */}
          <Route
            path="/citizen/dashboard"
            element={
              <PrivateRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/citizen/create-issue"
            element={
              <PrivateRoute allowedRoles={['citizen']}>
                <CreateIssue />
              </PrivateRoute>
            }
          />
          <Route
            path="/citizen/issue/:issueId"
            element={
              <PrivateRoute allowedRoles={['citizen']}>
                <IssueDetails />
              </PrivateRoute>
            }
          />

          {/* ======================================== 
              OFFICIAL ROUTES 
              ======================================== */}
          <Route
            path="/official/dashboard"
            element={
              <PrivateRoute allowedRoles={['official']}>
                <OfficialDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/official/issue/:issueId"
            element={
              <PrivateRoute allowedRoles={['official']}>
                <IssueDetails />
              </PrivateRoute>
            }
          />

          {/* ======================================== 
              HIGHER OFFICIAL ROUTES 
              ======================================== */}
          <Route
            path="/higher-official/dashboard"
            element={
              <PrivateRoute allowedRoles={['higherofficial']}>
                <HigherOfficialDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/higher-official/issue/:issueId"
            element={
              <PrivateRoute allowedRoles={['higherofficial']}>
                <IssueDetails />
              </PrivateRoute>
            }
          />

          {/* ======================================== 
              DEFAULT ROUTES 
              ======================================== */}
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all: redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
