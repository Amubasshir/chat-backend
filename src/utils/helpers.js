import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.config.js';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn
  });

  const refreshToken = jwt.sign({ id: userId }, authConfig.jwtRefreshSecret, {
    expiresIn: authConfig.jwtRefreshExpiresIn
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, authConfig.jwtRefreshSecret);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const validateId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const sanitizeUser = (user) => {
  const { password, refreshToken, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
};

export const paginateResults = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit)
  };
};
