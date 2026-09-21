// Runs ONCE after the entire test run finishes, shutting down the shared
// MongoDB instance started in globalSetup.js.
module.exports = async function () {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
