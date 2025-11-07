import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDetailsLoading, setIssueDetailsLoading] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationNote, setEscalationNote] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);

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
      
      console.log('Fetching issues from: http://localhost:5000/api/dashboard/citizen/issues');
      
      const response = await axios.get(
        'http://localhost:5000/api/dashboard/citizen/issues',
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
      setError('Failed to load issues: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueDetails = async (id) => {
    try {
      setIssueDetailsLoading(true);
      const token = localStorage.getItem('token');
      
      console.log(`Fetching issue details for ID: ${id}`);
      
      const response = await axios.get(
        `http://localhost:5000/api/issues/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Issue details response:', response.data);

      if (response.data.success) {
        setSelectedIssue(response.data.data);
        setError('');
      } else {
        setError('Failed to load issue details: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error fetching issue details:', err);
      setError('Failed to load issue details: ' + (err.response?.data?.message || err.message));
    } finally {
      setIssueDetailsLoading(false);
    }
  };

  const handleViewIssue = (issueId) => {
    console.log('Viewing issue:', issueId);
    fetchIssueDetails(issueId);
  };

  const handleCloseDetails = () => {
    setSelectedIssue(null);
    setError('');
    setShowEscalationModal(false);
    setEscalationReason('');
    setEscalationNote('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRaiseIssue = () => {
    navigate('/citizen/create-issue');
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/issues/attachment/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded: ${filename}`);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      setError('Failed to download attachment: ' + err.message);
    }
  };

  // ESCALATION LOGIC
  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      setError('Please select an escalation reason');
      return;
    }

    if (!escalationNote.trim()) {
      setError('Please add a note explaining why you need escalation');
      return;
    }

    try {
      setEscalating(true);
      setError('');
      const token = localStorage.getItem('token');

      console.log(`Escalating issue ${selectedIssue.id}`);

      const response = await axios.put(
        `http://localhost:5000/api/issues/${selectedIssue.id}/escalate`,
        {
          reason: escalationReason,
          note: escalationNote
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Escalation response:', response.data);

      if (response.data.success) {
        // Update selected issue status
        setSelectedIssue({
          ...selectedIssue,
          status: 'escalated'
        });

        // Update issues list
        setIssues(
          issues.map(issue =>
            issue.id === selectedIssue.id
              ? { ...issue, status: 'escalated' }
              : issue
          )
        );

        // Show success
        setShowEscalationModal(false);
        alert('✅ Issue escalated successfully to higher authority');
        console.log('✅ Issue escalated');

        // Refresh
        setTimeout(() => {
          fetchIssues();
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to escalate issue');
      }
    } catch (err) {
      console.error('Error escalating issue:', err);
      setError(err.response?.data?.message || 'Failed to escalate issue: ' + err.message);
    } finally {
      setEscalating(false);
    }
  };

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
      {!selectedIssue && (
        <>
          <div className="dashboard-header">
            <div className="header-left">
              <h1>My Issues</h1>
              <p className="header-subtitle">Track and manage your reported issues</p>
            </div>
            <div className="header-right">
              <button onClick={handleRaiseIssue} className="btn-primary">
                + Raise New Issue
              </button>
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

          {issues.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"></path>
              </svg>
              <h2>No issues found</h2>
              <p>You haven't reported any issues yet. Start by reporting one!</p>
              <button onClick={handleRaiseIssue} className="btn-primary">
                Report Your First Issue
              </button>
            </div>
          ) : (
            <div className="issues-list">
              {issues.map(issue => {
                const timeline = getTimelineForCategory(issue.category);
                const priorityColor = getPriorityColor(timeline.priority);
                
                return (
                  <div
                    key={issue.id}
                    className={`issue-card ${issue.status === 'escalated' ? 'escalated-card' : ''}`}
                    onClick={() => handleViewIssue(issue.id)}
                    style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Timeline Badge in corner */}
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

                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>
                          {issue.category}
                        </h3>
                        <span className={`status-badge status-${issue.status.replace(' ', '-').replace('_', '-')}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ color: '#666', fontWeight: '500' }}>
                            ⏳ Response: <strong>{timeline.hours}h</strong>
                          </span>
                          <span style={{ color: '#666', fontWeight: '500' }}>
                            🎯 Resolution: <strong>{timeline.resolution}h</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #f0f0f0',
                        fontSize: '0.8rem',
                        color: '#999'
                      }}>
                        <span>📅 {new Date(issue.created_at).toLocaleDateString()}</span>
                        <span style={{ fontWeight: '600', color: '#667eea' }}>ID: #{issue.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && !showEscalationModal && (
        <div className="issue-details-modal" onClick={handleCloseDetails}>
          <div 
            className="issue-details-container" 
            onClick={(e) => e.stopPropagation()}
          >
            {issueDetailsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading details...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div className="issue-details-header">
                    <h2>{selectedIssue.category}</h2>
                    <span className={`status-badge status-${selectedIssue.status.replace(' ', '-').replace('_', '-')}`}>
                      {selectedIssue.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <button className="close-btn" onClick={handleCloseDetails} style={{ margin: 0 }}>
                    ✕
                  </button>
                </div>
                
                {error && (
                  <div style={{ color: '#e74c3c', marginBottom: '1rem', padding: '0.75rem', background: '#fadbd8', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Timeline Info Box */}
                {(() => {
                  const timeline = getTimelineForCategory(selectedIssue.category);
                  const priorityColor = getPriorityColor(timeline.priority);
                  const issueAgeHours = (new Date() - new Date(selectedIssue.created_at)) / (1000 * 60 * 60);
                  const ageDays = Math.floor(issueAgeHours / 24);
                  const ageHours = Math.floor(issueAgeHours % 24);
                  
                  return (
                    <div style={{
                      marginBottom: '2rem',
                      background: '#f0f7ff',
                      border: `2px solid ${priorityColor}`,
                      borderRadius: '8px',
                      padding: '1.5rem',
                      borderLeft: `4px solid ${priorityColor}`
                    }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: priorityColor, fontSize: '1rem', fontWeight: '700' }}>
                        ⏱️ Response Timeline & Expectations
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', borderLeft: `3px solid ${priorityColor}` }}>
                          <small style={{ display: 'block', color: '#666', fontWeight: '600', marginBottom: '0.5rem' }}>
                            📊 Priority
                          </small>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: priorityColor, textTransform: 'uppercase' }}>
                            {timeline.priority}
                          </span>
                        </div>
                        
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', borderLeft: `3px solid ${priorityColor}` }}>
                          <small style={{ display: 'block', color: '#666', fontWeight: '600', marginBottom: '0.5rem' }}>
                            ⏳ Expected Response
                          </small>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: priorityColor }}>
                            {timeline.hours} hours
                          </span>
                        </div>
                        
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', borderLeft: `3px solid ${priorityColor}` }}>
                          <small style={{ display: 'block', color: '#666', fontWeight: '600', marginBottom: '0.5rem' }}>
                            🎯 Expected Resolution
                          </small>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: priorityColor }}>
                            {timeline.resolution} hours
                          </span>
                        </div>
                        
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', borderLeft: `3px solid ${priorityColor}` }}>
                          <small style={{ display: 'block', color: '#666', fontWeight: '600', marginBottom: '0.5rem' }}>
                            📅 Issue Age
                          </small>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#666' }}>
                            {ageDays}d {ageHours}h
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ padding: '0.75rem', background: 'white', borderRadius: '6px', fontSize: '0.85rem', color: '#555', lineHeight: '1.6' }}>
                        <strong style={{ color: priorityColor }}>ℹ️ What to expect:</strong><br/>
                        • Officials should acknowledge within <strong>24 hours</strong><br/>
                        • Work should start within <strong>{timeline.hours} hours</strong><br/>
                        • Complete resolution expected within <strong>{timeline.resolution} hours</strong><br/>
                        • If no action: You can escalate to higher authority
                      </div>
                    </div>
                  );
                })()}
                
                <div className="issue-details-content">
                  <div className="detail-row">
                    <label>Issue ID:</label>
                    <span>#{selectedIssue.id}</span>
                  </div>

                  <div className="detail-row">
                    <label>Created Date:</label>
                    <span>{new Date(selectedIssue.created_at).toLocaleString()}</span>
                  </div>

                  <div className="detail-row">
                    <label>Last Updated:</label>
                    <span>{new Date(selectedIssue.updated_at).toLocaleString()}</span>
                  </div>

                  <div className="detail-row full-width">
                    <label>Description:</label>
                    <p className="description-text">{selectedIssue.description}</p>
                  </div>

                  {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                    <div className="detail-row full-width">
                      <label>Attachments ({selectedIssue.attachments.length}):</label>
                      <div className="attachments-container">
                        {selectedIssue.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="attachment-item"
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                          >
                            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <div className="attachment-info">
                              <span className="attachment-name">{attachment.filename}</span>
                              <span className="attachment-type">{attachment.mimetype}</span>
                            </div>
                            <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Escalation Button */}
                {['created', 'in_progress'].includes(selectedIssue.status) && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #ddd' }}>
                    <button
                      onClick={() => setShowEscalationModal(true)}
                      style={{
                        padding: '0.85rem 1.5rem',
                        background: '#e67e22',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        width: '100%',
                        transition: 'all 0.3s'
                      }}
                    >
                      ⚠️ Escalate to Higher Authority
                    </button>
                  </div>
                )}

                <div className="issue-details-footer">
                  <button onClick={handleCloseDetails} className="btn-secondary">
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalationModal && selectedIssue && (
        <div className="issue-details-modal" onClick={() => setShowEscalationModal(false)}>
          <div 
            className="issue-details-container" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Escalate Issue</h2>
              <button className="close-btn" onClick={() => setShowEscalationModal(false)} style={{ margin: 0 }}>
                ✕
              </button>
            </div>

            {error && (
              <div style={{ color: '#e74c3c', marginBottom: '1rem', padding: '0.75rem', background: '#fadbd8', borderRadius: '8px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.75rem' }}>
                Reason for Escalation <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <select
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                disabled={escalating}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select Reason --</option>
                <option value="no_response">Official Not Responding</option>
                <option value="no_progress">No Progress Being Made</option>
                <option value="urgent">Urgent/Critical Issue</option>
                <option value="not_assigned">Issue Not Assigned Yet</option>
                <option value="other">Other Reason</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.75rem' }}>
                Additional Details <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <textarea
                value={escalationNote}
                onChange={(e) => setEscalationNote(e.target.value)}
                disabled={escalating}
                placeholder="Explain why escalation is needed..."
                maxLength={1000}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  minHeight: '100px',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
              <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
                {escalationNote.length}/1000 characters
              </small>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleEscalate}
                disabled={escalating || !escalationReason || !escalationNote.trim()}
                style={{
                  flex: 1,
                  padding: '0.85rem 1.5rem',
                  background: escalating || !escalationReason || !escalationNote.trim() ? '#ccc' : '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: escalating ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                {escalating ? '⏳ Escalating...' : '✓ Escalate Now'}
              </button>
              <button
                onClick={() => setShowEscalationModal(false)}
                disabled={escalating}
                style={{
                  flex: 1,
                  padding: '0.85rem 1.5rem',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
