const ApiError = require("../utils/ApiError");

// Centralized error handler - MUST be registered last in server.js.
// Never leaks stack traces to the client.
function errorHandler(err, req, res, next) {
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