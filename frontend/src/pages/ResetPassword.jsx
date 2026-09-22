import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../api/auth.api";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl text-center">
        <h1 className="text-xl font-bold text-success mb-2">Password reset!</h1>
        <p className="text-muted text-sm">Taking you to the login page...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl">
      <h1 className="text-2xl font-bold text-ink2 mb-6">Reset password</h1>

      {error && (
        <p className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder="New password (min 6 characters)"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Confirm new password"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full bg-accent text-ink font-bold py-2 rounded-md hover:bg-accentHover disabled:opacity-50 transition-colors"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="text-sm mt-4 text-muted">
        <Link to="/login" className="text-accent font-medium">
          Back to login
        </Link>
      </p>
    </div>
  );
}
