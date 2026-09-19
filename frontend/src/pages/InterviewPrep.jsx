import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReportById } from "../api/report.api";
import { generateInterviewQuestions } from "../api/ai.api";
import Loader from "../components/Loader";

export default function InterviewPrep() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await getReportById(id);
      setReport(res.data);
    } catch (err) {
      setError("Could not load this report.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setRevealed({});
    try {
      await generateInterviewQuestions(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate questions.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleAnswer(i) {
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  if (loading) return <Loader />;
  if (!report) return <p className="text-muted">Report not found.</p>;

  return (
    <div className="bg-surface border border-line p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-ink2">Interview Prep</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-accent text-ink px-4 py-2 rounded-md text-sm font-bold hover:bg-accentHover disabled:opacity-50 transition-colors"
        >
          {generating ? "Generating..." : "Generate Questions"}
        </button>
      </div>

      {error && (
        <p className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      {!report.interviewQuestions || report.interviewQuestions.length === 0 ? (
        <p className="text-muted">
          No questions yet. Click "Generate Questions" to create a set tailored
          to this job description.
        </p>
      ) : (
        <div className="space-y-4">
          {report.interviewQuestions.map((q, i) => (
            <div key={i} className="border border-line rounded-lg p-4 bg-ink">
              <span className="text-xs uppercase text-accent font-semibold">
                {q.type}
              </span>
              <p className="font-medium text-ink2 mt-1">{q.question}</p>
              {q.idealAnswerTips && (
                <p className="text-sm text-muted mt-2">💡 {q.idealAnswerTips}</p>
              )}

              {q.suggestedAnswer && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleAnswer(i)}
                    className="text-sm font-medium text-accent hover:text-accentHover transition-colors"
                  >
                    {revealed[i] ? "Hide sample answer" : "Show sample answer"}
                  </button>
                  {revealed[i] && (
                    <div className="mt-2">
                      <p className="text-sm text-ink2/90 bg-surface border border-line rounded-md p-3 leading-relaxed">
                        {q.suggestedAnswer}
                      </p>
                      <p className="text-xs text-muted mt-1.5">
                        ⚠ AI-generated based on your resume. Double-check any names, numbers, or dates before using this in a real interview.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
