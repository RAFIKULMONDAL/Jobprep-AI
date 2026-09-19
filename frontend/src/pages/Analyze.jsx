import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeResume } from "../api/ai.api";

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) return setError("Please upload your resume as a PDF");
    if (jobDescription.trim().length < 30)
      return setError("Paste a more complete job description (30+ characters)");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      const res = await analyzeResume(formData);
      navigate(`/reports/${res.data._id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-line p-8 rounded-xl max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink2 mb-2">New Skill-Gap Analysis</h1>
      <p className="text-sm text-muted mb-6">
        Upload your resume and paste a job description. Gemini will compare
        them and generate a match score and skill gap report.
      </p>

      {error && (
        <p className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink2 mb-1">Resume (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm text-muted file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-line file:bg-ink file:text-ink2 file:text-sm file:font-medium hover:file:bg-surfaceHover"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink2 mb-1">Job Description</label>
          <textarea
            rows={8}
            className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-accent text-ink font-bold py-2 rounded-md hover:bg-accentHover disabled:opacity-50 transition-colors"
        >
          {loading ? "Analyzing with AI (this can take ~10-20s)..." : "Analyze"}
        </button>
      </form>
    </div>
  );
}
