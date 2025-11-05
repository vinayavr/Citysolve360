import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import issueService from '../services/issueService';
import { formatDateTime, getStatusColor, getCategoryIcon } from '../utils/helpers';
import { ISSUE_STATUSES } from '../utils/constants';
import '../styles/IssueDetail.css';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  const fetchIssueDetail = async () => {
    try {
      setLoading(true);
      const response = await issueService.getIssue(id);
      
      if (response.success) {
        setIssue(response.issue);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to load issue details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      setAlert({
        type: 'error',
        message: 'Please select a status'
      });
      return;
    }

    try {
      setUpdating(true);
      const response = await issueService.updateIssueStatus(id, {
        status: newStatus,
        resolution_notes: resolutionNotes
      });

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Status updated successfully'
        });
        setShowStatusModal(false);
        fetchIssueDetail();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update status'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Loader fullScreen />
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <Header />
        <div className="page-content">
          <div className="empty-state">
            <h3>Issue Not Found</h3>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const beforeImages = typeof issue.before_images === 'string' 
    ? JSON.parse(issue.before_images || '[]')
    : issue.before_images || [];

  const afterImages = typeof issue.after_images === 'string'
    ? JSON.parse(issue.after_images || '[]')
    : issue.after_images || [];

  const statusColor = getStatusColor(issue.status);
  const categoryIcon = getCategoryIcon(issue.category);

  return (
    <>
      <Header />
      <div className="page-content">
        <div className="issue-detail-container">
          {/* Back Button */}
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          {alert && (
            <Alert 
              type={alert.type} 
              message={alert.message} 
              onClose={() => setAlert(null)}
            />
          )}

          {/* Issue Header */}
          <div className="issue-detail-header">
            <div className="issue-meta-badges">
              <span className="category-badge-large">
                {categoryIcon} {issue.category}
              </span>
              <span 
                className="status-badge-large"
                style={{ 
                  background: `${statusColor}20`,
                  color: statusColor,
                  borderColor: statusColor
                }}
              >
                {issue.status.replace('_', ' ')}
              </span>
              {issue.priority && (
                <span className={`priority-badge-large priority-${issue.priority}`}>
                  {issue.priority.toUpperCase()}
                </span>
              )}
            </div>

            <h1>{issue.title}</h1>
            
            <div className="issue-info-row">
              <div className="info-item">
                <span className="info-icon">📅</span>
                <span>Reported on {formatDateTime(issue.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">👤</span>
                <span>By {issue.citizen_name || 'Anonymous'}</span>
              </div>
              {issue.updated_at !== issue.created_at && (
                <div className="info-item">
                  <span className="info-icon">🔄</span>
                  <span>Updated {formatDateTime(issue.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="issue-detail-content">
            {/* Left Column */}
            <div className="detail-main">
              {/* Description */}
              <div className="detail-section">
                <h3>Description</h3>
                <p className="issue-description-full">{issue.description}</p>
              </div>

              {/* Before Images */}
              {beforeImages.length > 0 && (
                <div className="detail-section">
                  <h3>Issue Images ({beforeImages.length})</h3>
                  <div className="image-gallery">
                    {beforeImages.map((image, index) => (
                      <div key={index} className="gallery-image">
                        <img 
                          src={image.url} 
                          alt={`Issue ${index + 1}`}
                          onClick={() => window.open(image.url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* After Images (if resolved) */}
              {afterImages.length > 0 && (
                <div className="detail-section">
                  <h3>Resolution Images ({afterImages.length})</h3>
                  <div className="image-gallery">
                    {afterImages.map((image, index) => (
                      <div key={index} className="gallery-image">
                        <img 
                          src={image.url} 
                          alt={`Resolution ${index + 1}`}
                          onClick={() => window.open(image.url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {issue.resolution_notes && (
                <div className="detail-section resolution-section">
                  <h3>Resolution Notes</h3>
                  <p>{issue.resolution_notes}</p>
                  {issue.resolved_at && (
                    <p className="resolution-date">
                      Resolved on {formatDateTime(issue.resolved_at)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="detail-sidebar">
              {/* Location Card */}
              <div className="sidebar-card">
                <h4>📍 Location Details</h4>
                <div className="location-info">
                  <p><strong>Address:</strong></p>
                  <p>{issue.location_address}</p>
                  
                  {issue.landmark && (
                    <>
                      <p><strong>Landmark:</strong></p>
                      <p>{issue.landmark}</p>
                    </>
                  )}
                  
                  {issue.ward_number && (
                    <>
                      <p><strong>Ward:</strong></p>
                      <p>{issue.ward_number}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Assignment Card (for officials) */}
              {user?.role === 'official' && (
                <div className="sidebar-card">
                  <h4>👮 Assignment</h4>
                  {issue.assigned_to ? (
                    <div className="assignment-info">
                      <p><strong>Assigned to:</strong></p>
                      <p>{issue.assigned_official_name}</p>
                    </div>
                  ) : (
                    <p className="text-muted">Not yet assigned</p>
                  )}
                </div>
              )}

              {/* Actions Card (for officials) */}
              {user?.role === 'official' && (
                <div className="sidebar-card actions-card">
                  <h4>⚙️ Actions</h4>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setShowStatusModal(true);
                      setNewStatus(issue.status);
                    }}
                  >
                    Update Status
                  </button>
                </div>
              )}

              {/* Issue ID Card */}
              <div className="sidebar-card">
                <h4>🆔 Issue ID</h4>
                <p className="issue-id-code">#{String(issue.id).padStart(6, '0')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Update Issue Status</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowStatusModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="status">New Status</label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-control"
                  >
                    {ISSUE_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Resolution Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about the resolution..."
                    rows="4"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={updating}
                >
                  {updating ? <Loader size="small" /> : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IssueDetail;