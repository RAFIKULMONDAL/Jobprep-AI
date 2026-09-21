const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const aiRoutes = require("./routes/ai.routes");
const reportRoutes = require("./routes/report.routes");

// This file only builds and configures the Express app - it never connects
// to the database or starts listening. That separation is what lets tests
// import the app directly (via supertest) without needing a real server
// process or a real MongoDB connection.
const app = express();

// Render (and most hosting platforms) put our app behind a reverse proxy,
// which sets the "X-Forwarded-For" header to carry the visitor's real IP.
// We trust the first proxy hop so express-rate-limit can identify users
// correctly.
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

module.exports = app;
