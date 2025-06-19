import { AppError } from '../middleware/errorHandler.js';
import Group from '../models/group.model.js';
import User from '../models/user.model.js';

// Create group
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, organizationId } = req.body;

    const group = await Group.create({
      name,
      description,
      organization: organizationId,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// Get all groups
export const getGroups = async (req, res, next) => {
  try {
    const { organizationId } = req.query;
    const query = { 'members.user': req.user.id };
    
    if (organizationId) {
      query.organization = organizationId;
    }

    const groups = await Group.find(query)
      .populate('owner', 'username')
      .populate('organization', 'name');

    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

// Get group by ID
export const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('owner', 'username')
      .populate('organization', 'name')
      .populate('members.user', 'username email');

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Check if user is a member
    if (!group.members.some(member => member.user.id === req.user.id)) {
      throw new AppError(403, 'Not authorized to view this group');
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// Update group
export const updateGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Check if user is admin
    const member = group.members.find(m => m.user.toString() === req.user.id);
    if (!member || member.role !== 'admin') {
      throw new AppError(403, 'Not authorized to update this group');
    }

    group.name = name || group.name;
    group.description = description || group.description;
    await group.save();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// Delete group
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Check if user is owner
    if (group.owner.toString() !== req.user.id) {
      throw new AppError(403, 'Only the owner can delete the group');
    }

    await group.remove();

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add member to group
export const addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Check if user is admin
    const adminMember = group.members.find(m => m.user.toString() === req.user.id);
    if (!adminMember || adminMember.role !== 'admin') {
      throw new AppError(403, 'Not authorized to add members');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if user is already a member
    if (group.members.some(m => m.user.toString() === userId)) {
      throw new AppError(400, 'User is already a member');
    }

    group.members.push({ user: userId, role });
    await group.save();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from group
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Check if user is admin or the member being removed
    const adminMember = group.members.find(m => m.user.toString() === req.user.id);
    if ((!adminMember || adminMember.role !== 'admin') && req.user.id !== userId) {
      throw new AppError(403, 'Not authorized to remove members');
    }

    // Cannot remove the owner
    if (group.owner.toString() === userId) {
      throw new AppError(400, 'Cannot remove the group owner');
    }

    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};
