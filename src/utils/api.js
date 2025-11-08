import CONFIG from '../config.js';

function getToken() {
  return localStorage.getItem('story_token') || null;
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function login(email, password) {
  return request(`${CONFIG.BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function register(name, email, password) {
  return request(`${CONFIG.BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}


export async function fetchStories({ page = 1, size = 20, location = 0 } = {}) {
  const url = new URL(`${CONFIG.BASE_URL}/stories`);
  url.searchParams.set('page', page);
  url.searchParams.set('size', size);
  url.searchParams.set('location', location);

  if (getToken()) {
    try {
      url.searchParams.set('location', 1);
      return await request(url.toString());
    } catch (err) {
      console.warn('Gagal fetch stories dengan token, mencoba sebagai guest:', err.message);
    }
  }

  url.searchParams.set('location', 0);
  return request(url.toString());
}

export async function addStory({ description, photoFile, lat, lon }) {
  const form = new FormData();
  form.append('description', description);
  form.append('photo', photoFile);
  if (lat) form.append('lat', lat);
  if (lon) form.append('lon', lon);

  const endpoint = `${CONFIG.BASE_URL}/stories`;
  return request(endpoint, { method: 'POST', body: form });
}

export async function getStoryDetail(id) {
  return request(`${CONFIG.BASE_URL}/stories/${id}`);
}

export async function subscribeNotification({ endpoint, keys }) {
  const payload = {
    endpoint,
    keys,
  };

  return request(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unsubscribeNotification(endpoint) {
  return request(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
}
