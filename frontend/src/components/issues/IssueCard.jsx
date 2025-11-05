import React from 'react';
import { formatDate, getStatusColor, getCategoryIcon } from '../../utils/helpers';
import '../../styles/IssueCard.css';

const IssueCard = ({ issue, onClick }) => {
  const statusColor = getStatusColor(issue.status);
  const categoryIcon = getCategoryIcon(issue.category);
  
  // Parse images if they're stored as JSON string
  const beforeImages = typeof issue.before_images === 'string' 
    ? JSON.parse(issue.before_images || '[]')
    : issue.before_images || [];

  return (
    <div className="issue-card" onClick={onClick}>
      {/* Image Section */}
      {beforeImages.length > 0 && (
        <div className="issue-card-image">
          <img 
            src={beforeImages[0].url} 
            alt={issue.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
            }}
          />
          {beforeImages.length > 1 && (
            <div className="image-count">
              +{beforeImages.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="issue-card-content">
        <div className="issue-card-header">
          <span className="category-badge">
            {categoryIcon} {issue.category}
          </span>
          <span 
            className="status-badge" 
            style={{ 
              background: `${statusColor}20`,
              color: statusColor,
              borderColor: statusColor
            }}
          >
            {issue.status.replace('_', ' ')}
          </span>
        </div>

        <h3 className="issue-title">{issue.title}</h3>
        
        <p className="issue-description">
          {issue.description.length > 100 
            ? `${issue.description.substring(0, 100)}...` 
            : issue.description}
        </p>

        <div className="issue-meta">
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <span className="meta-text">{issue.location_address}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <span className="meta-text">{formatDate(issue.created_at)}</span>
          </div>
        </div>

        {issue.priority && (
          <div className="priority-indicator">
            <span className={`priority-badge priority-${issue.priority}`}>
              {issue.priority === 'urgent' && '🔴'}
              {issue.priority === 'high' && '🟠'}
              {issue.priority === 'medium' && '🟡'}
              {issue.priority === 'low' && '🟢'}
              {' '}{issue.priority.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCard;