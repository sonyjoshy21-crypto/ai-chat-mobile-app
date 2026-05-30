const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoURI = process.env.MONGODB_URI;

const run = async () => {
  console.log("=== 🔍 DATABASE INTEGRITY CHECK ===\n");

  // 1. Check Local File DB Status
  const localDbPath = path.join(__dirname, 'models', 'local_db.json');
  console.log("📁 Checking local database file...");
  if (fs.existsSync(localDbPath)) {
    try {
      const localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      const uCount = localData.users ? localData.users.length : 0;
      const mCount = localData.messages ? localData.messages.length : 0;
      console.log(` ✅ local_db.json found!`);
      console.log(`   - Users stored locally: ${uCount}`);
      console.log(`   - Messages stored locally: ${mCount}`);
      
      if (uCount > 0) {
        console.log("   --- Local Users List ---");
        localData.users.forEach((u, i) => console.log(`     [User ${i+1}] Name: ${u.name} | Email: ${u.email}`));
      }
      if (mCount > 0) {
        console.log("   --- Local Messages List ---");
        localData.messages.forEach((m, i) => console.log(`     [Msg ${i+1}] ${m.sender.toUpperCase()}: "${m.text}"`));
      }
    } catch (e) {
      console.error(` ❌ Error parsing local_db.json: ${e.message}`);
    }
  } else {
    console.log(" ℹ️ No local_db.json file has been generated yet.");
  }

  console.log("\n------------------------------------\n");

  // 2. Check Online MongoDB Atlas Status
  if (!mongoURI) {
    console.log("❌ MONGODB_URI not found in backend/.env file.");
    return;
  }

  const redactedURI = mongoURI.replace(/:([^@]+)@/, ':******@');
  console.log(`🌐 Connecting to Online MongoDB Atlas: ${redactedURI}`);

  try {
    // Force timeout after 4 seconds
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 4000 });
    console.log(" ✅ Connected successfully to MongoDB Atlas!");

    const { MongooseUser } = require('./models/User');
    const { MongooseMessage } = require('./models/Message');

    const usersCount = await MongooseUser.countDocuments();
    const messagesCount = await MongooseMessage.countDocuments();

    console.log(`\nStatistics in Atlas Cluster:`);
    console.log(`   - Users: ${usersCount}`);
    console.log(`   - Messages: ${messagesCount}`);

    if (usersCount > 0) {
      console.log(`   --- Atlas Users List ---`);
      const users = await MongooseUser.find({}).lean();
      users.forEach((u, i) => {
        console.log(`     [User ${i + 1}] ID: ${u._id} | Name: ${u.name} | Email: ${u.email}`);
      });
    }

    if (messagesCount > 0) {
      console.log(`   --- Atlas Messages List ---`);
      const messages = await MongooseMessage.find({}).sort({ createdAt: 1 }).lean();
      messages.forEach((m, i) => {
        console.log(`     [Msg ${i + 1}] ${m.sender.toUpperCase()}: "${m.text}"`);
      });
    }

  } catch (err) {
    console.log(` ❌ Failed to connect to MongoDB Atlas: ${err.message}`);
    console.log(" (Note: The server will fall back to local_db.json file logging)");
  } finally {
    await mongoose.disconnect();
    console.log("\n====================================");
  }
};

run();
