import { AppError } from '../middleware/errorHandler.js';
import User from '../models/user.model.js';
import { generateTokens, verifyRefreshToken } from '../utils/helpers.js';
import { validateEmail, validatePassword, validateUsername } from '../utils/validators.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validate input
    validateUsername(username);
    validateEmail(email);
    validatePassword(password);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new AppError(400, 'Email or username already exists');
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update user with refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove sensitive info
    const userResponse = user.toJSON();

    res.status(201).json({
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update user's refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Update user status
    user.status = 'online';
    await user.save();

    // Remove sensitive info
    const userResponse = user.toJSON();

    res.json({
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Find user
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken
    });

    if (!user) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Update user's refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { user } = req;

    // Update user status and remove refresh token
    user.status = 'offline';
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { user } = req;

    // Validate new password
    validatePassword(newPassword);

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    validateEmail(email);

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist for security
      return res.json({ message: 'If an account exists with this email, a password reset link will be sent' });
    }

    // Generate password reset token (would typically send via email)
    const resetToken = generateTokens(user._id).accessToken;

    // In a real application, you would:
    // 1. Save the reset token to the user record with an expiration
    // 2. Send an email with the reset link
    // 3. Create a reset password endpoint that validates the token

    res.json({
      message: 'If an account exists with this email, a password reset link will be sent',
      // Include token in response for development only
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    next(error);
  }
};
