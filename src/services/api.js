// src/services/api.js
// Uses React Native built-in fetch — no axios needed.
import { getToken, removeToken } from '../utils/storage';

// ── Base URL ────────────────────────────────────────────────────────────────
// Android Emulator  : 10.0.2.2  maps to host machine localhost
// iOS Simulator     : localhost or 127.0.0.1
// Physical Device   : replace with your machine's current WiFi IP
//                     Run `ipconfig` (Windows) / `ifconfig` (Mac) to find it
//
// YOUR CURRENT SERVER IP: 192.168.1.38  (using adb reverse over Wi-Fi → localhost)
// If network changes, update this line and rebuild the app.
//
export const BASE_URL = 'http://localhost:5000/api';

const TIMEOUT_MS = 20000; // 20s — generous for slow mobile networks

async function request(method, path, data, params) {
  const token = await getToken().catch(() => null);

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Build URL + optional query string
  let url = `${BASE_URL}${path}`;
  if (params && Object.keys(params).length > 0) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const options = { method, headers };
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  // Timeout wrapper
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            'Request timed out.\n\nTroubleshooting:\n' +
              '• Make sure the backend server is running\n' +
              '• Phone and PC must be on the same WiFi network\n' +
              `• Current server IP: ${BASE_URL}\n` +
              '• Run ipconfig on PC to verify the IP is correct'
          )
        ),
      TIMEOUT_MS
    )
  );

  let response;
  try {
    response = await Promise.race([fetch(url, options), timeoutPromise]);
  } catch (networkErr) {
    const msg = networkErr.message.includes('timed out')
      ? networkErr.message
      : `Cannot reach server.\n\nTroubleshooting:\n` +
        `• Start the backend: run start-backend.bat on your PC\n` +
        `• Phone and PC must be on the same WiFi\n` +
        `• Current server IP: ${BASE_URL}\n` +
        `• Original error: ${networkErr.message}`;
    throw new Error(msg);
  }

  // 401 — clear stored token
  if (response.status === 401) {
    await removeToken().catch(() => {});
  }

  let json;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await response.json();
  } else {
    const text = await response.text();
    json = { message: text || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    const err = new Error(json?.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = json;
    throw err;
  }

  return json;
}

const api = {
  get:    (path, opts = {}) => request('GET',    path, null,  opts.params),
  post:   (path, data)      => request('POST',   path, data),
  patch:  (path, data)      => request('PATCH',  path, data),
  put:    (path, data)      => request('PUT',    path, data),
  delete: (path)            => request('DELETE', path),
};

export default api;
