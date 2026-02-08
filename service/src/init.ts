import { env } from './env';

if (!process.env.DATABASE_URL) {
  if (
    !env.DATABASE_USERNAME ||
    !env.DATABASE_PASSWORD ||
    !env.DATABASE_HOST ||
    !env.DATABASE_PORT ||
    !env.DATABASE_NAME
  ) {
    throw new Error(
      'DATABASE_URL is not set and database component env vars are missing'
    );
  }

  process.env.DATABASE_URL = `postgres://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}?schema=public&sslmode=no-verify&connection_limit=20`;
}

if (!process.env.REDIS_URL) {
  if (!env.REDIS_AUTH_TOKEN || !env.REDIS_HOST || !env.REDIS_PORT) {
    throw new Error('REDIS_URL is not set and redis component env vars are missing');
  }

  process.env.REDIS_URL = `${
    process.env.REDIS_TLS == 'true' ? 'rediss' : 'redis'
  }://:${env.REDIS_AUTH_TOKEN}@${env.REDIS_HOST}:${env.REDIS_PORT}/0`;
}

if (!env.service.DATABASE_URL) {
  env.service.DATABASE_URL = process.env.DATABASE_URL;
}

if (!env.service.REDIS_URL) {
  env.service.REDIS_URL = process.env.REDIS_URL;
}
