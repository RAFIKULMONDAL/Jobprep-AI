const mongoose = require("mongoose");

// The actual MongoDB instance is started once in globalSetup.js - this
// file just connects/disconnects/clears data for each individual test
// file, reusing that same shared instance via MONGO_TEST_URI.
async function connectTestDB() {
  await mongoose.connect(process.env.MONGO_TEST_URI);
}

async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connectTestDB, closeTestDB, clearTestDB };
