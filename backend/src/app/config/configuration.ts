export default () => ({
  app: {
    name: process.env.APP_NAME || 'Exam Platform',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  },
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/exam_platform',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '30m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '', 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    ttl: parseInt(process.env.REDIS_TTL ?? '', 10) || 3600,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },
});