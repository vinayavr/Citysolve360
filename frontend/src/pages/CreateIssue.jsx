import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './create-issue.css';

const CreateIssue = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    description: '',
    category_id: ''
  });

  const [categories, setCategories] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        'http://localhost:5000/api/issues/categories',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setCategories(response.data.data || []);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Error loading categories. Please refresh the page.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + attachments.length > 5) {
      setError('Maximum 5 attachments allowed');
      return;
    }

    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.description.trim()) {
        setError('Description is required');
        setLoading(false);
        return;
      }

      if (formData.description.length > 2000) {
        setError('Description cannot exceed 2000 characters');
        setLoading(false);
        return;
      }

      if (!formData.category_id) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);

      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await axios.post(
        'http://localhost:5000/api/issues/create',
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Issue created successfully!');
        setFormData({
          description: '',
          category_id: ''
        });
        setAttachments([]);

        setTimeout(() => {
          navigate('/citizen/dashboard');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create issue');
      }
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(err.response?.data?.message || 'Error creating issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-issue-container">
      <div className="create-issue-card">
        <h1>Report an Issue</h1>
        <p className="subtitle">Help us improve your neighborhood</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="category_id">
              Category <span className="required">*</span>
            </label>
            {categoriesLoading ? (
              <select disabled>
                <option>Loading categories...</option>
              </select>
            ) : (
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                disabled={loading}
                required
              >
                <option value="">-- Select a category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed description of the issue..."
              rows="6"
              maxLength="2000"
              disabled={loading}
              required
            />
            <small>{formData.description.length}/2000 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="attachments">Attachments (Optional)</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                disabled={loading}
                className="file-input-hidden"
              />
              <label htmlFor="attachments" className="file-upload-label">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Click to upload images or documents</span>
                <small>PNG, JPG, PDF up to 5MB each (Max 5 files)</small>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Attached Files:</h4>
                <ul>
                  {attachments.map((file, index) => (
                    <li key={index} className="attachment-item">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="remove-attachment-btn"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="btn-submit"
            >
              {loading ? 'Creating Issue...' : 'Create Issue'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/citizen/dashboard')}
              disabled={loading}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssue;
