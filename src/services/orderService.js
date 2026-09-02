// src/services/orderService.js
import api from './api';

export const orderService = {
  list:         (params)    => api.get('/orders', { params }),
  get:          (id)        => api.get(`/orders/${id}`),
  create:       (data)      => api.post('/orders', data),
  updateStatus: (id, data)  => api.patch(`/orders/${id}/status`, data),
};
