export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const ACCESS_KEY = "sm_access_token";
const REFRESH_KEY = "sm_refresh_token";

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function tryRefresh() {
  const refresh_token = tokenStore.refresh;
  if (!refresh_token) return false;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  if (!response.ok) return false;

  const data = await response.json();
  tokenStore.set(data);
  return true;
}

/**
 * fetch autenticado. Injeta o Bearer token e tenta refresh uma vez no 401.
 * `body` pode ser objeto (vira JSON) ou FormData (enviado cru).
 */
export async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  function buildHeaders() {
    const headers = {};
    if (auth && tokenStore.access) {
      headers["Authorization"] = `Bearer ${tokenStore.access}`;
    }
    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  const payload =
    body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  let response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(),
    body: payload,
  });

  // Token expirado → tenta refresh e repete uma vez
  if (response.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: buildHeaders(),
        body: body instanceof FormData ? body : payload,
      });
    }
    if (response.status === 401) {
      tokenStore.clear();
      onUnauthorized?.();
    }
  }

  return response;
}

export async function apiJson(path, options) {
  const response = await apiFetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Erro na requisição.");
  }
  return data;
}
