// src/services/masterService.js
// Platform-wide standardized dropdown values (managed by Super Admin).
import api from './api';

export const masterService = {
  // GET /api/masters → { masters: { category:[], finish:[], size:[], color:[], ... } }
  all: () => api.get('/masters'),
};

export default masterService;
