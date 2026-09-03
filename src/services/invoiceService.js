// src/services/invoiceService.js
// Invoices generated for the wholesaler (after admin approves a purchase order).
import api from './api';

export const invoiceService = {
  // GET /api/wholesaler/invoices?search=
  list: (params) => api.get('/wholesaler/invoices', { params }),

  // GET /api/wholesaler/invoices/:id
  get: (id) => api.get(`/wholesaler/invoices/${id}`),
};

export default invoiceService;
