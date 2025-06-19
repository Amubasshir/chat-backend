export default {
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  roles: ['user', 'admin', 'agent'],
  userStatuses: ['online', 'offline', 'away'],
  workflowStatuses: ['active', 'completed', 'paused'],
  stepStatuses: ['pending', 'in_progress', 'completed']
};
