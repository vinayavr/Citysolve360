const sanitizeHtml = require('sanitize-html');

/**
 * Middleware to sanitize user input
 * Removes any HTML/script tags to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      // Sanitize all string fields in request body
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Remove leading/trailing whitespace
          req.body[key] = req.body[key].trim();
          
          // Remove HTML tags and dangerous content
          req.body[key] = sanitizeHtml(req.body[key], {
            allowedTags: [],  // Don't allow any HTML tags
            allowedAttributes: {}
          });
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Sanitize error:', error);
    res.status(400).json({
      success: false,
      message: 'Input validation failed'
    });
  }
};

module.exports = { sanitizeInput };
