import React from "react";
import { useParams } from "react-router-dom";

function IssueDetails() {
  const { id } = useParams();
  return (
    <div className="page-container">
      <h2>Issue Details (#{id})</h2>
      <p>Issue details view coming soon...</p>
    </div>
  );
}

export default IssueDetails;
