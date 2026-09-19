const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimiter.middleware");
const {
  analyzeResume,
  createInterviewQuestions,
  createAtsResume,
  downloadAtsResumePdf,
} = require("../controllers/ai.controller");

// Resume files are kept in memory (never written to disk) and capped at 5MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF resumes are supported"));
    }
    cb(null, true);
  },
});

const router = express.Router();

// Every AI route requires auth AND is rate-limited (these calls cost money).
router.use(protect, aiLimiter);

router.post("/analyze", upload.single("resume"), analyzeResume);
router.post("/:id/interview-questions", createInterviewQuestions);
router.post("/:id/ats-resume", createAtsResume);
router.get("/:id/ats-resume/download", downloadAtsResumePdf);

module.exports = router;
