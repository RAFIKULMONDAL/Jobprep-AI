const express = require("express");
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { authEmailLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", authEmailLimiter, resendVerification);
router.post("/login", login);
router.post("/forgot-password", authEmailLimiter, forgotPassword);
router.post("/reset-password/:token", authEmailLimiter, resetPassword);
router.get("/me", protect, getMe);

module.exports = router;
