// Wraps an async controller so any thrown error / rejected promise
// is forwarded to Express's error-handling middleware instead of
// crashing the server or requiring try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
