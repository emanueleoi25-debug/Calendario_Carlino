import React from 'react';
import dayjs from 'dayjs';

function WeekView({ date, events, onCreateEventAt, onEditEvent, onDeleteEvent, loading }) {
  const startOfWeek = date.startOf('week');
  const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  function eventsForDay(d) {
    return events.filter((e) => dayjs(e.start_datetime).isSame(d, 'day'));
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 text-xs text-slate-400 flex justify-between">
        <span>Vista settimanale</span>
        {loading && <span>Caricamento...</span>}
      </div>
      <div className="flex-1 grid grid-cols-7 border-t border-slate-800 text-[11px]">
        {days.map((d) => (
          <div
            key={d.toString()}
            className="border-l border-slate-800 first:border-l-0 flex flex-col"
          >
            <div className="px-2 py-1 border-b border-slate-800 text-center bg-slate-900/60">
              <div className="font-medium">
                {d.format('dd')}
              </div>
              <div className="text-slate-400">{d.format('DD')}</div>
            </div>
            <div
              className="flex-1 p-1 space-y-1 overflow-auto cursor-pointer"
              onDoubleClick={() =>
                onCreateEventAt(d.hour(9).minute(0).second(0))
              }
            >
              {eventsForDay(d).map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onClick={() => onEditEvent(e)}
                  onDelete={() => onDeleteEvent(e.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, onClick, onDelete }) {
  const colorClass =
    event.calendar.type === 'office'
      ? 'border-office/70'
      : event.calendar.type === 'sub-office'
      ? 'border-suboffice/70'
      : 'border-private/70';

  const startTime = dayjs(event.start_datetime).format('HH:mm');
  const endTime = dayjs(event.end_datetime).format('HH:mm');

  return (
    <div
      className={`rounded-md border px-2 py-1 bg-slate-900/70 hover:bg-slate-900 cursor-pointer ${colorClass}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center gap-1">
        <div className="truncate text-[11px] font-medium">
          {event.is_all_day ? 'Tutto il giorno' : `${startTime} - ${endTime}`}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[10px] text-slate-500 hover:text-red-400"
        >
          ✕
        </button>
      </div>
      <div className="truncate text-[11px]">{event.title}</div>
    </div>
  );
}

export default WeekView;

