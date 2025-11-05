import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import IssueCard from '../components/issues/IssueCard';
import issueService from '../services/issueService';
import { ISSUE_STATUSES } from '../utils/constants';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [filter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch issues based on role
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await issueService.getIssues(params);
      
      if (response.success) {
        setRecentIssues(response.issues.slice(0, 6)); // Get first 6 issues
        
        // Calculate stats
        const allIssues = response.issues;
        setStats({
          total: allIssues.length,
          pending: allIssues.filter(i => i.status === 'pending').length,
          in_progress: allIssues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length,
          resolved: allIssues.filter(i => i.status === 'resolved').length
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div className="stat-card" style={{ borderTopColor: color }} onClick={onClick}>
      <div className="stat-icon" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Header />
        <Loader fullScreen />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p className="dashboard-subtitle">
              {user?.role === 'citizen' 
                ? 'Track and manage your reported issues' 
                : 'Manage and resolve citizen issues'}
            </p>
          </div>
          {user?.role === 'citizen' && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/report-issue')}
            >
              <span>➕</span> Report New Issue
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Issues"
            value={stats.total}
            icon="📊"
            color="#2196f3"
            onClick={() => setFilter('all')}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon="⏳"
            color="#ff9800"
            onClick={() => setFilter('pending')}
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            icon="🔄"
            color="#9c27b0"
            onClick={() => setFilter('in_progress')}
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon="✅"
            color="#4caf50"
            onClick={() => setFilter('resolved')}
          />
        </div>

        {/* Filter Tabs */}
        <div className="dashboard-filters">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Issues
          </button>
          {ISSUE_STATUSES.map(status => (
            <button
              key={status.value}
              className={`filter-tab ${filter === status.value ? 'active' : ''}`}
              onClick={() => setFilter(status.value)}
              style={filter === status.value ? { borderBottomColor: status.color } : {}}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Recent Issues */}
        <div className="dashboard-content">
          <div className="section-header">
            <h2>
              {filter === 'all' ? 'Recent Issues' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Issues`}
            </h2>
            <button 
              className="btn-link"
              onClick={() => navigate(user?.role === 'citizen' ? '/my-issues' : '/dashboard')}
            >
              View All →
            </button>
          </div>

          {recentIssues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Issues Found</h3>
              <p>
                {user?.role === 'citizen' 
                  ? 'You haven\'t reported any issues yet. Start by reporting your first issue!'
                  : 'No issues match the current filter.'}
              </p>
              {user?.role === 'citizen' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/report-issue')}
                >
                  Report Your First Issue
                </button>
              )}
            </div>
          ) : (
            <div className="issues-grid">
              {recentIssues.map(issue => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;