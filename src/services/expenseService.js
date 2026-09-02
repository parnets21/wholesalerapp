// src/services/expenseService.js
import api from './api';

export const expenseService = {
  list:   (params) => api.get('/expenses',      { params }),
  get:    (id)     => api.get(`/expenses/${id}`),
  create: (data)   => api.post('/expenses', data),
  update: (id, d)  => api.put(`/expenses/${id}`, d),
  delete: (id)     => api.delete(`/expenses/${id}`),
  report: (params) => api.get('/expenses/report', { params }),
};
