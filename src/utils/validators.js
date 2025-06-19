import { validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

export const validateMongoId = (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError(400, 'Invalid ID format');
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(400, 'Invalid email format');
  }
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
//   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new AppError(400, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
  }
};

export const validateUsername = (username) => {
  // 3-20 characters, letters, numbers, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new AppError(400, 'Username must be 3-20 characters long and can only contain letters, numbers, underscores, and hyphens');
  }
};

export const validateMessageContent = (content) => {
  if (!content || content.trim().length === 0) {
    throw new AppError(400, 'Message content cannot be empty');
  }
  if (content.length > 5000) {
    throw new AppError(400, 'Message content cannot exceed 5000 characters');
  }
};

export const validateFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new AppError(400, 'File size cannot exceed 5MB');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError(400, 'Invalid file type');
  }
};
