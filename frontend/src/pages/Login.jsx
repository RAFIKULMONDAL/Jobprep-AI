import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, resendVerification } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendSent(false);
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 403) {
        setNeedsVerification(true);
      }
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      await resendVerification(form.email);
      setResendSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl">
      <h1 className="text-2xl font-bold text-ink2 mb-6">Login</h1>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded mb-4">
          <p>{error}</p>
          {needsVerification && !resendSent && (
            <button
              onClick={handleResend}
              disabled={loading}
              className="mt-2 text-accent font-medium underline disabled:opacity-50"
            >
              Resend verification email
            </button>
          )}
          {resendSent && <p className="mt-2 text-ink2">Verification email sent - check your inbox.</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          required
          placeholder="Password"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-muted hover:text-accent transition-colors">
            Forgot password?
          </Link>
        </div>
        <button
          disabled={loading}
          className="w-full bg-accent text-ink font-bold py-2 rounded-md hover:bg-accentHover disabled:opacity-50 transition-colors"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-sm mt-4 text-muted">
        No account?{" "}
        <Link to="/register" className="text-accent font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}
