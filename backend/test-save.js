const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("Error: MONGODB_URI is not defined in backend/.env file.");
  process.exit(1);
}

const run = async () => {
  const redactedURI = mongoURI.replace(/:([^@]+)@/, ':******@');
  console.log(`Connecting to MongoDB Atlas at: ${redactedURI}`);

  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Connected successfully to MongoDB Atlas!");

    // Load Mongoose schemas
    const { MongooseUser } = require('./models/User');
    const { MongooseMessage } = require('./models/Message');

    // 1. Create a Test User
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const testUserData = {
      name: `TestUser_${uniqueSuffix}`,
      email: `test_${uniqueSuffix}@gmail.com`,
      password: "password123" // The pre-save hook in UserSchema will hash this
    };

    console.log(`\n1. Creating test user:`, testUserData);
    const newUser = new MongooseUser(testUserData);
    const savedUser = await newUser.save();
    console.log(`✅ Test user saved successfully!`);
    console.log(`   - Generated ID: ${savedUser._id}`);
    console.log(`   - Saved Name: ${savedUser.name}`);
    console.log(`   - Hashed Password in DB: ${savedUser.password}`);

    // 2. Create a Test Message associated with the User
    const testMessageData = {
      userId: savedUser._id,
      sender: "user",
      text: "Hello! This is a test message saved directly from check script."
    };

    console.log(`\n2. Creating test message:`, testMessageData);
    const newMessage = new MongooseMessage(testMessageData);
    const savedMessage = await newMessage.save();
    console.log(`✅ Test message saved successfully!`);
    console.log(`   - Generated ID: ${savedMessage._id}`);
    console.log(`   - Sender: ${savedMessage.sender}`);
    console.log(`   - Text: "${savedMessage.text}"`);

    // 3. Query them back to confirm
    console.log(`\n3. Querying database to confirm records exist...`);
    const foundUser = await MongooseUser.findById(savedUser._id);
    const foundMessage = await MongooseMessage.findOne({ userId: savedUser._id });

    if (foundUser && foundMessage) {
      console.log(`🎉 DB Check Successful: Both user and message are successfully queried back!`);
    } else {
      console.warn(`⚠️ Warning: Saved records could not be retrieved.`);
    }

  } catch (err) {
    console.error("\n❌ Database operation failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB Atlas.");
  }
};

run();
