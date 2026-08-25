const mongoose = require('mongoose');

// Establishes the MongoDB connection using the MONGO_URI environment variable.
// Using an env var keeps credentials and host details out of source code,
// making the app configurable per environment (dev, staging, production).
// process.exit(1) halts the server if the database cannot be reached,
// preventing the app from running in a degraded state.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
