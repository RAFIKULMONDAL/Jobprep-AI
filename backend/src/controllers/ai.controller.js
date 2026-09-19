const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Report = require("../models/Report");
const { extractTextFromPdf } = require("../services/resumeParser.service");
const {
  analyzeSkillGap,
  generateInterviewQuestions,
  generateAtsResume,
} = require("../services/gemini.service");
const { generatePdfFromHtml } = require("../services/pdf.service");

// POST /api/ai/analyze  (multipart: resume file + jobDescription field)
const analyzeResume = asyncHandler(async (req, res) => {
  const { jobDescription } = req.body;

  if (!jobDescription || jobDescription.trim().length < 30) {
    throw new ApiError(400, "Please provide a more complete job description");
  }
  if (!req.file) {
    throw new ApiError(400, "A resume PDF file is required");
  }

  const resumeText = await extractTextFromPdf(req.file.buffer);
  if (!resumeText || resumeText.trim().length < 50) {
    throw new ApiError(400, "Could not extract readable text from this PDF. Try a different file.");
  }

  const result = await analyzeSkillGap(resumeText, jobDescription);

  const report = await Report.create({
    user: req.user._id,
    resumeText,
    jobDescription,
    matchScore: result.matchScore,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    summary: result.summary,
  });

  res.status(201).json({ success: true, data: report });
});

// POST /api/ai/:id/interview-questions
const createInterviewQuestions = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, "Report not found");

  const result = await generateInterviewQuestions(report.resumeText, report.jobDescription);
  report.interviewQuestions = result.questions;
  await report.save();

  res.json({ success: true, data: report });
});

// POST /api/ai/:id/ats-resume
const createAtsResume = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, "Report not found");

  const result = await generateAtsResume(report.resumeText, report.jobDescription);
  report.atsResumeHtml = result.html;
  await report.save();

  res.json({ success: true, data: report });
});

// GET /api/ai/:id/ats-resume/download
const downloadAtsResumePdf = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, "Report not found");
  if (!report.atsResumeHtml) {
    throw new ApiError(400, "Generate the ATS resume before downloading");
  }

  const pdfBuffer = await generatePdfFromHtml(report.atsResumeHtml);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="ats-resume-${report._id}.pdf"`,
  });
  res.send(pdfBuffer);
});

module.exports = {
  analyzeResume,
  createInterviewQuestions,
  createAtsResume,
  downloadAtsResumePdf,
};
