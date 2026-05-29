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

// 2. Encapsulated Model Wrapper to guarantee operations continue if Database is offline
class User {
  static async findOne(query) {
    if (db.getStatus()) {
      return await MongooseUser.findOne(query);
    } else {
      return await memoryDb.users.find(query);
    }
  }

  static async findById(id) {
    if (db.getStatus()) {
      return await MongooseUser.findById(id);
    } else {
      return await memoryDb.users.findById(id);
    }
  }

  static async create(userData) {
    if (db.getStatus()) {
      const user = new MongooseUser(userData);
      return await user.save();
    } else {
      // For offline mock database, hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      return await memoryDb.users.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      });
    }
  }

  static async comparePasswords(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;
module.exports.MongooseUser = MongooseUser; // Expose Mongoose schema for documentation / strict checks
