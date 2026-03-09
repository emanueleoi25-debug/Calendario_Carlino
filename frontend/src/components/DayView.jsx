import React from 'react';
import dayjs from 'dayjs';

function DayView({ date, events, onCreateEventAt, onEditEvent, onDeleteEvent, loading }) {
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 8-19

  function eventsForHour(h) {
    return events.filter((e) => {
      const start = dayjs(e.start_datetime);
      return (
        start.isSame(date, 'day') &&
        start.hour() === h
      );
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 text-xs text-slate-400 flex justify-between">
        <span>Vista giornaliera</span>
        {loading && <span>Caricamento...</span>}
      </div>
      <div className="flex-1 overflow-auto border-t border-slate-800">
        {hours.map((h) => (
          <div
            key={h}
            className="border-b border-slate-800 flex hover:bg-slate-900/60"
          >
            <div className="w-16 text-right pr-2 text-[10px] text-slate-500 pt-2">
              {String(h).padStart(2, '0')}:00
            </div>
            <div
              className="flex-1 min-h-[48px] px-2 py-1 cursor-pointer"
              onDoubleClick={() =>
                onCreateEventAt(date.hour(h).minute(0).second(0))
              }
            >
              <div className="flex flex-wrap gap-1">
                {eventsForHour(h).map((e) => (
                  <EventPill
                    key={e.id}
                    event={e}
                    onClick={() => onEditEvent(e)}
                    onDelete={() => onDeleteEvent(e.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventPill({ event, onClick, onDelete }) {
  const colorClass =
    event.calendar.type === 'office'
      ? 'bg-office/80'
      : event.calendar.type === 'sub-office'
      ? 'bg-suboffice/80'
      : 'bg-private/80';

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-950 ${colorClass}`}
    >
      <button onClick={onClick} className="truncate max-w-[120px] text-left">
        {event.is_all_day ? '🕒 ' : ''}
        {event.title}
      </button>
      <button
        onClick={onDelete}
        className="text-slate-900/80 hover:text-slate-950 text-[9px]"
      >
        ✕
      </button>
    </div>
  );
}

export default DayView;

