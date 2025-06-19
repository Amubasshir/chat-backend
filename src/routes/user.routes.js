import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../utils/validators.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// Validation middleware
const updateUserValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address'),
];

// Protected routes - require authentication
router.use(verifyToken);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', updateUserValidation, validate, (req, res) => {
  // TODO: Implement update profile logic in controller
});

// Get user by ID
router.get('/:id', (req, res) => {
  // TODO: Implement get user by id logic in controller
});

// Delete user account
router.delete('/:id', (req, res) => {
  // TODO: Implement delete user logic in controller
});

export default router;
