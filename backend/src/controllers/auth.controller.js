const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email.service");

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Tokens sent by email are random and unguessable, but we never store the
// raw value in the database - only its hash. If the database were ever
// leaked, the tokens inside it would be useless to an attacker.
function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are all required");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    verificationToken: hashToken(rawToken),
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  try {
    await sendVerificationEmail(user.email, user.name, verifyUrl);
  } catch (err) {
    // Don't fail the whole registration just because the email didn't
    // send - the user can request a resend. But log it so we notice.
    console.error("Failed to send verification email:", err);
  }

  res.status(201).json({
    success: true,
    message: "Account created. Please check your email to verify your account before logging in.",
  });
});

// GET /api/auth/verify-email/:token
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: hashToken(token),
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "This verification link is invalid or has expired. Please request a new one.");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  // Log the user straight in after verifying - nicer UX than making them
  // verify and then separately log in.
  res.json({
    success: true,
    message: "Email verified successfully.",
    data: { ...publicUser(user), token: generateToken(user._id) },
  });
});

// POST /api/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && !user.isVerified) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = hashToken(rawToken);
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
    try {
      await sendVerificationEmail(user.email, user.name, verifyUrl);
    } catch (err) {
      console.error("Failed to resend verification email:", err);
    }
  }

  // Same response whether or not the account exists/is already verified -
  // prevents leaking which emails are registered.
  res.json({
    success: true,
    message: "If an account with that email exists and isn't verified yet, a new verification link has been sent.",
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in. Check your inbox for the verification link.");
  }

  res.json({
    success: true,
    data: { ...publicUser(user), token: generateToken(user._id) },
  });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  // Same response whether or not the email exists - this is deliberate:
  // it stops an attacker from using this endpoint to discover which
  // emails are registered in our system.
  res.json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
  });
});

// POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "This password reset link is invalid or has expired. Please request a new one.");
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password.",
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};
