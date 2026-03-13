/**
 * api.js
 * Base HTTP client for all API calls.
 * Automatically attaches the Bearer token from localStorage.
 * Throws an Error with the server's message on non-OK responses.
 * All requests go through the VITE_API_URL base (default: localhost:8000/api).
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, endpoint, body = null, isFormData = false) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}

export const api = {
  get:      (url)        => request('GET', url),
  post:     (url, body)  => request('POST', url, body),
  put:      (url, body)  => request('PUT', url, body),
  patch:    (url, body)  => request('PATCH', url, body),
  delete:   (url)        => request('DELETE', url),
  postForm: (url, form)  => request('POST', url, form, true),
  putForm:  (url, form)  => request('PUT',  url, form, true),
};
