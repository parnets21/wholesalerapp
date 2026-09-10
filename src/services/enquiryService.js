// src/services/enquiryService.js
import api from './api';

export const enquiryService = {
  list:  (params)    => api.get('/enquiries', { params }),
  stats: ()          => api.get('/enquiries/stats'),
  get:   (id)        => api.get(`/enquiries/${id}`),
  update:(id, data)  => api.patch(`/enquiries/${id}`, data),

  // Reply to a MANUAL enquiry (no buyer_company_id) — updates status + reply fields.
  reply: (id, data)  => api.patch(`/enquiries/${id}`, data),

  // ── Retailer marketplace enquiries (have buyer_company_id) ──
  // Structured offer (unit_price, gst_percent, charges…) via EnquiryOffer flow.
  sendOffer:   (id, data) => api.post(`/enquiries/${id}/offers`, data),
  listOffers:  (id)       => api.get(`/enquiries/${id}/offers`),
  listMessages:(id)       => api.get(`/enquiries/${id}/messages`),
  sendMessage: (id, data) => api.post(`/enquiries/${id}/messages`, data),
};
