// src/services/customerService.js
import api from './api';

export const customerService = {
  list:    (params)   => api.get('/customers', { params }),
  get:     (id)       => api.get(`/customers/${id}`),
  history: (id)       => api.get(`/customers/${id}/history`),
  create:  (data)     => api.post('/customers', data),
  update:  (id, data) => api.patch(`/customers/${id}`, data),
};
