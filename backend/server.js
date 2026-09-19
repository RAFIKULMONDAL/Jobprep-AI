require("dotenv").config();

// Windows dev-machine workaround: some networks/ISPs block or fail the DNS
// SRV lookup that "mongodb+srv://" URIs need. Pointing Node's resolver at
// Cloudflare's DNS fixes this locally. Safe to remove once deployed to a
// host with reliable DNS (Render/Railway/etc. usually don't need this).
const dns = require("dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/error.middleware");

const authRoutes = require("./src/routes/auth.routes");
const aiRoutes = require("./src/routes/ai.routes");
const reportRoutes = require("./src/routes/report.routes");

const app = express();

connectDB();

// Render (and most hosting platforms) put our app behind a reverse proxy,
// which sets the "X-Forwarded-For" header to carry the visitor's real IP.
// By default Express doesn't trust that header (a sensible default - it
// can be spoofed by direct requests otherwise) - but our rate limiter
// needs the real IP to work correctly, so we explicitly trust the first
// proxy hop, which is exactly what Render's setup is.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// centralized error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Catch anything that slips past our error middleware entirely
// (e.g. a genuinely unexpected crash), so it's visible in logs
// instead of silently killing the process with no trace.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});