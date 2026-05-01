// frontend/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('devmind_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthPage = window.location.pathname.startsWith('/auth');
      if (!isAuthPage) {
        localStorage.removeItem('devmind_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── API helpers ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  list: (params?: Record<string, string>) => api.get('/reviews', { params }),
  get: (id: string) => api.get(`/reviews/${id}`),
  create: (data: { title: string; language: string; code: string; workspaceId?: string }) =>
    api.post('/reviews', data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  addComment: (id: string, content: string) =>
    api.post(`/reviews/${id}/comments`, { content }),
};

export const documentsApi = {
  list: (params?: Record<string, string>) => api.get('/documents', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  generate: (data: {
    title: string;
    language: string;
    code: string;
    docType: string;
    projectName?: string;
    workspaceId?: string;
  }) => api.post('/documents/generate', data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const bugsApi = {
  list: (workspaceId: string, params?: Record<string, string>) =>
    api.get('/bugs', { params: { workspaceId, ...params } }),
  get: (id: string) => api.get(`/bugs/${id}`),
  create: (data: {
    title: string;
    description: string;
    priority?: string;
    labels?: string[];
    assigneeId?: string;
    workspaceId: string;
    dueDate?: string;
  }) => api.post('/bugs', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/bugs/${id}`, data),
  delete: (id: string) => api.delete(`/bugs/${id}`),
  addComment: (id: string, content: string) =>
    api.post(`/bugs/${id}/comments`, { content }),
};

export const workspacesApi = {
  list: () => api.get('/workspaces'),
  get: (id: string) => api.get(`/workspaces/${id}`),
  create: (data: { name: string; description?: string }) => api.post('/workspaces', data),
  invite: (id: string, email: string, role?: string) =>
    api.post(`/workspaces/${id}/invite`, { email, role }),
  join: (token: string) => api.post(`/workspaces/join/${token}`),
  getStats: (id: string) => api.get(`/workspaces/${id}/stats`),
};

export const userApi = {
  getStats: () => api.get('/users/stats'),
  updateProfile: (data: { name?: string; username?: string; avatar?: string }) =>
    api.patch('/users/profile', data),
};

export const activityApi = {
  list: (params?: Record<string, string>) => api.get('/activity', { params }),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
