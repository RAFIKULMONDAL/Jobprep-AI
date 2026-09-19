import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-ink border-b border-line px-6 py-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl text-ink2 tracking-tight">
        Job Prep <span className="text-accent">AI</span>
      </Link>
      <div className="flex gap-5 items-center">
        {user ? (
          <>
            <Link to="/dashboard" className="text-muted hover:text-ink2 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/analyze" className="text-muted hover:text-ink2 text-sm font-medium transition-colors">
              New Analysis
            </Link>
            <button
              onClick={handleLogout}
              className="bg-surface border border-line text-ink2 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-surfaceHover transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-muted hover:text-ink2 text-sm font-medium transition-colors">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-accent text-ink px-3 py-1.5 rounded-md text-sm font-bold hover:bg-accentHover transition-colors"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
