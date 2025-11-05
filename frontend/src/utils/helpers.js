export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const formatDateTime = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const getStatusColor = (status) => {
  const statusMap = {
    pending: '#9e9e9e',
    assigned: '#2196f3',
    in_progress: '#ff9800',
    resolved: '#4caf50',
    closed: '#607d8b',
    rejected: '#f44336'
  };
  return statusMap[status] || '#9e9e9e';
};

export const getCategoryIcon = (category) => {
  const iconMap = {
    road: '🛣️',
    water: '💧',
    electricity: '⚡',
    garbage: '🗑️',
    sewage: '🚰',
    other: '📋'
  };
  return iconMap[category] || '📋';
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
};