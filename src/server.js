import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';

// Import environment configuration

// Import configurations and utilities
import { connectDB } from './config/db.config.js';
import { errorHandler } from './middleware/errorHandler.js';
// import { rateLimiter } from './middleware/rateLimiter.js';
import { rateLimiterMiddleware as rateLimiter } from './middleware/rateLimiter.js';
import { setupSocket } from './utils/socket.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import groupRoutes from './routes/group.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';
import workflowRoutes from './routes/workflow.routes.js';

// Initialize express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Set up socket.io
setupSocket(io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  origin: "https://workonit-1.netlify.app",
  origin: "http://localhost:8080",
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/posts', postRoutes);

// Error handling
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
