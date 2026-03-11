const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max 100 requests per windowMs per IP
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests, please try again later',
  },
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit] IP ${req.ip} exceeded limit on ${req.method} ${req.path}`);
    res.status(429).json(options.message);
  },
});

module.exports = rateLimitMiddleware;
