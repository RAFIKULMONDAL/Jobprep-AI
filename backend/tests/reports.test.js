process.env.JWT_SECRET = "test_secret_for_jest_only";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Report = require("../src/models/Report");
const { connectTestDB, closeTestDB, clearTestDB } = require("./setup");

let token;
let userId;

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Report Tester",
    email: "reports@example.com",
    password: "password123",
  });
  token = res.body.data.token;
  userId = res.body.data.id;
});

describe("GET /api/reports", () => {
  test("returns an empty list for a user with no reports", async () => {
    const res = await request(app).get("/api/reports").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("only returns the authenticated user's own reports", async () => {
    await Report.create({
      user: userId,
      resumeText: "some resume text",
      jobDescription: "some job description",
      matchScore: 80,
    });

    // A report belonging to a different user should never show up here
    await Report.create({
      user: new mongoose.Types.ObjectId(),
      resumeText: "someone else's resume",
      jobDescription: "someone else's job description",
      matchScore: 40,
    });

    const res = await request(app).get("/api/reports").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].matchScore).toBe(80);
  });

  test("rejects the request without a valid token", async () => {
    const res = await request(app).get("/api/reports");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/reports/:id", () => {
  test("returns a single report by id", async () => {
    const report = await Report.create({
      user: userId,
      resumeText: "resume text",
      jobDescription: "job description",
      matchScore: 75,
    });

    const res = await request(app)
      .get(`/api/reports/${report._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.matchScore).toBe(75);
  });

  test("returns 404 for a report belonging to a different user", async () => {
    const report = await Report.create({
      user: new mongoose.Types.ObjectId(),
      resumeText: "resume text",
      jobDescription: "job description",
      matchScore: 60,
    });

    const res = await request(app)
      .get(`/api/reports/${report._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("returns 404 for a report id that doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/reports/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/reports/:id", () => {
  test("deletes a report the user owns", async () => {
    const report = await Report.create({
      user: userId,
      resumeText: "resume text",
      jobDescription: "job description",
      matchScore: 50,
    });

    const res = await request(app)
      .delete(`/api/reports/${report._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const stillExists = await Report.findById(report._id);
    expect(stillExists).toBeNull();
  });

  test("cannot delete a report belonging to a different user", async () => {
    const report = await Report.create({
      user: new mongoose.Types.ObjectId(),
      resumeText: "resume text",
      jobDescription: "job description",
      matchScore: 50,
    });

    const res = await request(app)
      .delete(`/api/reports/${report._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);

    const stillExists = await Report.findById(report._id);
    expect(stillExists).not.toBeNull(); // untouched
  });
});
