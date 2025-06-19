import { AppError } from '../middleware/errorHandler.js';
import Organization from '../models/organization.model.js';
import User from '../models/user.model.js';

// Create organization
export const createOrganization = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const organization = await Organization.create({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });

    // Add organization to user's organizations
    await User.findByIdAndUpdate(req.user.id, {
      $push: { organizations: organization._id }
    });

    res.status(201).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// Get all organizations for user
export const getOrganizations = async (req, res, next) => {
  try {
    const organizations = await Organization.find({
      'members.user': req.user.id
    }).populate('owner', 'username');

    res.status(200).json({
      success: true,
      data: organizations
    });
  } catch (error) {
    next(error);
  }
};

// Get organization by ID
export const getOrganizationById = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('owner', 'username')
      .populate('members.user', 'username email');

    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }

    // Check if user is a member
    if (!organization.members.some(member => member.user.id === req.user.id)) {
      throw new AppError(403, 'Not authorized to view this organization');
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// Update organization
export const updateOrganization = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }

    // Check if user is admin
    const member = organization.members.find(m => m.user.toString() === req.user.id);
    if (!member || member.role !== 'admin') {
      throw new AppError(403, 'Not authorized to update this organization');
    }

    organization.name = name || organization.name;
    organization.description = description || organization.description;
    await organization.save();

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// Delete organization
export const deleteOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }

    // Check if user is owner
    if (organization.owner.toString() !== req.user.id) {
      throw new AppError(403, 'Only the owner can delete the organization');
    }

    // Remove organization from all members' organizations array
    await User.updateMany(
      { _id: { $in: organization.members.map(m => m.user) } },
      { $pull: { organizations: organization._id } }
    );

    await organization.remove();

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add member to organization
export const addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }

    // Check if user is admin
    const adminMember = organization.members.find(m => m.user.toString() === req.user.id);
    if (!adminMember || adminMember.role !== 'admin') {
      throw new AppError(403, 'Not authorized to add members');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if user is already a member
    if (organization.members.some(m => m.user.toString() === userId)) {
      throw new AppError(400, 'User is already a member');
    }

    organization.members.push({ user: userId, role });
    await organization.save();

    // Add organization to user's organizations
    await User.findByIdAndUpdate(userId, {
      $push: { organizations: organization._id }
    });

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from organization
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      throw new AppError(404, 'Organization not found');
    }

    // Check if user is admin or the member being removed
    const adminMember = organization.members.find(m => m.user.toString() === req.user.id);
    if ((!adminMember || adminMember.role !== 'admin') && req.user.id !== userId) {
      throw new AppError(403, 'Not authorized to remove members');
    }

    // Cannot remove the owner
    if (organization.owner.toString() === userId) {
      throw new AppError(400, 'Cannot remove the organization owner');
    }

    organization.members = organization.members.filter(m => m.user.toString() !== userId);
    await organization.save();

    // Remove organization from user's organizations
    await User.findByIdAndUpdate(userId, {
      $pull: { organizations: organization._id }
    });

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};
