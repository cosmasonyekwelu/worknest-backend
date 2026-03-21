import NodeCache from "node-cache";
import logger from "../config/logger.js";

export const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 620,
  useClones: false,
});

export const cacheMiddleware =
  (key, ttl = 600) =>
  async (req, res, next) => {
    const userId = req.user.id || "anonymous";
    const cacheKey = `user_${userId}_${key}_${req.originalUrl}_${JSON.stringify(req.query)}`;

    try {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        logger.debug("Cache hit", { cacheKey });
        return res.json(cachedData);
      }

      const originalJSON = res.json;
      res.json = function (data) {
        cache.set(cacheKey, data, ttl);
        logger.debug("Cache set", { cacheKey, ttl });
        return originalJSON.call(this, data);
      };

      return next();
    } catch (error) {
      logger.error("Cache error", { error: error.message });
      return next(error);
    }
  };

export const clearCache =
  (pattern = null, clearAll = false) =>
  (req, res, next) => {
    const keys = cache.keys();

    if (clearAll) {
      keys.forEach((key) => cache.del(key));
      logger.info("Cleared all cache entries");
      return next();
    }

    const userId = req.user.id || "";
    const userPrefix = userId ? `user_${userId}_` : "";

    const matchingKeys = pattern
      ? keys.filter((key) => {
          if (userId) return key.includes(userPrefix) && key.includes(pattern);
          return key.includes(pattern);
        })
      : keys;

    matchingKeys.forEach((key) => cache.del(key));
    logger.info("Cleared cache entries", {
      count: matchingKeys.length,
      userId: userId || null,
      pattern,
    });

    return next();
  };
