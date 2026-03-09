import React, { useState } from 'react';

function CalendarFilters({
  calendars,
  filters,
  onFiltersChange,
  onCreateCalendar,
  onUpdateCalendar
}) {
  const [newCalName, setNewCalName] = useState('');

  function toggleFilter(key) {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  }

  async function handleCreatePrivate() {
    if (!newCalName.trim()) return;
    await onCreateCalendar({ name: newCalName.trim(), type: 'private' });
    setNewCalName('');
  }

  return (
    <div className="p-4 text-sm space-y-4">
      <h2 className="font-semibold mb-2">Filtri calendari</h2>
      <div className="space-y-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.office}
            onChange={() => toggleFilter('office')}
            className="accent-office"
          />
          <span>Calendario ufficio</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.suboffice}
            onChange={() => toggleFilter('suboffice')}
            className="accent-suboffice"
          />
          <span>Calendari sotto-ufficio</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.private}
            onChange={() => toggleFilter('private')}
            className="accent-private"
          />
          <span>Calendari privati</span>
        </label>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-1 text-xs uppercase text-slate-400">
          I tuoi calendari
        </h3>
        <ul className="space-y-1 max-h-40 overflow-auto">
          {calendars.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md px-2 py-1 bg-slate-900/70"
            >
              <span className="truncate">
                {c.name}
                <span className="ml-1 text-[10px] uppercase text-slate-500">
                  {c.type}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <h3 className="font-semibold mb-1 text-xs uppercase text-slate-400">
          Nuovo calendario privato
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCalName}
            onChange={(e) => setNewCalName(e.target.value)}
            placeholder="Es. Hobby, Progetto X..."
            className="flex-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            onClick={handleCreatePrivate}
            className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-xs"
          >
            Crea
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarFilters;

