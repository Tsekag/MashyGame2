// api.ts — Unified client for backend endpoints
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

interface Genre {
  id: string;
  name: string;
  image_url?: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  genre: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  genres: Genre[];
}


class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private useCookieAuth: boolean;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.useCookieAuth = import.meta.env.PROD || String(import.meta.env.VITE_USE_COOKIE_AUTH || '').toLowerCase() === 'true';
    this.token = import.meta.env.PROD ? null : localStorage.getItem('auth_token');
  }

  private getToken(): string | null {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) return adminToken;
    return this.token;
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const cookieParts = document.cookie.split(';').map((part) => part.trim());
    const csrfPart = cookieParts.find((part) => part.startsWith('csrf_token='));
    if (!csrfPart) return null;
    return decodeURIComponent(csrfPart.split('=')[1] || '');
  }

  private isSafeMethod(method?: string): boolean {
    const normalized = (method || 'GET').toUpperCase();
    return normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.useCookieAuth && !this.isSafeMethod(method)) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: this.useCookieAuth ? 'include' : options.credentials,
    });
    if (!response.ok) {
      const body = await response.text();
      let errorPayload: any = { message: 'Network error' };
      try {
        errorPayload = body ? JSON.parse(body) : {};
      } catch {
        errorPayload = { message: body || 'Network error' };
      }
      const message = errorPayload.message || errorPayload.error || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  setToken(token: string | null, persist = true) {
    this.token = token;
    if (!import.meta.env.PROD && persist) {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    }
  }

  // ---------------- Auth ----------------
  async register(userData: { username: string; email: string; password: string }) {
    const response = await this.request<{ token: string; user: UserProfile }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/profile');
  }

  async updateGenres(genres: string[]): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/genres', {
      method: 'PUT',
      body: JSON.stringify({ genres }),
    });
  }

  // ---------------- Genres ----------------
  async getGenres(): Promise<Genre[]> {
    return this.request<Genre[]>('/genres');
  }

  // ---------------- Characters ----------------
  async getCharactersByGenre(genreId: string): Promise<Character[]> {
    return this.request<Character[]>(`/characters?genre_id=${genreId}`);
  }

  async getCharactersByGenres(genres: string[]): Promise<Character[]> {
    const results = await Promise.all(genres.map((id) => this.getCharactersByGenre(id)));
    return results.flat();
  }

  // ---------------- Uploads ----------------
  async uploadArtwork(formData: FormData) {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.useCookieAuth) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: this.useCookieAuth ? 'include' : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getGallery(): Promise<{ uploads: any[] }> {
  return this.request<{ uploads: any[] }>('/uploads');
}

async getUserUploads(userId: string): Promise<{ uploads: any[] }> {
  return this.request<{ uploads: any[] }>(`/uploads/user/${userId}`);
}

async getUserStats(userId: string): Promise<{ totalUploads: number; totalLikes: number; favoriteGenre: string }> {
  return this.request<{ totalUploads: number; totalLikes: number; favoriteGenre: string }>(
    `/uploads/stats/${userId}`
  );
}

  async deleteUpload(uploadId: string) {
    return this.request(`/uploads/${uploadId}`, { method: 'DELETE' });
  }

  async updateUpload(uploadId: string, payload: { title: string; description?: string }) {
    return this.request(`/uploads/${uploadId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ---------------- Feedback ----------------
  async toggleLike(uploadId: string) {
    return this.request(`/uploads/${uploadId}/like`, { method: 'POST' });
  }

  async addComment(uploadId: string, commentText: string) {
    return this.request('/feedback/comment', {
      method: 'POST',
      body: JSON.stringify({ uploadId, commentText }),
    });
  }

  async getComments(uploadId: string) {
    return this.request(`/feedback/comments/${uploadId}`);
  }

  // ---------------- Admin ----------------
  async getAdminGenres(): Promise<{ genres: any[] }> {
    return this.request<{ genres: any[] }>('/admin/genres');
  }

  async createGenre(genreData: FormData): Promise<any> {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.useCookieAuth) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/admin/genres`, {
      method: 'POST',
      headers,
      body: genreData,
      credentials: this.useCookieAuth ? 'include' : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Create failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async updateGenre(id: string, genreData: FormData): Promise<any> {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.useCookieAuth) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/admin/genres/${id}`, {
      method: 'PUT',
      headers,
      body: genreData,
      credentials: this.useCookieAuth ? 'include' : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Update failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async toggleGenre(id: string): Promise<any> {
    return this.request(`/admin/genres/${id}/toggle`, { method: 'PATCH' });
  }

  async deleteGenre(id: string): Promise<any> {
    return this.request(`/admin/genres/${id}`, { method: 'DELETE' });
  }

  async getAdminCharacters(): Promise<{ characters: any[] }> {
    return this.request<{ characters: any[] }>('/admin/characters');
  }

  async createCharacter(characterData: FormData): Promise<any> {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.useCookieAuth) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/admin/characters`, {
      method: 'POST',
      headers,
      body: characterData,
      credentials: this.useCookieAuth ? 'include' : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Create failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async updateCharacter(id: string, characterData: FormData): Promise<any> {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.useCookieAuth) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/admin/characters/${id}`, {
      method: 'PUT',
      headers,
      body: characterData,
      credentials: this.useCookieAuth ? 'include' : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Update failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async toggleCharacter(id: string): Promise<any> {
    return this.request(`/admin/characters/${id}/toggle`, { method: 'PATCH' });
  }

  async deleteCharacter(id: string): Promise<any> {
    return this.request(`/admin/characters/${id}`, { method: 'DELETE' });
  }
}

// Singleton instance
const api = new ApiClient(API_BASE_URL);

// ---------------- API Slices ----------------
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.register(userData),
  login: (credentials: { email: string; password: string }) => api.login(credentials),
  getProfile: () => api.getProfile(),
  updateGenres: (genres: string[]) => api.updateGenres(genres),
  setToken: (token: string | null, persist: boolean = true) => api.setToken(token, persist),
  logout: () => api.logout(),
};

export const genreAPI = {
  getAll: () => api.getGenres(),
};

export const characterAPI = {
  getByGenre: (genreId: string) => api.getCharactersByGenre(genreId),
  getByGenres: (genres: string[]) => api.getCharactersByGenres(genres),
};

export const uploadAPI = {
  upload: (formData: FormData) => api.uploadArtwork(formData),
  getGallery: () => api.getGallery(),
  getUserUploads: (userId: string) => api.getUserUploads(userId),
  getUserStats: (userId: string) => api.getUserStats(userId),
  deleteUpload: (uploadId: string) => api.deleteUpload(uploadId),
  updateUpload: (uploadId: string, payload: { title: string; description?: string }) => api.updateUpload(uploadId, payload),
};

export const feedbackAPI = {
  toggleLike: (uploadId: string) => api.toggleLike(uploadId),
  addComment: (uploadId: string, commentText: string) => api.addComment(uploadId, commentText),
  getComments: (uploadId: string) => api.getComments(uploadId),
};

export const adminAPI = {
  getGenres: () => api.getAdminGenres(),
  createGenre: (genreData: FormData) => api.createGenre(genreData),
  updateGenre: (id: string, genreData: FormData) => api.updateGenre(id, genreData),
  toggleGenre: (id: string) => api.toggleGenre(id),
  deleteGenre: (id: string) => api.deleteGenre(id),
  getCharacters: () => api.getAdminCharacters(),
  createCharacter: (characterData: FormData) => api.createCharacter(characterData),
  updateCharacter: (id: string, characterData: FormData) => api.updateCharacter(id, characterData),
  toggleCharacter: (id: string) => api.toggleCharacter(id),
  deleteCharacter: (id: string) => api.deleteCharacter(id),
};

export default api;
