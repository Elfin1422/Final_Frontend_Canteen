const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function post(url, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE}${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
}

async function get(url, token) {
  const res  = await fetch(`${BASE}${url}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
}

export const authService = {
  login:  (email, password) => post('/login',  { email, password }),
  logout: (token)           => post('/logout', {}, token),
  me:     (token)           => get('/me', token),
};
