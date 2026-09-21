require("dotenv").config();

// Windows dev-machine workaround: some networks/ISPs block or fail the DNS
// SRV lookup that "mongodb+srv://" URIs need. Pointing Node's resolver at
// Cloudflare's DNS fixes this locally. Safe to remove once deployed to a
// host with reliable DNS (Render/Railway/etc. usually don't need this).
const dns = require("dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const connectDB = require("./src/config/db");
const app = require("./src/app");

connectDB();

// Catch anything that slips past our error middleware entirely
// (e.g. a genuinely unexpected crash), so it's visible in logs
// instead of silently killing the process with no trace.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
