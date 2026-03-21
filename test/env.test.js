import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/config/env.js';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '5000',
  CLIENT_URL: 'http://localhost:5173',
  MONGO_URI: 'mongodb://localhost:27017',
  DATABASE_NAME: 'worknest_server',
  JWT_ACCESS_SECRET_KEY: 'access_secret_key_12345',
  JWT_REFRESH_SECRET_KEY: 'refresh_secret_key_12345',
  JWT_ACCESS_TOKEN_EXPIRES: '15m',
  JWT_REFRESH_TOKEN_EXPIRES: '7d',
  BREVO_API_KEY: 'brevo_key',
  BREVO_SENDER_EMAIL: 'noreply@example.com',
  BREVO_SENDER_NAME: 'Worknest',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'api_key',
  CLOUDINARY_API_SECRET: 'api_secret',
};

test('validateEnv succeeds for complete environment', () => {
  const backup = { ...process.env };
  Object.assign(process.env, baseEnv);

  const result = validateEnv();
  assert.equal(result.NODE_ENV, 'test');
  assert.equal(result.CLIENT_URL, 'http://localhost:5173');

  process.env = backup;
});

test('validateEnv throws when required value missing', () => {
  const backup = { ...process.env };
  Object.assign(process.env, baseEnv);
  delete process.env.CLIENT_URL;

  assert.throws(() => validateEnv());
  process.env = backup;
});
