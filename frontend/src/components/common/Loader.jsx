import React from 'react';
import '../../styles/Loader.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const loaderClass = `loader ${size} ${fullScreen ? 'fullscreen' : ''}`;

  if (fullScreen) {
    return (
      <div className="loader-overlay">
        <div className={loaderClass}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={loaderClass}>
      <div className="spinner"></div>
    </div>
  );
};

export default Loader;