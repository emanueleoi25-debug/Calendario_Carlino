function computeApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;

  // `http://backend:5000` funziona solo dentro Docker network, non dal browser.
  // Se viene configurato così (o non è configurato), usa l'host della pagina e la porta del backend.
  if (!configured || configured.includes('://backend:')) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }

  return configured;
}

const API_BASE_URL = computeApiBaseUrl();

export async function apiRequest(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    // Prova a estrarre un messaggio leggibile dall'API
    try {
      const data = text ? JSON.parse(text) : null;
      const msg =
        (data && (data.message || data.error)) ||
        text ||
        'Richiesta fallita';
      throw new Error(msg);
    } catch {
      throw new Error(text || 'Richiesta fallita');
    }
  }

  return res.status === 204 ? null : res.json();
}

