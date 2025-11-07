import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const OfficialDashboard = () => {
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
      
      console.log('Fetching official issues from: http://localhost:5000/api/dashboard/official/issues');
      
      const response = await axios.get(
        'http://localhost:5000/api/dashboard/official/issues',
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
        console.error('API Error:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError('Failed to load issues: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewIssue = (issueId) => {
    console.log('Navigating to issue:', issueId);
    navigate(`/official/issue/${issueId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filter logic
  const filteredIssues = filterStatus === 'all' 
    ? issues 
    : issues.filter(issue => issue.status === filterStatus);

  // Statistics
  const stats = {
    total: issues.length,
    created: issues.filter(i => i.status === 'created').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    completed: issues.filter(i => i.status === 'completed').length,
    rejected: issues.filter(i => i.status === 'rejected').length,
    escalated: issues.filter(i => i.status === 'escalated').length,
  };

  // Filter options
  const filterOptions = [
    { value: 'all', label: '📊 All Issues', count: stats.total, color: '#667eea' },
    { value: 'created', label: '📝 Created', count: stats.created, color: '#3498db' },
    { value: 'in_progress', label: '⏳ In_progress', count: stats.inProgress, color: '#f39c12' },
    { value: 'completed', label: '✓ Completed', count: stats.completed, color: '#27ae60' },
    { value: 'rejected', label: '✗ Rejected', count: stats.rejected, color: '#e74c3c' },
    { value: 'escalated', label: '⚠️ Escalated', count: stats.escalated, color: '#e67e22' },
  ];

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner">
          <p>Loading pending issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Official Dashboard</h1>
            <p className="header-subtitle">Manage and track issue resolutions</p>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>Total Issues</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(52, 152, 219, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.created}
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>Created</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(243, 156, 18, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.inProgress}
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>In_progress</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(39, 174, 96, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.completed}
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>Completed</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(231, 76, 60, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.rejected}
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>Rejected</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(230, 126, 34, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.escalated}
            </div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: '500' }}>Escalated</div>
          </div>
        </div>

        {/* Horizontal Tab Filters */}
        <div style={{
          background: 'white',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
          overflowX: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem',
            minWidth: 'fit-content'
          }}>
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: filterStatus === option.value ? option.color : '#f5f5f5',
                  color: filterStatus === option.value ? 'white' : '#333',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                  boxShadow: filterStatus === option.value ? `0 4px 12px ${option.color}40` : 'none',
                  transform: filterStatus === option.value ? 'translateY(-2px)' : 'none'
                }}
              >
                {option.label} <span style={{ opacity: 0.8 }}>({option.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Issues List */}
        {filteredIssues.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"></path>
            </svg>
            <h2>No {filterStatus !== 'all' ? filterStatus.replace('_', ' ') : ''} issues</h2>
            <p>
              {filterStatus === 'all'
                ? 'All issues in your department have been resolved!'
                : `No issues found with status: ${filterStatus.replace('_', ' ')}`}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredIssues.map(issue => {
              const timeline = getTimelineForCategory(issue.category);
              const priorityColor = getPriorityColor(timeline.priority);
              const issueAgeHours = (new Date() - new Date(issue.created_at)) / (1000 * 60 * 60);
              const ageDays = Math.floor(issueAgeHours / 24);

              return (
                <div
                  key={issue.id}
                  className={`issue-card ${issue.status === 'escalated' ? 'escalated-card' : ''}`}
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

                  <div style={{ paddingRight: '150px' }}>
                    {/* Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <span className={`status-badge status-${issue.status.replace(' ', '-').replace('_', '-')}`}>
                        {issue.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: '600' }}>#{issue.id}</span>
                    </div>

                    {/* Category */}
                    <h3 style={{ margin: '0 0 0.75rem 0', color: '#333', fontSize: '1.15rem', fontWeight: '600' }}>
                      {issue.category}
                    </h3>

                    {/* Description */}
                    <p style={{
                      margin: '0 0 1rem 0',
                      color: '#666',
                      lineHeight: '1.6',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      paddingTop: '1rem',
                      borderTop: '1px solid #f0f0f0',
                      fontSize: '0.85rem',
                      color: '#999'
                    }}>
                      <span>📅 {new Date(issue.created_at).toLocaleDateString()}</span>
                      <span style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.8rem'
                      }}>
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Info */}
        {filteredIssues.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '2.5rem',
            color: '#999',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            Showing <strong style={{ color: '#667eea' }}>{filteredIssues.length}</strong> of <strong>{stats.total}</strong> issues
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialDashboard;
