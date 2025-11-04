import React, { useState } from "react";

function CitizenDashboard() {
  const [issues, setIssues] = useState([]);
  const [newIssue, setNewIssue] = useState({ category: "", description: "" });

  const raiseIssue = (e) => {
    e.preventDefault();
    const issue = {
      id: issues.length + 1,
      ...newIssue,
      status: "Created",
      date: new Date().toLocaleDateString(),
    };
    setIssues([...issues, issue]);
    setNewIssue({ category: "", description: "" });
  };

  const escalateIssue = (id) => {
    setIssues(
      issues.map((i) => (i.id === id ? { ...i, status: "Escalated" } : i))
    );
  };

  return (
    <div className="page-container">
      <h2>Citizen Dashboard</h2>

      <form onSubmit={raiseIssue}>
        <select
          value={newIssue.category}
          onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
          required
        >
          <option value="">Select Issue Category</option>
          <option>Water</option>
          <option>Electricity</option>
          <option>Road</option>
          <option>Waste</option>
        </select>
        <textarea
          placeholder="Enter issue description"
          value={newIssue.description}
          onChange={(e) =>
            setNewIssue({ ...newIssue, description: e.target.value })
          }
          required
        />
        <button type="submit">Raise Issue</button>
      </form>

      <h3>My Issues</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.id}</td>
              <td>{issue.category}</td>
              <td>{issue.status}</td>
              <td>
                {issue.status === "Created" && (
                  <button onClick={() => escalateIssue(issue.id)}>
                    Escalate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CitizenDashboard;
