// src/services/adminApi.ts

import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await adminApi.post('/auth/login', { email, password });
    return response.data;
  },
  
  signup: async (username: string, email: string, password: string) => {
    const response = await adminApi.post('/auth/signup', { username, email, password });
    return response.data;
  },
};

// Genres API
export const genresApi = {
  getAll: async () => {
    const response = await adminApi.get('/admin/genres');
    return response.data;
  },
  
  create: async (name: string, is_active: boolean = true) => {
    const response = await adminApi.post('/admin/genres', { name, is_active });
    return response.data;
  },
  
  update: async (id: number, name: string, is_active: boolean) => {
    const response = await adminApi.put(`/admin/genres/${id}`, { name, is_active });
    return response.data;
  },
  
  toggle: async (id: number) => {
    const response = await adminApi.patch(`/admin/genres/${id}/toggle`);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await adminApi.delete(`/admin/genres/${id}`);
    return response.data;
  },
};

// Characters API
export const charactersApi = {
  getAll: async () => {
    const response = await adminApi.get('/admin/characters');
    return response.data;
  },
  
  create: async (characterData: FormData) => {
    const response = await adminApi.post('/admin/characters', characterData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  update: async (id: number, characterData: FormData) => {
    const response = await adminApi.put(`/admin/characters/${id}`, characterData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  toggle: async (id: number) => {
    const response = await adminApi.patch(`/admin/characters/${id}/toggle`);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await adminApi.delete(`/admin/characters/${id}`);
    return response.data;
  },
};

export default adminApi;

