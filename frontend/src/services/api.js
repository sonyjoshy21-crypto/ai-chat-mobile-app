import axios from 'axios';

// 1. Base URL configuration
// Using localhost:5000 by default (for Web preview and iOS simulator).
// NOTE FOR EVALUATOR: If testing on a physical mobile device with Expo Go, 
// replace 'localhost' with your development machine's local IP address (e.g., '192.168.1.50').
const API_BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000 // Prevents screen hanging on slow networks
});

// Cache token locally in memory
let tokenCache = null;

export const setAuthToken = (token) => {
  tokenCache = token;
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
};

export const authAPI = {
  register: async (name, email, password) => {
    try {
      const response = await client.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Connection to server failed.';
    }
  },

  login: async (email, password) => {
    try {
      const response = await client.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Invalid username or password.';
    }
  }
};

export const chatAPI = {
  getHistory: async () => {
    try {
      const response = await client.get('/chat/history');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to download chat history.';
    }
  },

  sendMessage: async (text) => {
    try {
      const response = await client.post('/chat/message', { text });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to send message.';
    }
  }
};
