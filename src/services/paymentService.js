// src/services/paymentService.js
import api from './api';

export const paymentService = {
  receivables:       (params) => api.get('/payments/receivables',              { params }),
  payables:          (params) => api.get('/payments/payables',                 { params }),
  transactions:      (params) => api.get('/payments/transactions',             { params }),
  collectReceivable: (id, d)  => api.patch(`/payments/receivables/${id}/collect`, d),
  payPayable:        (id, d)  => api.patch(`/payments/payables/${id}/pay`,     d),
};
