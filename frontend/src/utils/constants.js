export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const ISSUE_CATEGORIES = [
  { value: 'road', label: 'Road & Infrastructure' },
  { value: 'water', label: 'Water Supply' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'garbage', label: 'Garbage Collection' },
  { value: 'sewage', label: 'Sewage & Drainage' },
  { value: 'other', label: 'Other' }
];

export const ISSUE_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#4caf50' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'high', label: 'High', color: '#f44336' },
  { value: 'urgent', label: 'Urgent', color: '#d32f2f' }
];

export const ISSUE_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#9e9e9e' },
  { value: 'assigned', label: 'Assigned', color: '#2196f3' },
  { value: 'in_progress', label: 'In_progress', color: '#ff9800' },
  { value: 'resolved', label: 'Resolved', color: '#4caf50' },
  { value: 'closed', label: 'Closed', color: '#607d8b' },
  { value: 'rejected', label: 'Rejected', color: '#f44336' }
];

export const USER_ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official'
};