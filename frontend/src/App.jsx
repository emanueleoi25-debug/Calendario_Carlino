import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from './api';
import LoginPage from './components/LoginPage.jsx';
import CalendarDashboard from './components/CalendarDashboard.jsx';
import AdminPanel from './components/AdminPanel.jsx';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [view, setView] = useState('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    loadCalendarsAndEvents();
  }, [token, selectedDate, view]);

  async function loadCalendarsAndEvents() {
    try {
      setLoading(true);
      setError('');
      const [cal] = await Promise.all([
        apiRequest('/api/calendars', {}, token)
      ]);
      setCalendars(cal);

      const range = getRangeForView(view, selectedDate);
      const params = new URLSearchParams();
      params.set('from', range.from.toISOString());
      params.set('to', range.to.toISOString());
      const ev = await apiRequest(`/api/events?${params.toString()}`, {}, token);
      setEvents(ev);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function getRangeForView(currentView, date) {
    if (currentView === 'day') {
      return { from: date.startOf('day'), to: date.endOf('day') };
    }
    if (currentView === 'week') {
      return { from: date.startOf('week'), to: date.endOf('week') };
    }
    return { from: date.startOf('month').startOf('week'), to: date.endOf('month').endOf('week') };
  }

  function handleLoginSuccess(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  function handleLogout() {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function handleCreateOrUpdateEvent(eventData, id) {
    const method = id ? 'PUT' : 'POST';
    const path = id ? `/api/events/${id}` : '/api/events';
    await apiRequest(
      path,
      {
        method,
        body: JSON.stringify(eventData)
      },
      token
    );
    await loadCalendarsAndEvents();
  }

  async function handleDeleteEvent(id) {
    await apiRequest(`/api/events/${id}`, { method: 'DELETE' }, token);
    await loadCalendarsAndEvents();
  }

  async function handleCreateCalendar(data) {
    await apiRequest(
      '/api/calendars',
      { method: 'POST', body: JSON.stringify(data) },
      token
    );
    await loadCalendarsAndEvents();
  }

  async function handleUpdateCalendar(id, data) {
    await apiRequest(
      `/api/calendars/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      token
    );
    await loadCalendarsAndEvents();
  }

  if (!token || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/70 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">Calendario Aziendale</h1>
          <p className="text-xs text-slate-400">
            Utente: {user.username} ({user.role})
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CalendarDashboard
            calendars={calendars}
            events={events}
            view={view}
            onViewChange={setView}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            loading={loading}
            onCreateOrUpdateEvent={handleCreateOrUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onCreateCalendar={handleCreateCalendar}
            onUpdateCalendar={handleUpdateCalendar}
          />
        </div>
        {user.role === 'admin' && (
          <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/60 overflow-y-auto">
            <AdminPanel token={token} />
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;

