import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './create-issue.css';

const CreateIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium'
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch categories
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/issues/categories'
      );

      if (response.data.success) {
        setCategories(response.data.data || []);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Error loading categories');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('Description is required');
        setLoading(false);
        return;
      }

      if (!formData.category_id) {
        setError('Category is required');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/issues',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Issue created successfully!');
        setFormData({
          title: '',
          description: '',
          category_id: '',
          priority: 'medium'
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/citizen/dashboard';
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create issue');
      }
    } catch (err) {
      console.error('Error creating issue:', err);
      if (err.response?.data?.errors) {
        // Multiple validation errors
        const errorMessages = err.response.data.errors
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Error creating issue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-issue-container">
      <div className="create-issue-card">
        <h1>Report an Issue</h1>
        <p className="subtitle">Help us know what's wrong</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="title">Issue Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief title of the issue"
              maxLength="200"
              disabled={loading}
            />
            <small>{formData.title.length}/200</small>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed description of the issue"
              rows="5"
              maxLength="2000"
              disabled={loading}
            />
            <small>{formData.description.length}/2000</small>
          </div>

          {/* Category Field */}
          <div className="form-group">
            <label htmlFor="category_id">Category *</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Field */}
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Creating...' : 'Submit Issue'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
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
