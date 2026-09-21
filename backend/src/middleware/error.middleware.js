const ApiError = require("../utils/ApiError");

// Centralized error handler - MUST be registered last in server.js.
// Never leaks stack traces to the client.
function errorHandler(err, req, res, next) {
  // Multer's own errors (e.g. file too large) aren't ApiError instances,
  // but they're still the client's mistake, not a server failure -
  // translate them into a clean 400 instead of falling through to 500.
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "That file is too large. Please upload a resume under 5MB."
          : `Upload error: ${err.message}`,
    });
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message =
    err instanceof ApiError ? err.message : "Something went wrong on the server";

  // Always log the real error server-side (this never reaches the client -
  // it's just our own Render/terminal logs) so we can actually debug
  // production issues. Only the *response sent to the browser* hides
  // details in production, via `message` above.
  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
