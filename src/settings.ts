import * as process from 'process';
import { config } from 'dotenv';
config();
const dbName = 'home_works';

export const settings = () => ({
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV,
  SECRET_KEY: process.env.SECRET_KEY || '123',
  MONGO_URL: process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${dbName}`,
  JWT_SECRET: process.env.JWT_SECRET || '123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '123',
  PASSWORD_EMAIL: process.env.PASSWORD_EMAIL || '123',
  LIMIT_COUNT: process.env.LIMIT_COUNT || 10,
  HTTP_BASIC_USER: process.env.HTTP_BASIC_USER || '123',
  HTTP_BASIC_PASS: process.env.HTTP_BASIC_PASS || '123',
  ACCESS_JWT_LIFETIME: process.env.ACCESS_JWT_LIFETIME || '123',
  REFRESH_JWT_LIFETIME: process.env.REFRESH_JWT_LIFETIME || '123',
  SQL_HOST: process.env.SQL_HOST || '123',
  SQL_USERNAME: process.env.SQL_USERNAME || '123',
  SQL_PASSWORD: process.env.SQL_PASSWORD || '123',
  SQL_DATABASE: process.env.SQL_DATABASE || '123',
});
