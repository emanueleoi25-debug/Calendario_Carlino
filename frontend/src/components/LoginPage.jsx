import React, { useState } from 'react';
import { apiRequest } from '../api';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      onLoginSuccess(data);
    } catch (err) {
      setError('Credenziali non valide');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-2 text-center">
          Accesso Calendario Aziendale
        </h1>
        <p className="text-xs text-slate-400 mb-4 text-center">
          Usa le credenziali fornite dall&apos;amministratore.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs mb-1 text-slate-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Accesso in corso...' : 'Entra'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

