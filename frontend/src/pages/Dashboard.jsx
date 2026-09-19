import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReports, deleteReport } from "../api/report.api";
import Loader from "../components/Loader";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (err) {
      setError("Could not load your reports. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    await deleteReport(id);
    load();
  }

  if (loading) return <Loader />;

  const avgScore = reports.length
    ? Math.round(
        reports.reduce((sum, r) => sum + (r.matchScore || 0), 0) / reports.length
      )
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink2">Dashboard</h1>
        <Link
          to="/analyze"
          className="bg-accent text-ink px-4 py-2 rounded-md text-sm font-bold hover:bg-accentHover transition-colors"
        >
          + New Analysis
        </Link>
      </div>

      {error && (
        <p className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-line p-4 rounded-xl">
          <p className="text-sm text-muted">Total reports</p>
          <p className="text-2xl font-bold text-ink2">{reports.length}</p>
        </div>
        <div className="bg-surface border border-line p-4 rounded-xl">
          <p className="text-sm text-muted">Average match score</p>
          <p className="text-2xl font-bold text-accent">{avgScore}%</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-muted bg-surface border border-line rounded-xl">
          No reports yet.{" "}
          <Link to="/analyze" className="text-accent font-medium">
            Run your first analysis
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-surface border border-line p-4 rounded-xl flex justify-between items-center hover:border-accent/40 transition-colors"
            >
              <div>
                <p className="font-medium text-ink2">{r.jobDescription?.slice(0, 70)}...</p>
                <p className="text-sm text-muted">
                  Match score: <span className="text-accent font-semibold">{r.matchScore}%</span> ·{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3 shrink-0 ml-4">
                <Link to={`/reports/${r._id}`} className="text-accent text-sm font-medium">
                  View
                </Link>
                <button
                  onClick={() => handleDelete(r._id)}
                  className="text-danger text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
