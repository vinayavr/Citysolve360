import React from 'react';
import IssueCard from './IssueCard';
import '../../styles/IssueList.css';

const IssueList = ({ issues, onIssueClick }) => {
  return (
    <div className="issue-list">
      {issues.map(issue => (
        <IssueCard 
          key={issue.id} 
          issue={issue}
          onClick={() => onIssueClick(issue.id)}
        />
      ))}
    </div>
  );
};

export default IssueList;