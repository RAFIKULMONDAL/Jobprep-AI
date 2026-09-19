import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getReportById } from "../api/report.api";
import { generateAtsResume, downloadAtsResumePdf } from "../api/ai.api";
import Loader from "../components/Loader";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleGenerateResume() {
    setGenerating(true);
    setError("");
    try {
      await generateAtsResume(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate resume.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      await downloadAtsResumePdf(id);
    } catch (err) {
      setError("Could not download the PDF.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <Loader />;
  if (!report) return <p className="text-muted">Report not found.</p>;

  return (
    <div className="space-y-6">
      {error && (
        <p className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded">
          {error}
        </p>
      )}

      <div className="bg-surface border border-line p-6 rounded-xl">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl font-bold text-ink2">Skill-Gap Report</h1>
          <span className="text-3xl font-extrabold text-accent">
            {report.matchScore}%
          </span>
        </div>
        <p className="text-ink2/80 mb-4">{report.summary}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-success mb-2">Matched Skills</h3>
            <div className="flex flex-wrap gap-2">
              {report.matchedSkills?.map((s) => (
                <span
                  key={s}
                  className="bg-success/10 border border-success/30 text-success text-xs px-2 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-danger mb-2">Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {report.missingSkills?.map((s) => (
                <span
                  key={s}
                  className="bg-danger/10 border border-danger/30 text-danger text-xs px-2 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          to={`/reports/${id}/interview-prep`}
          className="bg-accent text-ink px-4 py-2 rounded-md text-sm font-bold hover:bg-accentHover transition-colors"
        >
          Generate Interview Questions
        </Link>

        {report.atsResumeHtml ? (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-surface border border-line text-ink2 px-4 py-2 rounded-md text-sm font-medium hover:bg-surfaceHover disabled:opacity-50 transition-colors"
          >
            {downloading ? "Preparing PDF..." : "Download ATS Resume PDF"}
          </button>
        ) : (
          <button
            onClick={handleGenerateResume}
            disabled={generating}
            className="bg-surface border border-line text-ink2 px-4 py-2 rounded-md text-sm font-medium hover:bg-surfaceHover disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating..." : "Generate ATS Resume"}
          </button>
        )}
      </div>
    </div>
  );
}
