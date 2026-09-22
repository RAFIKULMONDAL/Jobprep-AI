const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");

// For tests that aren't specifically testing the auth/email flow (reports,
// AI routes), we don't want every test file to also deal with mocking
// emails and verifying accounts - we just need "a logged-in user" as a
// starting point. This creates one directly, already verified.
async function createVerifiedUserAndToken({
  name = "Test User",
  email = "test@example.com",
  password = "password123",
} = {}) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: true,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { user, token };
}

module.exports = { createVerifiedUserAndToken };
