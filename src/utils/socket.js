import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.config.js';
import User from '../models/user.model.js';

export const setupSocket = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, authConfig.jwtSecret);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    
    // Join user's rooms
    socket.join(`user:${socket.user._id}`);
    socket.user.groups.forEach(groupId => {
      socket.join(`group:${groupId}`);
    });

    // Update user status
    updateUserStatus(socket.user._id, 'online');

    // Message handlers
    socket.on('message:send', async (data) => {
      try {
        // Handle new message
        const { chatId, content, type = 'text', attachments = [] } = data;
        
        // Broadcast to chat room
        socket.to(`chat:${chatId}`).emit('message:receive', {
          chatId,
          content,
          sender: socket.user._id,
          type,
          attachments,
          createdAt: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        userId: socket.user._id,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        userId: socket.user._id,
        isTyping: false
      });
    });

    // Read receipts
    socket.on('message:read', async ({ chatId, messageId }) => {
      try {
        socket.to(`chat:${chatId}`).emit('message:read:update', {
          messageId,
          userId: socket.user._id,
          readAt: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update read status' });
      }
    });

    // Group events
    socket.on('group:join', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user._id}`);
      updateUserStatus(socket.user._id, 'offline');
    });
  });
};

// Helper function to update user status
const updateUserStatus = async (userId, status) => {
  try {
    await User.findByIdAndUpdate(userId, { status });
  } catch (error) {
    console.error('Failed to update user status:', error);
  }
};
