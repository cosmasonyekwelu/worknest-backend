import { ValidationError } from "../lib/errors.js";
import { ZodError } from "zod";

export const validateRequest = (schema, property = "body") => {
  return (req, res, next) => {
    try {
      const value = schema.parse(req[property]);

      if (property === "body") {
        req.body = value;
      } else if (property === "params") {
        try {
          req.params = value;
        } catch (e) {
          Object.assign(req.params, value);
        }
      } else if (property === "query") {
        // Safe assignment for query params as well
        try {
          req.query = value;
        } catch (e) {
          Object.assign(req.query, value);
        }
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        }));
        return next(new ValidationError("Validation failed", details));
      }
      return next(error);
    }
  };
};
