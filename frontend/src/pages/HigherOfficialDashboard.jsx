import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './Dashboard.css';

const HigherOfficialDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues/official-issues');
      setIssues(response.data.issues);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch escalated issues');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading">Loading escalated issues...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>⚠️ Escalated Issues</h1>
          <span className="badge-count">{issues.length} Issues</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {issues.length === 0 ? (
          <div className="empty-state">
            <h2>No Escalated Issues</h2>
            <p>All issues are being handled by your team</p>
          </div>
        ) : (
          <div className="issues-grid">
            {issues.map((issue) => (
              <div key={issue.id} className="issue-card escalated-card">
                <div className="issue-card-header">
                  <h3>{issue.category}</h3>
                  <span className="status-badge status-escalated">
                    ESCALATED
                  </span>
                </div>
                
                <p className="issue-description">{issue.description}</p>
                
                <div className="issue-citizen-info">
                  <strong>Citizen:</strong> {issue.citizen_name}<br />
                  <strong>Phone:</strong> {issue.phone}<br />
                  <strong>Address:</strong> {issue.address}
                </div>
                
                <div className="issue-meta">
                  <span>📅 Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                  <span>🆔 #{issue.id}</span>
                </div>

                <div className="issue-actions">
                  <Link to={`/issue/${issue.id}`} className="btn-primary">
                    Handle Issue
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HigherOfficialDashboard;
