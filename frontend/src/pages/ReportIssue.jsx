import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import IssueForm from '../components/issues/IssueForm';
import Alert from '../components/common/Alert';
import issueService from '../services/issueService';
import '../styles/Pages.css';

const ReportIssue = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (issueData) => {
    try {
      setLoading(true);
      setAlert(null);

      const response = await issueService.createIssue(issueData);

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Issue reported successfully!'
        });

        setTimeout(() => {
          navigate('/my-issues');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to report issue. Please try again.';
      setAlert({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-content">
        <div className="page-header">
          <h1>Report New Issue</h1>
          <p>Help us improve your community by reporting civic issues</p>
        </div>

        {alert && (
          <div className="alert-container">
            <Alert 
              type={alert.type} 
              message={alert.message} 
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <IssueForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </>
  );
};

export default ReportIssue;