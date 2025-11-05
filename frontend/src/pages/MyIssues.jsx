import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import IssueList from '../components/issues/IssueList';
import Loader from '../components/common/Loader';
import issueService from '../services/issueService';
import { ISSUE_STATUSES } from '../utils/constants';
import '../styles/Pages.css';

const MyIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchMyIssues();
  }, [filter, sortBy]);

  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter !== 'all') {
        params.status = filter;
      }
      
      params.sortBy = sortBy;

      const response = await issueService.getIssues(params);
      
      if (response.success) {
        setIssues(response.issues);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = (issueId) => {
    navigate(`/issues/${issueId}`);
  };

  return (
    <>
      <Header />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>My Reported Issues</h1>
            <p>Track the status of all your reported issues</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/report-issue')}
          >
            <span>➕</span> Report New Issue
          </button>
        </div>

        {/* Filters and Sort */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {ISSUE_STATUSES.map(status => (
                <button
                  key={status.value}
                  className={`filter-btn ${filter === status.value ? 'active' : ''}`}
                  onClick={() => setFilter(status.value)}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-group">
            <label htmlFor="sortBy">Sort by:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="loading-container">
            <Loader />
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Issues Found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't reported any issues yet."
                : `No issues with status "${filter}"`}
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/report-issue')}
            >
              Report Your First Issue
            </button>
          </div>
        ) : (
          <IssueList issues={issues} onIssueClick={handleIssueClick} />
        )}
      </div>
    </>
  );
};

export default MyIssues;