const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const memoryDb = require('./memoryDb');

// 1. Standard Mongoose Schema for MongoDB environment
const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save password hashing middleware
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const MongooseUser = mongoose.model('User', UserSchema);

// 2. Encapsulated Model Wrapper to guarantee operations connect directly to MongoDB
class User {
  static async findOne(query) {
    return await MongooseUser.findOne(query);
  }

  static async findById(id) {
    return await MongooseUser.findById(id);
  }

  static async create(userData) {
    console.log(`\n[Database Logging] Attempting to create user in MongoDB: ${userData.name} (${userData.email})`);
    const user = new MongooseUser(userData);
    const savedUser = await user.save();
    console.log(`[Database Logging] ✅ User saved to MongoDB Atlas! ID: ${savedUser._id}`);
    return savedUser;
  }

  static async comparePasswords(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;
module.exports.MongooseUser = MongooseUser; // Expose Mongoose schema for documentation / strict checks
