import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://project1-be-1.onrender.com';
const TOKEN_KEY   = '@portfoy_token';

async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured (EXPO_PUBLIC_BACKEND_URL).');
  }

  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const apiClient = {
  get:    (path)         => request(path, { method: 'GET' }),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
};
