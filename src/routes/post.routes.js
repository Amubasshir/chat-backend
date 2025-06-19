import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../utils/validators.js';

const router = Router();

// Validation middleware
const postValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Post title must be between 1 and 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Post content cannot be empty'),
  body('type')
    .optional()
    .isIn(['text', 'media', 'link'])
    .withMessage('Invalid post type'),
];

// Protected routes - require authentication
router.use(verifyToken);

// Create post
router.post('/', postValidation, validate, (req, res) => {
  // TODO: Implement create post logic in controller
});

// Get all posts (with filters)
router.get('/', (req, res) => {
  // TODO: Implement get posts logic in controller
});

// Get post by ID
router.get('/:id', (req, res) => {
  // TODO: Implement get post logic in controller
});

// Update post
router.put('/:id', postValidation, validate, (req, res) => {
  // TODO: Implement update post logic in controller
});

// Delete post
router.delete('/:id', (req, res) => {
  // TODO: Implement delete post logic in controller
});

// Like/unlike post
router.post('/:id/like', (req, res) => {
  // TODO: Implement like post logic in controller
});

// Add comment to post
router.post('/:id/comments', [
  body('content')
    .notEmpty()
    .withMessage('Comment content cannot be empty'),
], validate, (req, res) => {
  // TODO: Implement add comment logic in controller
});

// Delete comment
router.delete('/:id/comments/:commentId', (req, res) => {
  // TODO: Implement delete comment logic in controller
});

export default router;
