import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

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

// Response interceptor to handle errors
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
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) =>
    api.post('/register', data),
  
  logout: () =>
    api.post('/logout'),
  
  getUser: () =>
    api.get('/user'),
  
  updateProfile: (data: { name?: string; phone?: string; current_password?: string; password?: string; password_confirmation?: string }) =>
    api.put('/profile', data),
  
  getUsers: (params?: { role?: string; search?: string }) =>
    api.get('/users', { params }),
  
  toggleUserStatus: (userId: number) =>
    api.patch(`/users/${userId}/toggle-status`),
};

// Category API
export const categoryAPI = {
  getAll: (params?: { active_only?: boolean }) =>
    api.get('/categories', { params }),
  
  getById: (id: number) =>
    api.get(`/categories/${id}`),
  
  create: (data: { name: string; description?: string; icon?: string; sort_order?: number }) =>
    api.post('/categories', data),
  
  update: (id: number, data: Partial<{ name: string; description: string; icon: string; is_active: boolean; sort_order: number }>) =>
    api.put(`/categories/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/categories/${id}`),
  
  toggleStatus: (id: number) =>
    api.patch(`/categories/${id}/toggle-status`),
};

// Menu API
export const menuAPI = {
  getAll: (params?: { category_id?: number; available_only?: boolean; featured?: boolean; low_stock?: boolean; search?: string; sort_by?: string; sort_order?: string }) =>
    api.get('/menu-items', { params }),
  
  getById: (id: number) =>
    api.get(`/menu-items/${id}`),
  
  getLowStock: () =>
    api.get('/menu-items/low-stock'),
  
  create: (data: FormData) =>
    api.post('/menu-items', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id: number, data: FormData) =>
    api.post(`/menu-items/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id: number) =>
    api.delete(`/menu-items/${id}`),
  
  toggleAvailability: (id: number) =>
    api.patch(`/menu-items/${id}/toggle-availability`),
  
  toggleFeatured: (id: number) =>
    api.patch(`/menu-items/${id}/toggle-featured`),
};

// Order API
export const orderAPI = {
  getAll: (params?: { status?: string; user_id?: number; date_from?: string; date_to?: string; search?: string }) =>
    api.get('/orders', { params }),
  
  getById: (id: number) =>
    api.get(`/orders/${id}`),
  
  getQueue: () =>
    api.get('/orders/queue'),
  
  getMyOrders: () =>
    api.get('/orders/my-orders'),
  
  create: (data: {
    items: { menu_item_id: number; quantity: number; special_instructions?: string }[];
    customer_name?: string;
    customer_phone?: string;
    payment_method: 'cash' | 'card' | 'digital_wallet';
    notes?: string;
  }) =>
    api.post('/orders', data),
  
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  
  delete: (id: number) =>
    api.delete(`/orders/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params?: { low_stock?: boolean; category_id?: number; search?: string }) =>
    api.get('/inventory', { params }),
  
  getLogs: (params?: { menu_item_id?: number; change_type?: string; date_from?: string; date_to?: string }) =>
    api.get('/inventory/logs', { params }),
  
  getLowStockAlerts: () =>
    api.get('/inventory/low-stock-alerts'),
  
  restock: (menuItemId: number, quantity: number, reason?: string) =>
    api.post(`/inventory/${menuItemId}/restock`, { quantity, reason }),
  
  adjustStock: (menuItemId: number, newQuantity: number, reason: string) =>
    api.post(`/inventory/${menuItemId}/adjust`, { new_quantity: newQuantity, reason }),
  
  bulkRestock: (items: { menu_item_id: number; quantity: number }[], reason?: string) =>
    api.post('/inventory/bulk-restock', { items, reason }),
};

// Report API
export const reportAPI = {
  getDashboard: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/dashboard', { params }),
  
  getSalesByDay: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/sales-by-day', { params }),
  
  getSalesByCategory: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/sales-by-category', { params }),
  
  getTopSellingItems: (params?: { date_from?: string; date_to?: string; limit?: number }) =>
    api.get('/reports/top-selling-items', { params }),
  
  getOrderTrends: (params?: { days?: number }) =>
    api.get('/reports/order-trends', { params }),
  
  getPaymentMethods: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/payment-methods', { params }),
  
  getHourlySales: (params?: { date?: string }) =>
    api.get('/reports/hourly-sales', { params }),
};

export default api;
