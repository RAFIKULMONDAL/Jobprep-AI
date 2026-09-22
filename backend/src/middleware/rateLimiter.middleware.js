const rateLimit = require("express-rate-limit");

// AI calls cost money and take time, so we cap how often
// one client can hit them.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests. Please try again in a few minutes.",
  },
});

// Verification/reset emails cost real email-sending quota and could be
// abused to spam someone's inbox - cap how often these can be triggered.
const authEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in a few minutes.",
  },
});

module.exports = { aiLimiter, authEmailLimiter };
