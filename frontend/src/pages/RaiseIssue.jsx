
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './RaiseIssue.css';

const RaiseIssue = () => {
  const [formData, setFormData] = useState({
    category: '',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const categories = [
    'Roads',
    'Water Supply',
    'Drainage',
    'Electricity',
    'Garbage Collection',
    'Street Lights',
    'Public Transport',
    'Parks and Recreation',
    'Building Permits',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    setFiles(selectedFiles);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      
      files.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      await api.post('/issues', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Issue raised successfully!');
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="raise-issue-container">
        <div className="raise-issue-card">
          <h1>🎯 Raise New Issue</h1>
          <p className="subtitle">Report a municipal issue in your area</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="issue-form">
            <div className="form-group">
              <label htmlFor="category">Issue Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail (minimum 10 characters)"
                rows="6"
                required
                disabled={loading}
                minLength="10"
              />
              <small className="helper-text">
                {formData.description.length}/2000 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="attachments">Attachments (Optional)</label>
              <input
                type="file"
                id="attachments"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                multiple
                disabled={loading}
              />
              <small className="helper-text">
                Upload up to 5 images or PDFs (Max 10MB each)
              </small>
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/citizen/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RaiseIssue;
