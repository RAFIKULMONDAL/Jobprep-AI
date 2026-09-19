const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["technical", "behavioral"], required: true },
    idealAnswerTips: { type: String },
    suggestedAnswer: { type: String },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },

    // Skill-gap analysis output
    matchScore: { type: Number, min: 0, max: 100 },
    matchedSkills: [String],
    missingSkills: [String],
    summary: String,

    // Interview prep output
    interviewQuestions: [interviewQuestionSchema],

    // ATS resume output (rendered HTML, converted to PDF on download)
    atsResumeHtml: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
