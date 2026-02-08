import { createValidatedEnv } from '@lowerdeck/env';
import { v } from '@lowerdeck/validation';

export let env = createValidatedEnv({
  service: {
    REDIS_URL: v.optional(v.string()),
    DATABASE_URL: v.optional(v.string())
  },

  storage: {
    OBJECT_STORAGE_URL: v.string(),
    LOGS_BUCKET_NAME: v.string()
  },

  DATABASE_USERNAME: v.optional(v.string()),
  DATABASE_PASSWORD: v.optional(v.string()),
  DATABASE_HOST: v.optional(v.string()),
  DATABASE_PORT: v.optional(v.string()),
  DATABASE_NAME: v.optional(v.string()),

  REDIS_AUTH_TOKEN: v.optional(v.string()),
  REDIS_HOST: v.optional(v.string()),
  REDIS_PORT: v.optional(v.string()),
  REDIS_TLS: v.optional(v.string())
});
