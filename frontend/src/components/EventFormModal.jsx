import React, { useState } from 'react';
import dayjs from 'dayjs';

function EventFormModal({ event, calendars, onClose, onSave }) {
  const [form, setForm] = useState({
    calendar_id: event.calendar_id,
    title: event.title,
    description: event.description || '',
    start_datetime: dayjs(event.start_datetime).format('YYYY-MM-DDTHH:mm'),
    end_datetime: dayjs(event.end_datetime).format('YYYY-MM-DDTHH:mm'),
    is_all_day: event.is_all_day ? true : false
  });
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const start = dayjs(form.start_datetime);
    const end = dayjs(form.end_datetime);
    if (!form.title.trim()) {
      setError('Titolo obbligatorio');
      return;
    }
    if (!form.is_all_day && !end.isAfter(start)) {
      setError('L\'orario di fine deve essere successivo all\'inizio');
      return;
    }
    onSave({
      calendar_id: Number(form.calendar_id),
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_datetime: start.toISOString(),
      end_datetime: form.is_all_day ? start.endOf('day').toISOString() : end.toISOString(),
      is_all_day: form.is_all_day
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            {event.id ? 'Modifica evento' : 'Nuovo evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Chiudi
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs mb-1">Calendario</label>
            <select
              value={form.calendar_id}
              onChange={(e) => updateField('calendar_id', e.target.value)}
              className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Titolo</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1">Inizio</label>
              <input
                type="datetime-local"
                value={form.start_datetime}
                onChange={(e) => updateField('start_datetime', e.target.value)}
                className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Fine</label>
              <input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(e) => updateField('end_datetime', e.target.value)}
                className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs"
                disabled={form.is_all_day}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.is_all_day}
              onChange={(e) => updateField('is_all_day', e.target.checked)}
            />
            Evento tutto il giorno
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-slate-800 text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-xs"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventFormModal;

