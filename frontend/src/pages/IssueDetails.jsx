import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from '../components/commentsection';
import './Dashboard.css';

const IssueDetails = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationNote, setEscalationNote] = useState('');
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

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

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/issues/${issueId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setIssue(response.data.data);
      } else {
        setError('Failed to load issue details');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/issues/attachment/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download attachment');
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim() || escalationNote.trim().length < 10) {
      setError('Please fill all fields correctly (min 10 characters)');
      return;
    }

    try {
      setEscalating(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `http://localhost:5000/api/issues/${issue.id}/escalate`,
        { reason: escalationReason, note: escalationNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setIssue({ ...issue, status: 'escalated' });
        setShowEscalationModal(false);
        setEscalationReason('');
        setEscalationNote('');
        
        // 🎨 BEAUTIFUL SUCCESS ALERT
        Swal.fire({
          icon: 'success',
          title: '✅ Escalated Successfully!',
          html: `
            <div style="text-align: left; line-height: 1.8;">
              <p><strong>Issue #${issue.id}</strong> has been escalated.</p>
              <p style="color: #666; font-size: 0.9rem; margin: 10px 0;">
                📊 Category: <strong>${issue.category}</strong><br/>
                ⏰ Priority: <strong>HIGH</strong><br/>
                👤 Assigned to: <strong>Higher Official</strong>
              </p>
              <p style="color: #27ae60; margin-top: 15px;">
                ✓ Your escalation has been recorded and will be reviewed shortly.
              </p>
            </div>
          `,
          confirmButtonColor: '#667eea',
          confirmButtonText: 'Okay',
          timer: 4000,
          timerProgressBar: true,
          allowOutsideClick: false
        });
        
        setTimeout(() => fetchIssueDetails(), 1000);
      } else {
        setError(response.data.message || 'Failed to escalate');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to escalate');
    } finally {
      setEscalating(false);
    }
  };

  const handleBack = () => navigate(-1);

  // Check if locked
  const isLocked = issue && ['completed', 'rejected'].includes(issue.status);

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="dashboard-container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button onClick={handleBack} className="btn-secondary">← Back</button>
          <div className="error-message"><strong>Error:</strong> {error || 'Issue not found'}</div>
        </div>
      </div>
    );
  }

  const timeline = getTimelineForCategory(issue.category);
  const priorityColor = getPriorityColor(timeline.priority);
  const issueAgeHours = (new Date() - new Date(issue.created_at)) / (1000 * 60 * 60);
  const ageDays = Math.floor(issueAgeHours / 24);
  const ageHours = Math.floor(issueAgeHours % 24);

  return (
    <div className="dashboard-container">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <button onClick={handleBack} className="btn-secondary" style={{ fontWeight: '600' }}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className={`status-badge status-${issue.status.replace('_', '-')}`}>
              {issue.status.replace('_', ' ').toUpperCase()}
            </span>
            {isLocked && (
              <span style={{
                background: '#f39c12',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                🔒 LOCKED
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '15px', padding: '2rem', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)' }}>
          {/* Issue Header */}
          <div style={{ marginBottom: '2rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '1.5rem' }}>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '2rem', fontWeight: '700' }}>
              {issue.category}
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
              Issue #{issue.id} • Created {new Date(issue.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Timeline Info Box */}
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
                  📊 Priority Level
                </small>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: priorityColor, textTransform: 'uppercase' }}>
                  {timeline.priority}
                </span>
              </div>
              
              <div style={{ background: 'white', padding: '1rem', borderRadius: '6px', borderLeft: `3px solid ${priorityColor}` }}>
                <small style={{ display: 'block', color: '#666', fontWeight: '600', marginBottom: '0.5rem' }}>
                  ⏳ Expected Response Time
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

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                Issue ID
              </label>
              <span style={{ color: '#666', fontSize: '0.95rem' }}>#{issue.id}</span>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                Citizen ID
              </label>
              <span style={{ color: '#666', fontSize: '0.95rem' }}>{issue.citizen_id}</span>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                Created Date
              </label>
              <span style={{ color: '#666', fontSize: '0.95rem' }}>
                {new Date(issue.created_at).toLocaleString()}
              </span>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                Last Updated
              </label>
              <span style={{ color: '#666', fontSize: '0.95rem' }}>
                {new Date(issue.updated_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '1.5rem' }}>
            <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.75rem', fontSize: '1rem' }}>
              Description
            </label>
            <p style={{
              color: '#555',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              fontSize: '0.95rem'
            }}>
              {issue.description}
            </p>
          </div>

          {/* Attachments */}
          {issue.attachments && issue.attachments.length > 0 && (
            <div style={{ marginBottom: '2rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '1.5rem' }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '1rem', fontSize: '1rem' }}>
                📎 Attachments ({issue.attachments.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {issue.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="attachment-item"
                    onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                    style={{
                      cursor: 'pointer',
                      padding: '0.75rem',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '600', color: '#333' }}>{attachment.filename}</span>
                      <small style={{ display: 'block', color: '#999', marginTop: '0.25rem' }}>{attachment.mimetype}</small>
                    </div>
                    <span style={{ color: '#667eea', fontWeight: '600' }}>⬇️</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Button - Only for CITIZENS with created/in progress status & not locked */}
          {['created', 'in progress'].includes(issue.status) && !isLocked && userRole === 'citizen' && (
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
                  width: '100%'
                }}
              >
                ⚠️ Escalate to Higher Authority
              </button>
            </div>
          )}

          {/* Comments Section */}
          {!isLocked ? (
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ color: '#333', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                📝 Take Action
              </h2>
              <CommentSection issueId={issue.id} onActionComplete={() => fetchIssueDetails()} />
            </div>
          ) : (
            <div style={{
              marginTop: '2rem',
              background: '#fef5e7',
              border: '1px solid #f9e79f',
              color: '#7d6608',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #f39c12',
              fontWeight: '500'
            }}>
              🔒 <strong>Issue Locked:</strong> This issue has been {issue.status.replace('_', ' ')} and cannot be modified.
            </div>
          )}
        </div>

        {/* Escalation Modal */}
        {showEscalationModal && (
          <div className="issue-details-modal" onClick={() => setShowEscalationModal(false)}>
            <div
              className="issue-details-container"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '600px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Escalate Issue</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowEscalationModal(false)}
                  style={{ margin: 0, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {error && (
                <div style={{
                  color: '#e74c3c',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: '#fadbd8',
                  borderRadius: '8px'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Reason Dropdown */}
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

              {/* Note TextArea */}
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
                    border: escalationNote.trim().length < 10 ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    minHeight: '100px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
                <small style={{
                  color: escalationNote.trim().length < 10 ? '#e74c3c' : '#999',
                  marginTop: '0.5rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  {escalationNote.length}/1000 characters {escalationNote.trim().length < 10 && '(min 10 required)'}
                </small>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleEscalate}
                  disabled={escalating || !escalationReason || escalationNote.trim().length < 10}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1.5rem',
                    background: escalating || !escalationReason || escalationNote.trim().length < 10 ? '#ccc' : '#e67e22',
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

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={handleBack} className="btn-secondary" style={{ fontWeight: '600' }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
