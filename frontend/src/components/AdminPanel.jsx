import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

function AdminPanel({ token }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [subOffices, setSubOffices] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [newSubOffice, setNewSubOffice] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    if (tab === 'users') {
      const data = await apiRequest('/api/admin/users', {}, token);
      setUsers(data);
    } else if (tab === 'logs') {
      const data = await apiRequest('/api/admin/access-logs', {}, token);
      setLogs(data);
    } else if (tab === 'suboffices') {
      const data = await apiRequest('/api/admin/sub-offices', {}, token);
      setSubOffices(data);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    await apiRequest(
      '/api/admin/users',
      {
        method: 'POST',
        body: JSON.stringify(newUser)
      },
      token
    );
    setNewUser({ username: '', email: '', password: '', role: 'user' });
    await loadData();
  }

  async function handleCreateSubOffice(e) {
    e.preventDefault();
    if (!newSubOffice.trim()) return;
    await apiRequest(
      '/api/admin/sub-offices',
      {
        method: 'POST',
        body: JSON.stringify({ name: newSubOffice.trim() })
      },
      token
    );
    setNewSubOffice('');
    await loadData();
  }

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="border-b border-slate-800 px-3 py-2 flex gap-2">
        <button
          onClick={() => setTab('users')}
          className={`px-2 py-1 rounded-md ${
            tab === 'users' ? 'bg-sky-600' : 'bg-slate-900'
          }`}
        >
          Utenti
        </button>
        <button
          onClick={() => setTab('suboffices')}
          className={`px-2 py-1 rounded-md ${
            tab === 'suboffices' ? 'bg-sky-600' : 'bg-slate-900'
          }`}
        >
          Sotto-uffici
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-2 py-1 rounded-md ${
            tab === 'logs' ? 'bg-sky-600' : 'bg-slate-900'
          }`}
        >
          Log accessi
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {tab === 'users' && (
          <>
            <h2 className="font-semibold mb-1">Gestione utenti</h2>
            <form onSubmit={handleCreateUser} className="space-y-2 mb-3">
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700"
                />
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700"
                >
                  <option value="user">Utente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500"
              >
                Crea utente
              </button>
            </form>
            <div className="space-y-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex justify-between items-center px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
                >
                  <div>
                    <div className="font-medium">{u.username}</div>
                    <div className="text-[10px] text-slate-400">
                      {u.email} · {u.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'suboffices' && (
          <>
            <h2 className="font-semibold mb-1">Sotto-uffici</h2>
            <form onSubmit={handleCreateSubOffice} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Nome sotto-ufficio"
                value={newSubOffice}
                onChange={(e) => setNewSubOffice(e.target.value)}
                className="flex-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500"
              >
                Crea
              </button>
            </form>
            <div className="space-y-1">
              {subOffices.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
                >
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Membri: {s.users_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'logs' && (
          <>
            <h2 className="font-semibold mb-1">Ultimi accessi</h2>
            <div className="space-y-1 max-h-[420px] overflow-auto">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
                >
                  <div className="flex justify-between">
                    <span className="text-[11px]">{l.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(l.timestamp).toLocaleString('it-IT')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Utente: {l.username || '-'} · IP: {l.ip_address || '-'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

