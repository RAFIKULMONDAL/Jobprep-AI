process.env.JWT_SECRET = "test_secret_for_jest_only";
process.env.CLIENT_URL = "http://localhost:5173";

// Never send real emails during tests - mock the email service entirely,
// and capture what it was called with so we can pull the raw token out
// of the URL it would have emailed to the user.
jest.mock("../src/services/email.service", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const app = require("../src/app");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../src/services/email.service");
const { connectTestDB, closeTestDB, clearTestDB } = require("./setup");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
});

afterAll(async () => {
  await closeTestDB();
});

const validUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

// Pulls the raw token out of the URL passed to the mocked email functions
// (e.g. ".../verify-email/abc123" -> "abc123"), simulating "the user
// clicked the link in their email."
function tokenFromMockUrl(mockFn) {
  const url = mockFn.mock.calls[0][2];
  return url.split("/").pop();
}

describe("POST /api/auth/register", () => {
  test("creates an unverified account and sends a verification email", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeUndefined(); // no token yet - not verified
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  test("rejects registration with missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
  });

  test("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, password: "123" });
    expect(res.status).toBe(400);
  });

  test("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(409);
  });
});

describe("GET /api/auth/verify-email/:token", () => {
  test("verifies the account and logs the user in", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const token = tokenFromMockUrl(sendVerificationEmail);

    const res = await request(app).get(`/api/auth/verify-email/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token"); // JWT issued
    expect(res.body.data.email).toBe(validUser.email);
  });

  test("rejects an invalid/unknown token", async () => {
    const res = await request(app).get("/api/auth/verify-email/not-a-real-token");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  test("rejects login before the account is verified", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(403);
  });

  test("logs in with correct credentials once verified", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const token = tokenFromMockUrl(sendVerificationEmail);
    await request(app).get(`/api/auth/verify-email/${token}`);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
  });

  test("rejects an incorrect password", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const verifyToken = tokenFromMockUrl(sendVerificationEmail);
    await request(app).get(`/api/auth/verify-email/${verifyToken}`);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  test("rejects a login for an email that was never registered", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password and reset-password", () => {
  async function registerAndVerify() {
    await request(app).post("/api/auth/register").send(validUser);
    const token = tokenFromMockUrl(sendVerificationEmail);
    await request(app).get(`/api/auth/verify-email/${token}`);
  }

  test("sends a reset email for a registered address", async () => {
    await registerAndVerify();

    const res = await request(app).post("/api/auth/forgot-password").send({ email: validUser.email });

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  test("returns the same success response even for an unregistered email (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "doesnotexist@example.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test("resets the password and allows login with the new password", async () => {
    await registerAndVerify();
    await request(app).post("/api/auth/forgot-password").send({ email: validUser.email });
    const resetToken = tokenFromMockUrl(sendPasswordResetEmail);

    const resetRes = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({ password: "newpassword456" });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "newpassword456" });
    expect(loginRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(oldLoginRes.status).toBe(401);
  });

  test("rejects an invalid/expired reset token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/not-a-real-token")
      .send({ password: "newpassword456" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  test("rejects a request with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("rejects a request with an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  test("returns the logged-in user's profile with a valid token", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const verifyToken = tokenFromMockUrl(sendVerificationEmail);
    const verifyRes = await request(app).get(`/api/auth/verify-email/${verifyToken}`);
    const token = verifyRes.body.data.token;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data).not.toHaveProperty("verificationToken"); // never leaked
  });
});
