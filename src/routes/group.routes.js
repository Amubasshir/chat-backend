import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../utils/validators.js';

const router = Router();

// Validation middleware
const groupValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Group name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

// Protected routes - require authentication
router.use(verifyToken);

// Create group
router.post('/', groupValidation, validate, (req, res) => {
  // TODO: Implement create group logic in controller
});

// Get all groups user has access to
router.get('/', (req, res) => {
  // TODO: Implement get groups logic in controller
});

// Get group by ID
router.get('/:id', (req, res) => {
  // TODO: Implement get group logic in controller
});

// Update group
router.put('/:id', groupValidation, validate, (req, res) => {
  // TODO: Implement update group logic in controller
});

// Delete group
router.delete('/:id', (req, res) => {
  // TODO: Implement delete group logic in controller
});

// Add member to group
router.post('/:id/members', (req, res) => {
  // TODO: Implement add member logic in controller
});

// Remove member from group
router.delete('/:id/members/:userId', (req, res) => {
  // TODO: Implement remove member logic in controller
});

export default router;
