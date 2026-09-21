process.env.JWT_SECRET = "test_secret_for_jest_only";

const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, closeTestDB, clearTestDB } = require("./setup");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

const validUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

describe("POST /api/auth/register", () => {
  test("registers a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data).not.toHaveProperty("password"); // never leak the hash
  });

  test("rejects registration with missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
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
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  test("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
  });

  test("rejects an incorrect password", async () => {
    await request(app).post("/api/auth/register").send(validUser);

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
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const token = registerRes.body.data.token;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
  });
});
