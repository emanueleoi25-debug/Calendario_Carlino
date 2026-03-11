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
  const [expandedSubOfficeId, setExpandedSubOfficeId] = useState(null);
  const [subOfficeMembers, setSubOfficeMembers] = useState([]);
  const [selectedUserForSubOffice, setSelectedUserForSubOffice] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    if (tab === 'users') {
      const data = await apiRequest('/api/admin/users', {}, token);
      setUsers(data);
      // Carico anche i sotto-uffici per poterli usare nell'assegnazione
      const so = await apiRequest('/api/admin/sub-offices', {}, token);
      setSubOffices(so);
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

  async function handleDeleteSubOffice(id) {
    if (!window.confirm('Sei sicuro di voler eliminare questo sotto-ufficio?')) {
      return;
    }
    try {
      await apiRequest(
        `/api/admin/sub-offices/${id}`,
        {
          method: 'DELETE'
        },
        token
      );
      if (expandedSubOfficeId === id) {
        setExpandedSubOfficeId(null);
        setSubOfficeMembers([]);
        setSelectedUserForSubOffice('');
      }
      await loadData();
    } catch (e) {
      alert(e.message || 'Errore durante l\'eliminazione del sotto-ufficio');
    }
  }

  async function handleChangeUserRole(id, role) {
    await apiRequest(
      `/api/admin/users/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ role })
      },
      token
    );
    await loadData();
  }

  async function handleDeleteUser(id) {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;
    await apiRequest(
      `/api/admin/users/${id}`,
      {
        method: 'DELETE'
      },
      token
    );
    await loadData();
  }

  async function toggleSubOfficeMembers(subOfficeId) {
    if (expandedSubOfficeId === subOfficeId) {
      setExpandedSubOfficeId(null);
      setSubOfficeMembers([]);
      setSelectedUserForSubOffice('');
      return;
    }
    const members = await apiRequest(
      `/api/admin/sub-offices/${subOfficeId}/users`,
      {},
      token
    );
    setExpandedSubOfficeId(subOfficeId);
    setSubOfficeMembers(members);
    setSelectedUserForSubOffice('');
  }

  async function handleAddUserToSubOffice(subOfficeId) {
    if (!selectedUserForSubOffice) return;
    await apiRequest(
      `/api/admin/sub-offices/${subOfficeId}/users`,
      {
        method: 'POST',
        body: JSON.stringify({ user_id: Number(selectedUserForSubOffice) })
      },
      token
    );
    // Ricarico membri e contatore
    const members = await apiRequest(
      `/api/admin/sub-offices/${subOfficeId}/users`,
      {},
      token
    );
    setSubOfficeMembers(members);
    const so = await apiRequest('/api/admin/sub-offices', {}, token);
    setSubOffices(so);
    setSelectedUserForSubOffice('');
  }

  async function handleRemoveUserFromSubOffice(subOfficeId, userId) {
    await apiRequest(
      `/api/admin/sub-offices/${subOfficeId}/users/${userId}`,
      {
        method: 'DELETE'
      },
      token
    );
    const members = await apiRequest(
      `/api/admin/sub-offices/${subOfficeId}/users`,
      {},
      token
    );
    setSubOfficeMembers(members);
    const so = await apiRequest('/api/admin/sub-offices', {}, token);
    setSubOffices(so);
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
                      {u.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleChangeUserRole(u.id, e.target.value)
                      }
                      className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[10px]"
                    >
                      <option value="user">Utente</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-[10px]"
                    >
                      Elimina
                    </button>
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
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Membri: {s.users_count}
                    </div>
                    {expandedSubOfficeId === s.id && (
                      <div className="mt-2 border-t border-slate-800 pt-2 space-y-2">
                        <div className="flex gap-2 items-center">
                          <select
                            value={selectedUserForSubOffice}
                            onChange={(e) =>
                              setSelectedUserForSubOffice(e.target.value)
                            }
                            className="flex-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[10px]"
                          >
                            <option value="">
                              Seleziona utente da aggiungere
                            </option>
                            {users
                              .filter(
                                (u) =>
                                  !subOfficeMembers.some(
                                    (m) => m.id === u.id
                                  )
                              )
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.username} ({u.email})
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddUserToSubOffice(s.id)}
                            className="px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-[10px]"
                          >
                            Aggiungi
                          </button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-auto">
                          {subOfficeMembers.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between px-2 py-1 rounded-md bg-slate-950 border border-slate-800"
                            >
                              <div className="text-[11px]">
                                {m.username}{' '}
                                <span className="text-slate-500">
                                  ({m.email})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveUserFromSubOffice(s.id, m.id)
                                }
                                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px]"
                              >
                                Rimuovi
                              </button>
                            </div>
                          ))}
                          {subOfficeMembers.length === 0 && (
                            <div className="text-[10px] text-slate-500">
                              Nessun utente assegnato.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => toggleSubOfficeMembers(s.id)}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px]"
                    >
                      {expandedSubOfficeId === s.id
                        ? 'Chiudi'
                        : 'Gestisci utenti'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubOffice(s.id)}
                      className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-[10px]"
                    >
                      Elimina
                    </button>
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

