import api from './api';

const issueService = {
  // Get all issues with filters
  getIssues: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/issues${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  // Get single issue
  getIssue: async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  // Create new issue
  createIssue: async (issueData) => {
    const response = await api.post('/issues', issueData);
    return response.data;
  },

  // Update issue
  updateIssue: async (id, issueData) => {
    const response = await api.put(`/issues/${id}`, issueData);
    return response.data;
  },

  // Update issue status (officials only)
  updateIssueStatus: async (id, statusData) => {
    const response = await api.put(`/issues/${id}/status`, statusData);
    return response.data;
  },

  // Assign issue (officials only)
  assignIssue: async (id, officialId) => {
    const response = await api.put(`/issues/${id}/assign`, { assigned_to: officialId });
    return response.data;
  },

  // Delete issue
  deleteIssue: async (id) => {
    const response = await api.delete(`/issues/${id}`);
    return response.data;
  },

  // Upload images to ImageKit
  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post('/issues/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default issueService;