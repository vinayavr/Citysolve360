import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import CreateIssue from './pages/CreateIssue';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import HigherOfficialDashboard from './pages/HigherOfficialDashboard';
import RaiseIssue from './pages/RaiseIssue';
import IssueDetails from './pages/IssueDetails';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/citizen/dashboard" element={
            <PrivateRoute allowedRoles={['citizen']}>
              <CitizenDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/citizen/raise-issue" element={
            <PrivateRoute allowedRoles={['citizen']}>
              <RaiseIssue />
            </PrivateRoute>
          } />
          
          <Route path="/official/dashboard" element={
            <PrivateRoute allowedRoles={['official']}>
              <OfficialDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/higher-official/dashboard" element={
            <PrivateRoute allowedRoles={['higherofficial']}>
              <HigherOfficialDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/issue/:issueId" element={
            <PrivateRoute>
              <IssueDetails />
            </PrivateRoute>
          } />

          <Route 
            path="/citizen/create-issue" 
            element={
              <PrivateRoute allowedRoles={['citizen']}>
                <CreateIssue />
              </PrivateRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
