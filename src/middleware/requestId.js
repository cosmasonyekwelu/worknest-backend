import { v4 as uuidv4 } from 'uuid';
import { asyncLocalStorage } from '../config/logger.js';

export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  const store = new Map();
  store.set('requestId', requestId);

  asyncLocalStorage.run(store, () => {
    next();
  });
};
