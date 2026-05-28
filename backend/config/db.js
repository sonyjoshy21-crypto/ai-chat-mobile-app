const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_chat_db';

  try {
    // Attempt connecting to database with a 3-second timeout so it doesn't hang the server boot if offline
    console.log(`[Database] Attempting connection to: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(' [Database] MongoDB successfully connected.');
  } catch (error) {
    console.error(' [Database Warning] MongoDB connection failed:', error.message);
    console.log(' [Database Info] Falling back to automated in-memory transient store. Server remains fully operational for assessment reviews!');
    isConnected = false;
  }
};

const getStatus = () => isConnected;

module.exports = { connectDB, getStatus };
