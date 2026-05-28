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

// 2. Encapsulated Model Wrapper to guarantee operations continue if Database is offline
class Message {
  static async find({ userId }) {
    if (db.getStatus()) {
      return await MongooseMessage.find({ userId }).sort({ createdAt: 1 });
    } else {
      return await memoryDb.messages.find({ userId });
    }
  }

  static async create(msgData) {
    if (db.getStatus()) {
      const msg = new MongooseMessage(msgData);
      return await msg.save();
    } else {
      return await memoryDb.messages.create(msgData);
    }
  }
}

module.exports = Message;
module.exports.MongooseMessage = MongooseMessage; // Expose Mongoose schema for documentation / strict checks
