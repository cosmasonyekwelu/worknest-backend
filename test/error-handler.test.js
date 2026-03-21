import test from 'node:test';
import assert from 'node:assert/strict';
import { globalErrorHandler } from '../src/middleware/errorHandler.js';
import logger from '../src/config/logger.js';
import { ValidationError } from '../src/lib/errors.js';

const createMockRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return body;
  },
});

test('globalErrorHandler sanitizes unknown errors in production', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const res = createMockRes();

  globalErrorHandler(new Error('sensitive_message'), {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.message, 'Internal server error');

  process.env.NODE_ENV = prev;
});

test('globalErrorHandler logs 4xx errors as warnings without stack', () => {
  const res = createMockRes();
  const req = { method: 'POST', originalUrl: '/api/jobs' };
  const warningLogs = [];
  const errorLogs = [];
  const originalWarn = logger.warn;
  const originalError = logger.error;

  logger.warn = (message, meta) => warningLogs.push({ message, meta });
  logger.error = (message, meta) => errorLogs.push({ message, meta });

  globalErrorHandler(new ValidationError('Validation failed'), req, res, () => {});

  logger.warn = originalWarn;
  logger.error = originalError;

  assert.equal(res.statusCode, 400);
  assert.equal(warningLogs.length, 1);
  assert.equal(errorLogs.length, 0);
  assert.equal(warningLogs[0].meta.statusCode, 400);
  assert.equal(warningLogs[0].meta.path, '/api/jobs');
  assert.equal(warningLogs[0].meta.method, 'POST');
  assert.equal('stack' in warningLogs[0].meta, false);
});

test('globalErrorHandler logs 5xx errors with stack traces', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const res = createMockRes();
  const req = { method: 'GET', originalUrl: '/api/jobs' };
  const warningLogs = [];
  const errorLogs = [];
  const originalWarn = logger.warn;
  const originalError = logger.error;

  logger.warn = (message, meta) => warningLogs.push({ message, meta });
  logger.error = (message, meta) => errorLogs.push({ message, meta });

  globalErrorHandler(new Error('db unavailable'), req, res, () => {});

  logger.warn = originalWarn;
  logger.error = originalError;
  process.env.NODE_ENV = prev;

  assert.equal(res.statusCode, 500);
  assert.equal(warningLogs.length, 0);
  assert.ok(errorLogs.length >= 1);
  assert.equal(errorLogs.at(-1).meta.statusCode, 500);
  assert.equal(typeof errorLogs.at(-1).meta.stack, 'string');
  assert.ok(errorLogs.at(-1).meta.stack.length > 0);
});
