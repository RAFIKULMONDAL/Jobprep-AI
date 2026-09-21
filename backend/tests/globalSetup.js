const { MongoMemoryServer } = require("mongodb-memory-server");

// Runs ONCE for the entire test run (not once per test file), so the
// MongoDB binary is only downloaded/started a single time and every
// test file shares the same in-memory instance.
module.exports = async function () {
  const mongod = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  global.__MONGOD__ = mongod;
  process.env.MONGO_TEST_URI = mongod.getUri();
};
