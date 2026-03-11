const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

