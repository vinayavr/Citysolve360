import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommentSection = ({ issueId, onActionComplete }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [issueId]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/issues/${issueId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setComments(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  // Validation function
  const validateForm = () => {
    if (!comment.trim()) {
      setError('Note is required. Please add a note before proceeding.');
      return false;
    }
    if (comment.trim().length < 10) {
      setError('Note must be at least 10 characters long.');
      return false;
    }
    return true;
  };

  const handleActionButton = async (status) => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', status);
      formData.append('comment', comment.trim());

      // Add attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      console.log(`Submitting action: ${status} for issue ${issueId}`);
      const response = await axios.post(
        `http://localhost:5000/api/issues/${issueId}/comment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Action response:', response.data);

      if (response.data.success) {
        setComment('');
        setAttachments([]);
        setError('');
        const fileInput = document.getElementById(`file-input-${issueId}`);
        if (fileInput) fileInput.value = '';

        // Show styled success message
        const statusText = status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
        setSuccess(`✅ Issue successfully marked as: ${statusText}`);
        console.log('✅ Action completed successfully');

        // Call completion handler
        if (onActionComplete) {
          onActionComplete(status);
        }

        // ⭐ FIXED: Reload page instead of navigating away
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to process action');
      }
    } catch (err) {
      console.error('Error processing action:', err);
      setError(err.response?.data?.message || 'Failed to process action: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
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

      {success && (
        <div style={{
          color: '#27ae60',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: '#d5f4e6',
          borderRadius: '8px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📝 Add Comment & Action</h3>
        
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add your comment (min 10 characters)"
          disabled={submitting}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            marginBottom: '1rem'
          }}
        />

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            📎 Attachments (Optional)
          </label>
          <input
            id={`file-input-${issueId}`}
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={submitting}
            style={{ display: 'block', marginBottom: '0.5rem' }}
          />
          {attachments.length > 0 && (
            <small style={{ color: '#666' }}>
              {attachments.length} file(s) selected
            </small>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={() => handleActionButton('in progress')}
            disabled={submitting}
            style={{
              padding: '0.75rem',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {submitting ? '⏳ Processing...' : '▶️ In Progress'}
          </button>

          <button
            onClick={() => handleActionButton('completed')}
            disabled={submitting}
            style={{
              padding: '0.75rem',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {submitting ? '⏳ Processing...' : '✅ Complete'}
          </button>

          <button
            onClick={() => handleActionButton('rejected')}
            disabled={submitting}
            style={{
              padding: '0.75rem',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {submitting ? '⏳ Processing...' : '❌ Reject'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem', borderTop: '2px solid #f0f0f0', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>💬 Comments</h3>
        {loading ? (
          <p>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: '#999' }}>No comments yet</p>
        ) : (
          comments.map((cmt, index) => (
            <div
              key={index}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f9f9f9',
                borderRadius: '8px',
                borderLeft: '4px solid #3498db'
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#333' }}>{cmt.comment_text}</strong>
              </div>
              <small style={{ color: '#999' }}>
                {new Date(cmt.created_at).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
