/**
 * Configuración de la base de datos
 * Lee las variables de entorno y proporciona la configuración de TypeORM
 */

export default () => ({
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'myhotelflow',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
    logging: process.env.DB_LOGGING === 'true' || false,
    autoLoadEntities: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  argon2: {
    // Configuración para Argon2id
    type: 2, // Argon2id
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10), // 64 MB
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  security: {
    lockoutThreshold: parseInt(process.env.LOCKOUT_THRESHOLD || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 min en ms
    passwordResetExpiration: parseInt(
      process.env.PASSWORD_RESET_EXPIRATION || '3600000',
      10,
    ), // 1h
    permissionsCacheTTL: parseInt(
      process.env.PERMISSIONS_CACHE_TTL || '900',
      10,
    ), // 15 min en segundos
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
  },
});
