import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const HigherOfficialDashboard = () => {
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchIssues();
  }, []);

  // Timeline mapping for different categories
  const getTimelineForCategory = (category) => {
    const timelines = {
      'Public Safety': { priority: 'critical', hours: 6, resolution: 24 },
      'Water Leak': { priority: 'critical', hours: 24, resolution: 48 },
      'Drainage Problems': { priority: 'critical', hours: 24, resolution: 48 },
      'Road Repair': { priority: 'high', hours: 72, resolution: 336 },
      'Garbage Collection': { priority: 'high', hours: 72, resolution: 240 },
      'Street Light Issue': { priority: 'medium', hours: 120, resolution: 336 },
      'Traffic Signal': { priority: 'medium', hours: 120, resolution: 336 },
      'Parking Violation': { priority: 'low', hours: 168, resolution: 504 },
      'Noise Complaint': { priority: 'low', hours: 168, resolution: 504 },
      'Others': { priority: 'medium', hours: 120, resolution: 336 }
    };
    return timelines[category] || { priority: 'medium', hours: 120, resolution: 336 };
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'critical': '#e74c3c',
      'high': '#f39c12',
      'medium': '#3498db',
      'low': '#95a5a6'
    };
    return colors[priority] || '#3498db';
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      console.log('Fetching all issues for HigherOfficial');

      const response = await axios.get(
        'http://localhost:5000/api/dashboard/higher-official/issues',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Issues response:', response.data);

      if (response.data.success) {
        setIssues(response.data.data || []);
        console.log(`Loaded ${response.data.data.length} issues`);
      } else {
        setError('Failed to load issues: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewIssue = (issueId) => {
    navigate(`/higher-official/issue/${issueId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filter logic
  const filteredIssues = filterStatus === 'all' ? issues : issues.filter(issue => issue.status === filterStatus);

  // Statistics
  const stats = {
    total: issues.length,
    escalated: issues.filter(i => i.status === 'escalated').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    created: issues.filter(i => i.status === 'created').length,
    completed: issues.filter(i => i.status === 'completed').length,
    rejected: issues.filter(i => i.status === 'rejected').length
  };

  const filterOptions = [
    { value: 'escalated', label: '⚠️ Escalated', count: stats.escalated, color: '#e67e22' },
    { value: 'in_progress', label: '⏳ In_progress', count: stats.inProgress, color: '#f39c12' },
    { value: 'created', label: '📝 Created', count: stats.created, color: '#3498db' },
    { value: 'all', label: '📊 All Issues', count: stats.total, color: '#667eea' },
  ];

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner">
          <p>Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Higher Official Dashboard</h1>
          <p className="header-subtitle">Monitor all issues • Review escalations</p>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {filterOptions.map(option => (
          <div
            key={option.value}
            onClick={() => setFilterStatus(option.value)}
            style={{
              background: filterStatus === option.value ? option.color : 'white',
              border: `2px solid ${option.color}`,
              color: filterStatus === option.value ? 'white' : '#333',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600'
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              {option.count}
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              {option.label}
            </div>
          </div>
        ))}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"></path>
          </svg>
          <h2>No issues found</h2>
          <p>
            {filterStatus === 'escalated' 
              ? 'All escalated issues have been reviewed!' 
              : 'No issues in this category'}
          </p>
        </div>
      ) : (
        <div className="issues-list">
          {filteredIssues.map(issue => {
            const timeline = getTimelineForCategory(issue.category);
            const priorityColor = getPriorityColor(timeline.priority);
            const issueAgeHours = (new Date() - new Date(issue.created_at)) / (1000 * 60 * 60);
            const ageDays = Math.floor(issueAgeHours / 24);

            return (
              <div
                key={issue.id}
                className="issue-card"
                onClick={() => handleViewIssue(issue.id)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  borderLeft: `4px solid ${priorityColor}`
                }}
              >
                {/* Priority Badge in corner */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: priorityColor,
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0 8px 0 8px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {timeline.priority}
                </div>

                {/* Escalated Badge */}
                {issue.status === 'escalated' && (
                  <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    background: '#e67e22',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.7rem',
                    fontWeight: '700'
                  }}>
                    ⚠️ ESCALATED
                  </div>
                )}

                <div style={{ marginTop: '0.5rem', paddingRight: '150px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>
                        {issue.category}
                      </h3>
                      <small style={{ color: '#999', marginTop: '0.25rem' }}>
                        Issue #{issue.id} • Citizen #{issue.citizen_id}
                      </small>
                    </div>
                    <span className={`status-badge status-${issue.status.replace('_', '-')}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#666',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.9rem'
                  }}>
                    {issue.description}
                  </p>

                  {/* Timeline Info */}
                  <div style={{
                    background: '#f0f7ff',
                    border: `1px solid ${priorityColor}40`,
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#666', fontWeight: '500' }}>
                        ⏳ Response: <strong>{timeline.hours}h</strong>
                      </span>
                      <span style={{ color: '#666', fontWeight: '500' }}>
                        🎯 Resolution: <strong>{timeline.resolution}h</strong>
                      </span>
                      <span style={{ color: '#666', fontWeight: '500' }}>
                        📅 Age: <strong>{ageDays}d</strong>
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #f0f0f0',
                    fontSize: '0.8rem',
                    color: '#999'
                  }}>
                    <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                    <span style={{ fontWeight: '600', color: '#667eea' }}>View →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HigherOfficialDashboard;
