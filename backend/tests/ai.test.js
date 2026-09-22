process.env.JWT_SECRET = "test_secret_for_jest_only";

// Mock the Gemini and PDF-parsing services entirely - tests should never
// make a real network call to Google, cost real API quota, or depend on
// Gemini's servers being up. We're testing OUR code (routing, auth,
// validation, database writes), not Google's API.
jest.mock("../src/services/gemini.service", () => ({
  analyzeSkillGap: jest.fn().mockResolvedValue({
    matchScore: 82,
    matchedSkills: ["JavaScript", "React"],
    missingSkills: ["Kubernetes"],
    summary: "Strong frontend fit, limited DevOps exposure.",
  }),
  generateInterviewQuestions: jest.fn().mockResolvedValue({
    questions: [
      {
        question: "Tell me about a challenging bug you fixed.",
        type: "behavioral",
        idealAnswerTips: "Use the STAR method.",
        suggestedAnswer: "In my last project, I noticed a memory leak...",
      },
    ],
  }),
  generateAtsResume: jest.fn().mockResolvedValue({
    html: "<html><body><h1>Test Resume</h1></body></html>",
  }),
}));

jest.mock("../src/services/resumeParser.service", () => ({
  extractTextFromPdf: jest
    .fn()
    .mockResolvedValue(
      "John Doe - Frontend developer with 4 years of experience in JavaScript and React."
    ),
}));

const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, closeTestDB, clearTestDB } = require("./setup");
const { createVerifiedUserAndToken } = require("./testHelpers");

let token;

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

beforeEach(async () => {
  const { token: newToken } = await createVerifiedUserAndToken({
    name: "AI Tester",
    email: "ai@example.com",
  });
  token = newToken;
});

const fakePdf = Buffer.from("%PDF-1.4 fake pdf content for testing");

describe("POST /api/ai/analyze", () => {
  test("rejects the request without authentication", async () => {
    const res = await request(app).post("/api/ai/analyze");
    expect(res.status).toBe(401);
  });

  test("rejects the request without a resume file", async () => {
    const res = await request(app)
      .post("/api/ai/analyze")
      .set("Authorization", `Bearer ${token}`)
      .field("jobDescription", "A".repeat(40));

    expect(res.status).toBe(400);
  });

  test("rejects a job description that's too short", async () => {
    const res = await request(app)
      .post("/api/ai/analyze")
      .set("Authorization", `Bearer ${token}`)
      .field("jobDescription", "too short")
      .attach("resume", fakePdf, { filename: "resume.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(400);
  });

  test("rejects a non-PDF file", async () => {
    const res = await request(app)
      .post("/api/ai/analyze")
      .set("Authorization", `Bearer ${token}`)
      .field("jobDescription", "A".repeat(40))
      .attach("resume", Buffer.from("not a pdf"), {
        filename: "resume.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });

  test("analyzes a resume against a job description using the mocked AI service", async () => {
    const res = await request(app)
      .post("/api/ai/analyze")
      .set("Authorization", `Bearer ${token}`)
      .field(
        "jobDescription",
        "We need a frontend developer skilled in React and Kubernetes deployment."
      )
      .attach("resume", fakePdf, { filename: "resume.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(201);
    expect(res.body.data.matchScore).toBe(82);
    expect(res.body.data.missingSkills).toContain("Kubernetes");
  });
});

describe("POST /api/ai/:id/interview-questions", () => {
  test("returns 404 for a report that doesn't exist", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .post(`/api/ai/${fakeId}/interview-questions`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("generates interview questions for an existing report using the mocked AI", async () => {
    const analyzeRes = await request(app)
      .post("/api/ai/analyze")
      .set("Authorization", `Bearer ${token}`)
      .field("jobDescription", "We need a frontend developer skilled in React.")
      .attach("resume", fakePdf, { filename: "resume.pdf", contentType: "application/pdf" });

    const reportId = analyzeRes.body.data._id;

    const res = await request(app)
      .post(`/api/ai/${reportId}/interview-questions`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.interviewQuestions).toHaveLength(1);
    expect(res.body.data.interviewQuestions[0].type).toBe("behavioral");
  });
});
