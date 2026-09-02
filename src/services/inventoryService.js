// src/services/inventoryService.js
import api from './api';

export const inventoryService = {
  // ── Wholesaler view-only endpoints ────────────────────────────────────────
  list:        (params) => api.get('/wholesaler/inventory',         { params }),
  summary:     ()       => api.get('/wholesaler/inventory/summary'),
  get:         (id)     => api.get(`/wholesaler/inventory/${id}`),
  movements:   (params) => api.get('/wholesaler/inventory/movements', { params }),
  warehouses:  ()       => api.get('/wholesaler/warehouses'),
};
