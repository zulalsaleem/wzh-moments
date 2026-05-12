import { validationResult } from 'express-validator';

/**
 * Collects express-validator errors and short-circuits the request with a
 * 400 response when any validation rule fails.
 * Place this after your validation chains and before the route controller.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, errors: messages });
  }

  next();
};

export default handleValidationErrors;
