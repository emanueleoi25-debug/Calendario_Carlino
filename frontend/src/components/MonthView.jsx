import React from 'react';
import dayjs from 'dayjs';

function MonthView({ date, events, onCreateEventAt, onEditEvent, onDeleteEvent, loading }) {
  const start = date.startOf('month').startOf('week');
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(start.add(i, 'day'));
  }

  function eventsForDay(d) {
    return events.filter((e) => dayjs(e.start_datetime).isSame(d, 'day'));
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 text-xs text-slate-400 flex justify-between">
        <span>Vista mensile</span>
        {loading && <span>Caricamento...</span>}
      </div>
      <div className="grid grid-cols-7 text-[11px] border-t border-slate-800">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
          <div
            key={d}
            className="px-2 py-1 text-center border-l border-slate-800 first:border-l-0 bg-slate-900/60"
          >
            {d}
          </div>
        ))}
        {days.map((d) => {
          const isCurrentMonth = d.month() === date.month();
          const dayEvents = eventsForDay(d);
          return (
            <div
              key={d.toString()}
              className="border-l border-b border-slate-800 first:border-l-0 min-h-[80px] flex flex-col"
              onDoubleClick={() =>
                onCreateEventAt(d.hour(9).minute(0).second(0))
              }
            >
              <div
                className={`px-1 pt-1 text-[10px] text-right ${
                  isCurrentMonth ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {d.date()}
              </div>
              <div className="flex-1 p-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventDot
                    key={e.id}
                    event={e}
                    onClick={() => onEditEvent(e)}
                    onDelete={() => onDeleteEvent(e.id)}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-slate-400">
                    +{dayEvents.length - 3} altri
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventDot({ event, onClick, onDelete }) {
  const colorClass =
    event.calendar.type === 'office'
      ? 'bg-office'
      : event.calendar.type === 'sub-office'
      ? 'bg-suboffice'
      : 'bg-private';

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <button
        onClick={onClick}
        className={`w-2 h-2 rounded-full ${colorClass} flex-shrink-0`}
      />
      <button
        onClick={onClick}
        className="truncate flex-1 text-left hover:underline"
      >
        {event.is_all_day ? '🕒 ' : ''}
        {event.title}
      </button>
      <button
        onClick={onDelete}
        className="text-[9px] text-slate-500 hover:text-red-400"
      >
        ✕
      </button>
    </div>
  );
}

export default MonthView;

