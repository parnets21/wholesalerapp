// src/services/salesService.js
import api from './api';

export const salesService = {
  list:          (params) => api.get('/sales',          { params }),
  get:           (id)     => api.get(`/sales/${id}`),
  create:        (data)   => api.post('/sales', data),
  recordPayment: (id, d)  => api.patch(`/sales/${id}/payment`, d),
  report:        (params) => api.get('/sales/report',   { params }),
};
