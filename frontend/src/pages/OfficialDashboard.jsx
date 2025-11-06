import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './Dashboard.css';

const OfficialDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues/official-issues');
      setIssues(response.data.issues);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch issues');
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'created':
        return 'status-badge status-created';
      case 'in progress':
        return 'status-badge status-progress';
      case 'escalated':
        return 'status-badge status-escalated';
      default:
        return 'status-badge';
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.status === filter;
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading">Loading issues...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Official Dashboard</h1>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'btn-filter active' : 'btn-filter'}
              onClick={() => setFilter('all')}
            >
              All ({issues.length})
            </button>
            <button 
              className={filter === 'created' ? 'btn-filter active' : 'btn-filter'}
              onClick={() => setFilter('created')}
            >
              New ({issues.filter(i => i.status === 'created').length})
            </button>
            <button 
              className={filter === 'in progress' ? 'btn-filter active' : 'btn-filter'}
              onClick={() => setFilter('in progress')}
            >
              In Progress ({issues.filter(i => i.status === 'in progress').length})
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {filteredIssues.length === 0 ? (
          <div className="empty-state">
            <h2>No Issues Found</h2>
            <p>There are no {filter !== 'all' ? filter : ''} issues at the moment</p>
          </div>
        ) : (
          <div className="issues-grid">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="issue-card">
                <div className="issue-card-header">
                  <h3>{issue.category}</h3>
                  <span className={getStatusBadgeClass(issue.status)}>
                    {issue.status}
                  </span>
                </div>
                
                <p className="issue-description">{issue.description}</p>
                
                <div className="issue-citizen-info">
                  <strong>Citizen:</strong> {issue.citizen_name}<br />
                  <strong>Phone:</strong> {issue.phone}
                </div>
                
                <div className="issue-meta">
                  <span>📅 {new Date(issue.created_at).toLocaleDateString()}</span>
                  <span>🆔 #{issue.id}</span>
                </div>

                <div className="issue-actions">
                  <Link to={`/issue/${issue.id}`} className="btn-primary">
                    View & Update
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

export default OfficialDashboard;
