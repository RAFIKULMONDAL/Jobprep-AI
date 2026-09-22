import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/auth.api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl text-center">
        <h1 className="text-2xl font-bold text-ink2 mb-3">Check your email</h1>
        <p className="text-muted text-sm">
          We sent a verification link to <span className="text-ink2 font-medium">{form.email}</span>.
          Click it to activate your account, then come back and log in.
        </p>
        <Link to="/login" className="inline-block mt-6 text-accent font-medium text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl">
      <h1 className="text-2xl font-bold text-ink2 mb-6">Create account</h1>

      {error && (
        <p className="bg-danger/10 border border-danger/30 text-danger text-sm p-2 rounded mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Name"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
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
          placeholder="Password (min 6 characters)"
          className="w-full bg-ink border border-line rounded-md px-3 py-2 text-ink2 placeholder:text-muted focus:outline-none focus:border-accent"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          disabled={loading}
          className="w-full bg-accent text-ink font-bold py-2 rounded-md hover:bg-accentHover disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm mt-4 text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-accent font-medium">
          Login
        </Link>
      </p>
    </div>
  );
}
