import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Helper to resolve the correct backend API URL automatically
const getApiBaseUrl = () => {
  // 1. If configured in .env, prioritize it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. On Web, connect to localhost directly
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // 3. On physical devices / emulators running via Metro, auto-detect the host machine's IP
  const hostUri = Constants.expoConfig?.hostUri; // e.g., "192.168.1.16:8081"
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000 // Prevents screen hanging on slow networks
});

export const updateApiBaseUrl = (newUrlOrIp) => {
  let url = newUrlOrIp;
  if (!url.startsWith('http')) {
    url = `http://${newUrlOrIp}:5000/api`;
  }
  client.defaults.baseURL = url;
  console.log(`[API BaseURL Updated] New base URL: ${url}`);
};

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

  sendMessage: async (text, signal) => {
    try {
      const response = await client.post('/chat/message', { text }, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        throw 'cancelled';
      }
      throw error.response?.data?.message || 'Failed to send message.';
    }
  },

  transcribeVoice: async (base64Audio, mimeType) => {
    try {
      const response = await client.post('/chat/transcribe', { audio: base64Audio, mimeType }, { timeout: 15000 });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to transcribe audio.';
    }
  }
};
