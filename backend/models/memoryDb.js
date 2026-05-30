const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'local_db.json');

let state = {
  users: [],
  messages: []
};

// Load state from local file if it exists
if (fs.existsSync(dbPath)) {
  try {
    state = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log(` [Local File DB] Loaded existing data from local_db.json`);
  } catch (error) {
    console.error(` [Local File DB Error] Failed to read local_db.json:`, error.message);
  }
} else {
  console.log(` [Local File DB] No local_db.json found. Creating a new one...`);
}

const saveState = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf8');
    console.log(` [Local File DB] Data successfully saved to local_db.json`);
  } catch (error) {
    console.error(` [Local File DB Error] Failed to write to local_db.json:`, error.message);
  }
};

// Seed default evaluator if state is empty
const init = async () => {
  if (state.users.length === 0) {
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
    saveState();
  }
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
      saveState();
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
      return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    create: async (msgData) => {
      const newMsg = {
        _id: 'msg_' + Math.random().toString(36).substr(2, 9),
        ...msgData,
        createdAt: new Date()
      };
      state.messages.push(newMsg);
      saveState();
      return newMsg;
    }
  }
};
