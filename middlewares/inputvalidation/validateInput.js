// middlewares/validateInputs.js
import { body, validationResult } from 'express-validator';

export const validateInputs = (validations) => {
  return async (req, res, next) => {
    // Run all validation checks
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    next(); // Proceed to the next middleware or route handler
  };
};
