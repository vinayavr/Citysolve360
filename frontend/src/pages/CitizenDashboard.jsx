import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CitizenDashboard.css';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDetailsLoading, setIssueDetailsLoading] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

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
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
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
        console.log(`Attachments count: ${response.data.data.attachments?.length || 0}`);
        console.log('Attachments data:', response.data.data.attachments);
        setSelectedIssue(response.data.data);
        setError(''); // Clear any previous errors
      } else {
        setError('Failed to load issue details: ' + response.data.message);
        console.error('API Error:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching issue details:', err);
      console.error('Error response:', err.response?.data);
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
          
          console.log(`Downloading attachment ${attachmentId}: ${filename}`);
          
          const response = await axios.get(
            `http://localhost:5000/api/issues/attachment/${attachmentId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              },
              responseType: 'blob' // Important: get response as blob
            }
          );

          // Create a blob URL and trigger download
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
        setError('Failed to download attachment: ' + (err.response?.data?.message || err.message));
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
      {/* Main Dashboard View */}
      {!selectedIssue && (
        <>
          <div className="dashboard-header">
            <h1>My Issues</h1>
            <div className="header-actions">
              <button
                onClick={handleRaiseIssue}
                className="btn-raise-issue"
              >
                + Raise New Issue
              </button>
              <button
                onClick={handleLogout}
                className="btn-logout"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {issues.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"></path>
              </svg>
              <p>No issues raised yet</p>
              <button onClick={handleRaiseIssue} className="btn-primary">
                Report Your First Issue
              </button>
            </div>
          ) : (
            <div className="issues-list">
              {issues.map(issue => (
                <div
                  key={issue.id}
                  className="issue-card"
                  onClick={() => handleViewIssue(issue.id)}
                >
                  <div className="issue-header">
                    <h3>{issue.category}</h3>
                    <span className={`status-badge status-${issue.status.replace(' ', '-')}`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="issue-description">{issue.description}</p>
                  <div className="issue-footer">
                    <small>{new Date(issue.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="issue-details-modal" onClick={handleCloseDetails}>
          <div 
            className="issue-details-container" 
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={handleCloseDetails}>
              ✕
            </button>
            
            {issueDetailsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading details...</p>
              </div>
            ) : (
              <>
                <div className="issue-details-header">
                  <h2>{selectedIssue.category}</h2>
                  <span className={`status-badge status-${selectedIssue.status.replace(' ', '-')}`}>
                    {selectedIssue.status}
                  </span>
                </div>
                
                <div className="issue-details-content">
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

                  {(!selectedIssue.attachments || selectedIssue.attachments.length === 0) && (
                    <div className="detail-row full-width">
                      <label>Attachments:</label>
                      <p className="no-attachments">No attachments</p>
                    </div>
                  )}
                </div>

                <div className="issue-details-footer">
                  <button
                    onClick={handleCloseDetails}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
