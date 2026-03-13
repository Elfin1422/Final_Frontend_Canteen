import { api } from './api.js';

export const orderService = {
  getAll:       (params = '')  => api.get(`/orders${params}`),
  getOne:       (id)           => api.get(`/orders/${id}`),
  create:       (body)         => api.post('/orders', body),
  updateStatus: (id, status)   => api.patch(`/orders/${id}/status`, { status }),
};
