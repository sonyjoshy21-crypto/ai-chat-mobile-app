const mongoose = require('mongoose');
const db = require('../config/db');
const memoryDb = require('./memoryDb');

// 1. Standard Mongoose Schema for MongoDB environment
const MessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseMessage = mongoose.model('Message', MessageSchema);

// 2. Encapsulated Model Wrapper to guarantee operations connect directly to MongoDB
class Message {
  static async find({ userId }) {
    return await MongooseMessage.find({ userId }).sort({ createdAt: 1 });
  }

  static async create(msgData) {
    console.log(`\n[Database Logging] Attempting to save message to MongoDB from ${msgData.sender}: "${msgData.text}"`);
    const msg = new MongooseMessage(msgData);
    const savedMsg = await msg.save();
    console.log(`[Database Logging] ✅ Message saved to MongoDB Atlas! ID: ${savedMsg._id}`);
    return savedMsg;
  }
}

module.exports = Message;
module.exports.MongooseMessage = MongooseMessage; // Expose Mongoose schema for documentation / strict checks
