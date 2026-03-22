const { body, validationResult } = require('express-validator');

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const validateCreateUser = [
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required'),
  body('studentNumber')
    .optional()
    .matches(/^SE\/\d{4}\/\d{3}$/)
    .withMessage('studentNumber must be in format SE/YYYY/NNN'),
  handleErrors,
];

const validateCreateAdmin = [
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required'),
  body('studentNumber')
    .optional()
    .matches(/^SE\/\d{4}\/\d{3}$/)
    .withMessage('studentNumber must be in format SE/YYYY/NNN'),
  handleErrors,
];

const validateUpdateUser = [
  body('name').optional().notEmpty().withMessage('name cannot be empty'),
  body('email').optional().isEmail().withMessage('valid email is required'),
  body('studentNumber')
    .optional()
    .matches(/^SE\/\d{4}\/\d{3}$/)
    .withMessage('studentNumber must be in format SE/YYYY/NNN'),
  handleErrors,
];

const validateUpdateAdmin = [
  body('name').optional().notEmpty().withMessage('name cannot be empty'),
  body('email').optional().isEmail().withMessage('valid email is required'),
  body('studentNumber')
    .optional()
    .matches(/^SE\/\d{4}\/\d{3}$/)
    .withMessage('studentNumber must be in format SE/YYYY/NNN'),
  handleErrors,
];

const validateUpdateMyProfile = [
  body('name').optional().notEmpty().withMessage('name cannot be empty'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters'),
  handleErrors,
];

module.exports = {
  validateCreateUser,
  validateCreateAdmin,
  validateUpdateUser,
  validateUpdateAdmin,
  validateUpdateMyProfile,
};
