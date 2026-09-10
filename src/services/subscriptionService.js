// src/services/subscriptionService.js
import api from './api';

export const subscriptionService = {
  current: () => api.get('/subscriptions/current'),
  // Activate/upgrade a plan for a period (months). Backend sets Company.subscription_plan.
  subscribe: ({ plan, months = 1, amount_paid = 0 }) => {
    const now = new Date();
    const end = new Date(now); end.setMonth(end.getMonth() + months);
    const iso = d => d.toISOString().slice(0, 10);
    return api.post('/subscriptions', {
      plan,
      starts_at:  iso(now),
      expires_at: iso(end),
      amount_paid,
      payment_ref: `APP-${Date.now()}`,
    });
  },
};

export default subscriptionService;
