import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/caqms_db',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'super-secure-access-secret-clinic-saas-2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secure-refresh-secret-clinic-saas-2026',
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION_DAYS: 7,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

