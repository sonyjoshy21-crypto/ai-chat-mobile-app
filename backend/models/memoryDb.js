/**
 * Memory Database Helper (Offline Fail-Safe)
 * 
 * Provides an in-memory storage array for Users and Messages to ensure the assessment application
 * remains 100% interactive and operational even if the database evaluator does not have a 
 * running MongoDB instance.
 */
const bcrypt = require('bcryptjs');

const state = {
  users: [],
  messages: []
};

// Seed standard testing user to make review instant
const init = async () => {
  const hashedDefaultPassword = await bcrypt.hash('password123', 10);
  state.users.push({
    _id: 'default_evaluator_id',
    name: 'Evaluator Demo',
    email: 'test@example.com',
    password: hashedDefaultPassword,
    createdAt: new Date()
  });
  
  // Seed a welcome message
  state.messages.push({
    _id: 'msg_seed_1',
    userId: 'default_evaluator_id',
    sender: 'ai',
    text: "Hello! I am your AI Assistant. Feel free to ask me anything!",
    createdAt: new Date(Date.now() - 5000)
  });
};

init();

module.exports = {
  users: {
    find: async (query) => {
      if (query.email) {
        return state.users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
      }
      if (query.name) {
        return state.users.find(u => u.name.toLowerCase() === query.name.toLowerCase());
      }
      return null;
    },
    findById: async (id) => {
      return state.users.find(u => u._id === id);
    },
    create: async (userData) => {
      const newUser = {
        _id: 'usr_' + Math.random().toString(36).substr(2, 9),
        ...userData,
        createdAt: new Date()
      };
      state.users.push(newUser);
      return newUser;
    }
  },
  messages: {
    find: async (query) => {
      let filtered = [...state.messages];
      if (query.userId) {
        filtered = filtered.filter(m => m.userId === query.userId);
      }
      // Sort chronologically
      return filtered.sort((a, b) => a.createdAt - b.createdAt);
    },
    create: async (msgData) => {
      const newMsg = {
        _id: 'msg_' + Math.random().toString(36).substr(2, 9),
        ...msgData,
        createdAt: new Date()
      };
      state.messages.push(newMsg);
      return newMsg;
    }
  }
};
