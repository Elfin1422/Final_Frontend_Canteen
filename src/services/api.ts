import axios, { AxiosError } from 'axios';

/**
 * FIX: Use the Proxy path.
 * Your vite.config.ts defines a proxy for '/api', 
 * so we use '/api' as the base.
 */
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for Laravel Sanctum session cookies
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

/**
 * NECESSITY: CSRF Handshake
 * Laravel Sanctum requires this before any POST/PUT/DELETE request.
 */
export const getCsrfToken = () => 
  axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    await getCsrfToken(); // Necessary for Sanctum
    return api.post('/login', { email, password });
  },
  
  register: async (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => {
    await getCsrfToken(); // Necessary for Sanctum
    return api.post('/register', data);
  },
  
  logout: () =>
    api.post('/logout'),
  
  getUser: () =>
    api.get('/me'),
  
  updateProfile: (data: any) =>
    api.put('/profile', data),
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Menu API
export const menuAPI = {
  getAll: (params?: any) => api.get('/menu-items', { params }),
  getById: (id: number) => api.get(`/menu-items/${id}`),
  create: (data: any) => api.post('/menu-items', data),
  update: (id: number, data: any) => api.put(`/menu-items/${id}`, data),
  delete: (id: number) => api.delete(`/menu-items/${id}`),
  toggleAvailability: (id: number) => api.patch(`/menu-items/${id}/toggle-availability`),
};

// Order API
export const orderAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  getQueue: () => api.get('/order-queue'),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, status: string) => 
    api.put(`/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getLogs: () => api.get('/inventory/logs'),
  getLowStockAlerts: () => api.get('/inventory/low-stock'),
  restock: (id: number, quantity: number, reason?: string) => 
    api.post(`/inventory/${id}/restock`, { quantity, reason }),
  adjustStock: (id: number, newQuantity: number, reason: string) => 
    api.post(`/inventory/${id}/adjust`, { new_quantity: newQuantity, reason }),
};

// Report API
export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard-summary'), 
  getSalesByDay: (params?: any) => api.get('/reports/sales-by-date', { params }),
  getTopSellingItems: () => api.get('/reports/best-selling'),
  getSalesByCategory: () => api.get('/reports/sales-by-category'),
  getOrderTrends: () => api.get('/reports/order-trend'),
  exportReport: () => api.get('/reports/export'),
};

export default api;