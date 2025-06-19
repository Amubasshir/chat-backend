import mongoose from 'mongoose';
import { config } from './env.config.js';

const dbConfig = {
  url: config.mongodbUri,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

export const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.url, dbConfig.options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default dbConfig;
