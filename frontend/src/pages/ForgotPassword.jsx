import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } finally {
      // Always show the same confirmation, whether or not the email
      // exists - this matches the backend's deliberate no-enumeration
      // behavior.
      setSubmitted(true);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl text-center">
        <h1 className="text-xl font-bold text-ink2 mb-3">Check your email</h1>
        <p className="text-muted text-sm">
          If an account exists for <span className="text-ink2 font-medium">{email}</span>, we've sent a
          password reset link. It expires in 1 hour.
        </p>
        <Link to="/login" className="inline-block mt-6 text-accent font-medium text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl">
      <h1 className="text-2xl font-bold text-ink2 mb-2">Forgot password</h1>
      <p className="text-sm text-muted mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full bg-accent text-ink font-bold py-2 rounded-md hover:bg-accentHover disabled:opacity-50 transition-colors"
        >
          {loading ? "Sending..." : "Send reset link"}
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
