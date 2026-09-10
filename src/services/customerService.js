// src/services/customerService.js
import api from './api';

export const customerService = {
  list:    (params)   => api.get('/customers', { params }),
  get:     (id)       => api.get(`/customers/${id}`),
  history: (id)       => api.get(`/customers/${id}/history`),
  create:  (data)     => api.post('/customers', data),
  update:  (id, data) => api.put(`/customers/${id}`, data),

  // Customer 360 — orders & enquiries are searched by the customer's mobile/name
  // (backend list endpoints support `search`, not customer_id).
  orders:    (query)  => api.get('/orders',    { params: { search: query, limit: 100 } }),
  enquiries: (query)  => api.get('/enquiries', { params: { search: query, limit: 100 } }),
};
