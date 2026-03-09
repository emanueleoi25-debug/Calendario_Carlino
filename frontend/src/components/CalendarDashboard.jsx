import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import CalendarFilters from './CalendarFilters.jsx';
import EventFormModal from './EventFormModal.jsx';
import DayView from './DayView.jsx';
import WeekView from './WeekView.jsx';
import MonthView from './MonthView.jsx';

function CalendarDashboard({
  calendars,
  events,
  view,
  onViewChange,
  selectedDate,
  onDateChange,
  loading,
  onCreateOrUpdateEvent,
  onDeleteEvent,
  onCreateCalendar,
  onUpdateCalendar
}) {
  const [filters, setFilters] = useState({
    office: true,
    suboffice: true,
    private: true
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventsWithCalendar = useMemo(() => {
    const calById = new Map(calendars.map((c) => [c.id, c]));
    return events
      .map((e) => ({ ...e, calendar: calById.get(e.calendar_id) }))
      .filter((e) => !!e.calendar)
      .filter((e) => {
        if (e.calendar.type === 'office' && !filters.office) return false;
        if (e.calendar.type === 'sub-office' && !filters.suboffice) return false;
        if (e.calendar.type === 'private' && !filters.private) return false;
        return true;
      });
  }, [events, calendars, filters]);

  function openCreateEvent(date) {
    setSelectedEvent({
      calendar_id: calendars.find((c) => c.type === 'office')?.id || calendars[0]?.id,
      title: '',
      description: '',
      start_datetime: date.toISOString(),
      end_datetime: date.add(1, 'hour').toISOString(),
      is_all_day: false
    });
    setIsModalOpen(true);
  }

  function openEditEvent(event) {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }

  const ViewComponent =
    view === 'day' ? DayView : view === 'week' ? WeekView : MonthView;

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded-md bg-slate-800 text-xs"
            onClick={() => onDateChange(dayjs())}
          >
            Oggi
          </button>
          <button
            className="px-2 py-1 rounded-md bg-slate-800 text-xs"
            onClick={() => onDateChange(selectedDate.subtract(1, view === 'month' ? 'month' : 'week'))}
          >
            ◀
          </button>
          <button
            className="px-2 py-1 rounded-md bg-slate-800 text-xs"
            onClick={() => onDateChange(selectedDate.add(1, view === 'month' ? 'month' : 'week'))}
          >
            ▶
          </button>
          <div className="ml-2 text-sm font-medium">
            {selectedDate.format(view === 'month' ? 'MMMM YYYY' : 'DD MMM YYYY')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['day', 'week', 'month'].map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 rounded-full text-xs ${
                view === v ? 'bg-sky-600' : 'bg-slate-800'
              }`}
            >
              {v === 'day' ? 'Giorno' : v === 'week' ? 'Settimana' : 'Mese'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-office" /> Ufficio
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-suboffice" /> Sotto-ufficio
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-private" /> Privato
          </span>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-950/60 hidden md:block">
          <CalendarFilters
            calendars={calendars}
            filters={filters}
            onFiltersChange={setFilters}
            onCreateCalendar={onCreateCalendar}
            onUpdateCalendar={onUpdateCalendar}
          />
        </aside>
        <section className="flex-1 overflow-auto">
          <ViewComponent
            date={selectedDate}
            events={eventsWithCalendar}
            onCreateEventAt={openCreateEvent}
            onEditEvent={openEditEvent}
            onDeleteEvent={onDeleteEvent}
            loading={loading}
          />
        </section>
      </div>

      {isModalOpen && selectedEvent && (
        <EventFormModal
          event={selectedEvent}
          calendars={calendars}
          onClose={closeModal}
          onSave={async (data) => {
            await onCreateOrUpdateEvent(data, selectedEvent.id);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

export default CalendarDashboard;

