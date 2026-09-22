import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { verifyEmail } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function run() {
      try {
        const res = await verifyEmail(token);
        login(res.data, res.data.token);
        setStatus("success");
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      }
    }
    run();
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface border border-line p-8 rounded-xl text-center">
      {status === "verifying" && (
        <>
          <h1 className="text-xl font-bold text-ink2 mb-4">Verifying your email...</h1>
          <Loader />
        </>
      )}
      {status === "success" && (
        <>
          <h1 className="text-xl font-bold text-success mb-2">Email verified!</h1>
          <p className="text-muted text-sm">Taking you to your dashboard...</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-xl font-bold text-danger mb-2">Verification failed</h1>
          <p className="text-muted text-sm mb-4">{message}</p>
          <Link to="/login" className="text-accent font-medium text-sm">
            Back to login
          </Link>
        </>
      )}
    </div>
  );
}
