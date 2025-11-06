import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import './IssueDetails.css';

const IssueDetails = () => {
  const { issueId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isOfficial = user.role === 'official' || user.role === 'higherofficial';
  const isCitizen = user.role === 'citizen';
  const showEscalate = searchParams.get('action') === 'escalate';

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    try {
      const response = await api.get(`/issues/${issueId}`);
      setIssue(response.data.issue);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch issue details');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }
    setFiles(selectedFiles);
  };

  const handleStatusUpdate = async (action) => {
    if (!comment.trim()) {
      alert('Comment is mandatory for status update');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('action', action);
      formData.append('comment', comment);

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.put(`/issues/${issueId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(`Issue ${action}d successfully!`);
      navigate(user.role === 'higherofficial' ? '/higher-official/dashboard' : '/official/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!comment.trim()) {
      alert('Comment is mandatory for escalation');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('comment', comment);

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post(`/issues/${issueId}/escalate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Issue escalated successfully!');
      navigate('/citizen/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to escalate issue');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'created': 'status-badge status-created',
      'in progress': 'status-badge status-progress',
      'escalated': 'status-badge status-escalated',
      'completed': 'status-badge status-completed',
      'rejected': 'status-badge status-rejected'
    };
    return classes[status] || 'status-badge';
  };

  const isLocked = issue?.status === 'rejected' || issue?.status === 'completed';

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="issue-details-container">
          <div className="loading">Loading issue details...</div>
        </div>
      </>
    );
  }

  if (error || !issue) {
    return (
      <>
        <Navbar />
        <div className="issue-details-container">
          <div className="error-message">{error || 'Issue not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="issue-details-container">
        <div className="issue-details-card">
          <div className="issue-header">
            <div>
              <h1>Issue #{issue.id}</h1>
              <span className={getStatusBadgeClass(issue.status)}>
                {issue.status.toUpperCase()}
              </span>
            </div>
            <button className="btn-back" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          <div className="issue-section">
            <h2>📋 Issue Details</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Category:</strong> {issue.category}
              </div>
              <div className="detail-item">
                <strong>Created:</strong> {new Date(issue.created_at).toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>Citizen:</strong> {issue.citizen_name}
              </div>
              <div className="detail-item">
                <strong>Phone:</strong> {issue.phone}
              </div>
            </div>
            <div className="detail-item full-width">
              <strong>Description:</strong>
              <p>{issue.description}</p>
            </div>
          </div>

          {issue.attachments && issue.attachments.length > 0 && (
            <div className="issue-section">
              <h2>📎 Attachments</h2>
              <div className="attachments-grid">
                {issue.attachments.map((att) => (
                  <div key={att.id} className="attachment-item">
                    <span>📄 {att.filename}</span>
                    <button className="btn-download">Download</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {issue.comments && issue.comments.length > 0 && (
            <div className="issue-section">
              <h2>💬 Comments History</h2>
              <div className="comments-list">
                {issue.comments.map((comm) => (
                  <div key={comm.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{comm.user_name}</strong>
                      <span className="comment-role">({comm.user_role})</span>
                      <span className="comment-time">
                        {new Date(comm.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="comment-text">{comm.comment}</p>
                    {comm.attachments && comm.attachments.length > 0 && (
                      <div className="comment-attachments">
                        {comm.attachments.map((att) => (
                          <span key={att.id} className="attachment-badge">
                            📎 {att.filename}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOfficial && !isLocked && (
            <div className="issue-section action-section">
              <h2>⚡ Take Action</h2>
              <div className="form-group">
                <label>Comment (Required) *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comment..."
                  rows="4"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Attachments (Optional)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  multiple
                  disabled={submitting}
                />
                {files.length > 0 && (
                  <div className="file-preview">
                    {files.map((file, idx) => (
                      <span key={idx} className="file-badge">📎 {file.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button
                  className="btn-save"
                  onClick={() => handleStatusUpdate('save')}
                  disabled={submitting}
                >
                  💾 Save (In Progress)
                </button>
                <button
                  className="btn-complete"
                  onClick={() => handleStatusUpdate('complete')}
                  disabled={submitting}
                >
                  ✅ Complete
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleStatusUpdate('reject')}
                  disabled={submitting}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          )}

          {isCitizen && showEscalate && issue.status === 'created' && (
            <div className="issue-section action-section">
              <h2>⬆️ Escalate Issue</h2>
              <p className="warning-text">
                This issue will be escalated to the higher official
              </p>

              <div className="form-group">
                <label>Escalation Reason (Required) *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explain why you are escalating this issue..."
                  rows="4"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Attachments (Optional)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  multiple
                  disabled={submitting}
                />
              </div>

              <div className="action-buttons">
                <button
                  className="btn-escalate-action"
                  onClick={handleEscalate}
                  disabled={submitting}
                >
                  ⬆️ Escalate Issue
                </button>
              </div>
            </div>
          )}

          {isLocked && (
            <div className="locked-message">
              🔒 This issue is {issue.status} and cannot be modified.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IssueDetails;
