import mongoose from 'mongoose';
import { RateLimiterMongo } from 'rate-limiter-flexible';

const rateLimiterOpts = {
  storeClient: mongoose.connection,
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 10 // Block for 10 minutes if points exceed
};

let rateLimiter;

mongoose.connection.once('connected', () => {
  rateLimiter = new RateLimiterMongo(rateLimiterOpts);
});

export const rateLimiterMiddleware = async (req, res, next) => {
  try {
    if (!rateLimiter) {
      return next();
    }

    const key = req.ip;
    await rateLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      message: 'Too many requests, please try again later.'
    });
  }
};
