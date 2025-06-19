import { AppError } from '../middleware/errorHandler.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';

// Create new chat
export const createChat = async (req, res, next) => {
  try {
    const { name, type, participants } = req.body;

    // For direct chats, ensure exactly 2 participants
    if (type === 'direct' && (!participants || participants.length !== 1)) {
      throw new AppError(400, 'Direct chat must have exactly one other participant');
    }

    // Check if direct chat already exists
    if (type === 'direct') {
      const existingChat = await Chat.findOne({
        type: 'direct',
        participants: {
          $all: [req.user.id, participants[0]],
          $size: 2
        }
      });

      if (existingChat) {
        return res.status(200).json({
          success: true,
          data: existingChat
        });
      }
    }

    // Create chat
    const chat = await Chat.create({
      name: type === 'direct' ? null : name,
      type,
      participants: [req.user.id, ...participants]
    });

    await chat.populate('participants', 'username');

    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// Get all chats for user
export const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'username')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username'
        }
      });

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};

// Get chat by ID
export const getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'username')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username'
        }
      });

    if (!chat) {
      throw new AppError(404, 'Chat not found');
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p.id === req.user.id)) {
      throw new AppError(403, 'Not authorized to view this chat');
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// Update chat (group chat only)
export const updateChat = async (req, res, next) => {
  try {
    const { name } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      throw new AppError(404, 'Chat not found');
    }

    if (chat.type !== 'group') {
      throw new AppError(400, 'Can only update group chats');
    }

    chat.name = name;
    await chat.save();

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// Delete chat
export const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      throw new AppError(404, 'Chat not found');
    }

    // Only creator can delete group chat
    if (chat.type === 'group' && chat.creator.toString() !== req.user.id) {
      throw new AppError(403, 'Only the creator can delete the group chat');
    }

    // For direct chat, any participant can delete
    if (chat.type === 'direct' && !chat.participants.includes(req.user.id)) {
      throw new AppError(403, 'Not authorized to delete this chat');
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chat._id });
    await chat.remove();

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get messages for chat
export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      throw new AppError(404, 'Chat not found');
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      throw new AppError(403, 'Not authorized to view these messages');
    }

    const messages = await Message.find({ chat: chat._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username');

    res.status(200).json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// Send message
export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      throw new AppError(404, 'Chat not found');
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      throw new AppError(403, 'Not authorized to send messages in this chat');
    }

    const message = await Message.create({
      chat: chat._id,
      sender: req.user.id,
      content
    });

    // Update last message in chat
    chat.lastMessage = message._id;
    await chat.save();

    await message.populate('sender', 'username');

    // Emit socket event for real-time updates
    req.io.to(chat._id.toString()).emit('message', message);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// Delete message
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      throw new AppError(403, 'Can only delete your own messages');
    }

    await message.remove();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
