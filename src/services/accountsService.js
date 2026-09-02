// src/services/accountsService.js
import api from './api';

export const accountsService = {
  // ── Receivables (money coming IN from retailers) ──────────────────────────
  receivables:        (params) => api.get('/payments/receivables',             { params }),
  collectReceivable:  (id, d)  => api.patch(`/payments/receivables/${id}/collect`, d),

  // ── Payables (money going OUT to suppliers) ───────────────────────────────
  payables:           (params) => api.get('/payments/payables',                { params }),
  payPayable:         (id, d)  => api.patch(`/payments/payables/${id}/pay`,    d),

  // ── Transactions ledger ───────────────────────────────────────────────────
  transactions:       (params) => api.get('/payments/transactions',            { params }),

  // ── Customer ledger ───────────────────────────────────────────────────────
  customerLedger: (customerId, params) =>
    api.get('/accounts/ledger/customer', { params: { customer_id: customerId, ...params } }),

  // ── Cash book & Bank book ─────────────────────────────────────────────────
  cashBook:  (params) => api.get('/accounts/cash-book',  { params }),
  bankBook:  (params) => api.get('/accounts/bank-book',  { params }),
};
