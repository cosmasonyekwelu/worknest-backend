export const compressionOptions = {
  level: 9,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;

    const type = res.getHeader("Content-Type");
    const shouldCompress = ![
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/octet-stream",
      "application/pdf",
      "application/zip",
      "application/x-gzip",
    ].some((t) => type?.startsWith(t));

    return shouldCompress;
  },
  chunkSize: 16384,
  threshold: 1024,
};

const isDevelopment = process.env.NODE_ENV === "development";

export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDevelopment ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] : ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isDevelopment ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: process.env.NODE_ENV === "production",
  },
  frameguard: { action: "deny" },
  xssFilter: true,
  noSniff: true,
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  hidePoweredBy: true,
  ieNoOpen: true,
};
