// src/services/quotationService.js
// Wholesaler product-request → admin quotation → accept/reject flow.
import api from './api';

export const quotationService = {
  // POST /api/wholesaler/quotations — raise a product request
  create: (data) => api.post('/wholesaler/quotations', data),

  // GET /api/wholesaler/quotations?status=
  list: (params) => api.get('/wholesaler/quotations', { params }),

  // GET /api/wholesaler/quotations/:id
  get: (id) => api.get(`/wholesaler/quotations/${id}`),

  // PATCH /api/wholesaler/quotations/:id/respond  body:{ action:'accept'|'reject' }
  respond: (id, action) => api.patch(`/wholesaler/quotations/${id}/respond`, { action }),
};

export default quotationService;
