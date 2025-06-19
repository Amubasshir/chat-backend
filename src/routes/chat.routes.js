import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../utils/validators.js';

const router = Router();

// Validation middleware
const chatValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Chat name must be between 2 and 50 characters'),
  body('type')
    .isIn(['direct', 'group'])
    .withMessage('Chat type must be either direct or group'),
];

// Protected routes - require authentication
router.use(verifyToken);

// Create new chat
router.post('/', chatValidation, validate, (req, res) => {
  // TODO: Implement create chat logic in controller
});

// Get all chats for user
router.get('/', (req, res) => {
  // TODO: Implement get chats logic in controller
});

// Get chat by ID
router.get('/:id', (req, res) => {
  // TODO: Implement get chat logic in controller
});

// Update chat
router.put('/:id', chatValidation, validate, (req, res) => {
  // TODO: Implement update chat logic in controller
});

// Delete chat
router.delete('/:id', (req, res) => {
  // TODO: Implement delete chat logic in controller
});

// Get messages for chat
router.get('/:id/messages', (req, res) => {
  // TODO: Implement get messages logic in controller
});

// Send message in chat
router.post('/:id/messages', [
  body('content').notEmpty().withMessage('Message content cannot be empty'),
], validate, (req, res) => {
  // TODO: Implement send message logic in controller
});

// Delete message
router.delete('/:id/messages/:messageId', (req, res) => {
  // TODO: Implement delete message logic in controller
});

export default router;
