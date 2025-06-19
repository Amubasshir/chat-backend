import { AppError } from '../middleware/errorHandler.js';
import User from '../models/user.model.js';
import { validateEmail, validateUsername } from '../utils/validators.js';

// Get current user profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('organizations', 'name');

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, firstName, lastName, avatar } = req.body;

    // Validate input if provided
    if (username) validateUsername(username);
    if (email) validateEmail(email);

    // Check if email/username already exists
    if (email || username) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user.id },
        $or: [
          { email: email || undefined },
          { username: username || undefined }
        ]
      });

      if (existingUser) {
        throw new AppError(400, 'Email or username already exists');
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          username: username || undefined,
          email: email || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          avatar: avatar || undefined
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('organizations', 'name');

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if user has permission to delete
    if (req.user.id !== user.id && !req.user.isAdmin) {
      throw new AppError(403, 'Not authorized to delete this user');
    }

    await user.remove();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
