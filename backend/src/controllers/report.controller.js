const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Report = require("../models/Report");

// GET /api/reports  (list, excludes heavy fields for a fast dashboard load)
const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ user: req.user._id })
    .select("-resumeText -atsResumeHtml")
    .sort("-createdAt");

  res.json({ success: true, data: reports });
});

// GET /api/reports/:id
const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, "Report not found");

  res.json({ success: true, data: report });
});

// DELETE /api/reports/:id
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, "Report not found");

  res.json({ success: true, message: "Report deleted" });
});

module.exports = { getReports, getReportById, deleteReport };
