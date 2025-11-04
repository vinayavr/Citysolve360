import React, { useState } from "react";

function OfficialDashboard() {
  const [issues, setIssues] = useState([
    { id: 1, category: "Water", status: "Created", comments: "" },
    { id: 2, category: "Road", status: "Created", comments: "" },
  ]);

  const updateStatus = (id, status) => {
    setIssues(
      issues.map((i) =>
        i.id === id ? { ...i, status, comments: `Marked as ${status}` } : i
      )
    );
  };

  return (
    <div className="page-container">
      <h2>Official Dashboard</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Status</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.id}</td>
              <td>{issue.category}</td>
              <td>{issue.status}</td>
              <td>{issue.comments}</td>
              <td>
                {issue.status === "Created" && (
                  <>
                    <button onClick={() => updateStatus(issue.id, "In Progress")}>
                      In Progress
                    </button>
                    <button onClick={() => updateStatus(issue.id, "Rejected")}>
                      Reject
                    </button>
                    <button onClick={() => updateStatus(issue.id, "Completed")}>
                      Complete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OfficialDashboard;
