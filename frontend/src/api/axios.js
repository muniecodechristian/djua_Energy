import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Crucial for receiving and sending HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
