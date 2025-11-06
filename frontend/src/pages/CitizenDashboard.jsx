import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CitizenDashboard.css';
const CitizenDashboard = () => {
  // ✅ All states initialized with safe defaults
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch issues
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/issues/my-issues',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // ✅ Always ensure issues is an array
      if (response.data.success) {
        setIssues(response.data.data || []);
      } else {
        setError(response.data.message);
        setIssues([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Error fetching issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe rendering - no undefined errors
  return (
    <div className="citizen-dashboard">
      <h1>Welcome, {user?.name || 'User'}</h1>
      
      {loading && <div className="loading">Loading issues...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && (
        <>
          <div className="issues-header">
            <h2>My Issues ({issues.length})</h2>
            <button onClick={() => window.location.href = '/create-issue'}>
              Report New Issue
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="no-issues">
              <p>You haven't reported any issues yet.</p>
              <button onClick={() => window.location.href = '/create-issue'}>
                Create Your First Issue
              </button>
            </div>
          ) : (
            <div className="issues-grid">
              {issues.map((issue) => (
                <div key={issue.id} className="issue-card">
                  <div className="issue-header">
                    <h3>{issue.title}</h3>
                    <span className={`status ${issue.status}`}>{issue.status}</span>
                  </div>
                  <p className="description">{issue.description}</p>
                  <div className="issue-meta">
                    <span><strong>Category:</strong> {issue.category_name}</span>
                    <span><strong>Priority:</strong> {issue.priority}</span>
                    <span><strong>Created:</strong> {new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CitizenDashboard;
