import { body, param, query } from 'express-validator';

// Validation middleware for doctor registration
export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }).withMessage('Password must be at least 8 characters long and contain lowercase, uppercase, number, and special character')
];


// Validation middleware for doctor login (already implemented in your code)
export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];


// Validation middleware for forgot password
export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];


// Validation middleware for reset password
export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isNumeric().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }).withMessage('Password must be at least 8 characters long and contain lowercase, uppercase, number, and special character')
];


// Validation middleware for changing availability
export const changeAvailabilityValidation = [
  query('docId').notEmpty().withMessage('Doctor ID is required')
];


// Validation middleware for deleting doctor profile
export const deleteProfileValidation = [
  body('docId').notEmpty().withMessage('Doctor ID is required')
];