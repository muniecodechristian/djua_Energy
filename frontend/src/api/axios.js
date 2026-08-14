import axios from 'axios';

const isLocalHost = (() => {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '';
  } catch (e) {
    return true;
  }
})();

const DEFAULT_REMOTE = 'https://djua-energy-backend.onrender.com';
const DEFAULT_LOCAL = 'http://localhost:5000';

const baseURL = import.meta.env.VITE_API_URL ?? (isLocalHost ? DEFAULT_LOCAL : DEFAULT_REMOTE);

const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for receiving and sending HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
