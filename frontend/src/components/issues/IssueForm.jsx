import React, { useState } from 'react';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES } from '../../utils/constants';
import Loader from '../common/Loader';
import issueService from '../../services/issueService';
import '../../styles/IssueForm.css';

const IssueForm = ({ onSubmit, loading, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    priority: initialData?.priority || 'medium',
    location_address: initialData?.location_address || '',
    landmark: initialData?.landmark || '',
    ward_number: initialData?.ward_number || ''
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      setErrors(prev => ({
        ...prev,
        images: 'Maximum 5 images allowed'
      }));
      return;
    }

    // Validate file sizes (max 5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Each image must be less than 5MB'
      }));
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.location_address.trim()) {
      newErrors.location_address = 'Location is required';
    }

    if (images.length === 0 && !initialData) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Upload images first if there are any
      let uploadedImages = [];
      if (images.length > 0) {
        setUploadingImages(true);
        const imageResponse = await issueService.uploadImages(images);
        if (imageResponse.success) {
          uploadedImages = imageResponse.images;
        }
        setUploadingImages(false);
      }

      // Submit form data with uploaded images
      const issueData = {
        ...formData,
        before_images: uploadedImages
      };

      await onSubmit(issueData);
    } catch (error) {
      console.error('Form submission error:', error);
      setUploadingImages(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      <div className="form-section">
        <h3>Issue Details</h3>
        
        <div className="form-group">
          <label htmlFor="title">Issue Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={errors.title ? 'error' : ''}
            placeholder="Brief title describing the issue"
            disabled={loading}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Select Category</option>
              {ISSUE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={loading}
            >
              {ISSUE_PRIORITIES.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? 'error' : ''}
            placeholder="Provide detailed description of the issue..."
            rows="5"
            disabled={loading}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>
      </div>

      <div className="form-section">
        <h3>Location Details</h3>
        
        <div className="form-group">
          <label htmlFor="location_address">Address *</label>
          <textarea
            id="location_address"
            name="location_address"
            value={formData.location_address}
            onChange={handleChange}
            className={errors.location_address ? 'error' : ''}
            placeholder="Street address, area, city"
            rows="3"
            disabled={loading}
          />
          {errors.location_address && <span className="error-message">{errors.location_address}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="landmark">Nearby Landmark</label>
            <input
              type="text"
              id="landmark"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="e.g., Near City Mall"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ward_number">Ward Number</label>
            <input
              type="text"
              id="ward_number"
              name="ward_number"
              value={formData.ward_number}
              onChange={handleChange}
              placeholder="e.g., Ward 12"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Upload Images *</h3>
        <p className="form-hint">Upload up to 5 images (Max 5MB each)</p>

        <div className="image-upload-area">
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loading || uploadingImages || images.length >= 5}
            style={{ display: 'none' }}
          />
          
          <label 
            htmlFor="images" 
            className={`upload-label ${images.length >= 5 ? 'disabled' : ''}`}
          >
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              <strong>Click to upload images</strong>
              <span>or drag and drop</span>
            </div>
          </label>
        </div>

        {errors.images && <span className="error-message">{errors.images}</span>}

        {imagePreviews.length > 0 && (
          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(index)}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={loading || uploadingImages}
        >
          {uploadingImages ? (
            <>
              <Loader size="small" />
              <span>Uploading Images...</span>
            </>
          ) : loading ? (
            <>
              <Loader size="small" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>📤</span>
              <span>Submit Issue</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default IssueForm;