import axios from 'axios';

// During development, FastAPI usually runs on localhost:8000
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
});

// We can add interceptors here later for auth tokens (Clerk)
