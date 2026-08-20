import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://project1-be-1.onrender.com';
const TOKEN_KEY   = '@portfoy_token';
let unauthorizedHandler = null;
let tokenCache;

async function getToken() {
  if (tokenCache !== undefined) return tokenCache;
  tokenCache = await AsyncStorage.getItem(TOKEN_KEY);
  return tokenCache;
}

export async function saveToken(token) {
  tokenCache = token;
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  tokenCache = null;
  return AsyncStorage.removeItem(TOKEN_KEY);
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

async function request(path, options = {}) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured (EXPO_PUBLIC_BACKEND_URL).');
  }

  const token = await getToken();
  const hasAuthToken = Boolean(token);

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
    if (res.status === 401 && hasAuthToken && unauthorizedHandler) {
      await unauthorizedHandler({ path, options, status: res.status });
    }

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
