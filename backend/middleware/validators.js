const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user registration
 */
const validateRegister = [
  // Name validation
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2-255 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  // Email validation
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  
  // Password validation
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  
  // Phone validation
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),
  
  // Address validation
  body('address')
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10-500 characters')
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  // Email validation
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  
  // Password validation
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

/**
 * Middleware to check validation results
 * Must be used after validation rules
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    
    // Format errors by field
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = { 
  validateRegister, 
  validateLogin,
  validate 
};
