import { useMemo } from 'react';
import { buildCalendarCells, weekDays } from '../lib/date';
import { isSlotBooked } from '../lib/slot';
import type { TimeSlot } from '../types';

interface ClientDashboardProps {
  slots: TimeSlot[];
  selectedDate: string;
  calendarMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateSelect: (date: string) => void;
  onOpenRequest: (date: string, time: string, slotId?: string) => void;
}

const ClientDashboard = ({
  slots,
  selectedDate,
  calendarMonth,
  onPrevMonth,
  onNextMonth,
  onDateSelect,
  onOpenRequest,
}: ClientDashboardProps) => {
  const availableSlots = useMemo(() => slots.filter((slot) => !isSlotBooked(slot)), [slots]);

  const availableCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const slot of availableSlots) {
      counts.set(slot.date, (counts.get(slot.date) ?? 0) + 1);
    }
    return counts;
  }, [availableSlots]);

  const selectedDateSlots = useMemo(
    () =>
      availableSlots
        .filter((slot) => slot.date === selectedDate)
        .sort((left, right) => left.time.localeCompare(right.time)),
    [availableSlots, selectedDate],
  );

  const sortedAvailableSlots = useMemo(
    () =>
      [...availableSlots].sort((left, right) =>
        `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`),
      ),
    [availableSlots],
  );

  const monthLabel = useMemo(
    () => calendarMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' }),
    [calendarMonth],
  );

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
      <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 sm:p-5">
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Ledige tider</h3>
          <div className="max-h-44 overflow-auto rounded-lg border border-zinc-800">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  
                </tr>
              </thead>
              <tbody>
                {sortedAvailableSlots.map((slot) => (
                  <tr key={slot.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-3 py-2">
                      <button
                        className="flex w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-left text-xs font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 sm:text-sm"
                        onClick={() => onOpenRequest(slot.date, slot.time, slot.id)}
                        aria-label={`Anmod om ledig tid ${slot.date} kl. ${slot.time}`}
                      >
                        <span>{slot.date}</span>
                        <span>kl. {slot.time}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedAvailableSlots.length === 0 ? (
                  <tr className="border-t border-zinc-800 text-zinc-500">
                    <td className="px-3 py-2" colSpan={1}>
                      Ingen ledige tider lige nu.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700 sm:text-sm"
            onClick={onPrevMonth}
          >
            Forrige
          </button>
          <h2 className="text-base font-semibold capitalize text-zinc-100 sm:text-lg">{monthLabel}</h2>
          <button
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700 sm:text-sm"
            onClick={onNextMonth}
          >
            Næste
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarCells.map((cell, index) =>
            cell.date ? (
              <button
                key={cell.date}
                className={[
                  'flex min-h-[72px] flex-col justify-between rounded-xl border p-2 text-left transition sm:min-h-[82px]',
                  selectedDate === cell.date
                    ? 'border-zinc-200 bg-zinc-100 text-zinc-900'
                    : availableCountByDate.has(cell.date)
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-100 hover:border-zinc-600',
                  availableCountByDate.has(cell.date) ? '' : 'opacity-70',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onDateSelect(cell.date as string)}
              >
                <span className="text-sm font-semibold sm:text-base">{cell.dayNumber}</span>
                <small
                  className={[
                    'text-[10px] sm:text-[11px]',
                    selectedDate === cell.date ? 'text-zinc-700' : 'text-zinc-400',
                  ].join(' ')}
                >
                  {availableCountByDate.get(cell.date) ?? 0} ledige
                </small>
              </button>
            ) : (
              <div key={`empty-${index}`} className="min-h-[72px] rounded-xl border border-transparent sm:min-h-[82px]" />
            ),
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Valgt dato: {selectedDate}</h2>
        <p className="mt-1 text-sm text-zinc-400">Klik på en tid for at sende en anmodning.</p>
        <ul className="mt-4 space-y-2">
          {selectedDateSlots.map((slot) => (
            <li
              key={slot.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <strong className="text-zinc-100">{slot.time}</strong>
              <button
                onClick={() => onOpenRequest(slot.date, slot.time, slot.id)}
                className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white sm:w-auto"
              >
                Anmod tid
              </button>
            </li>
          ))}
          {selectedDateSlots.length === 0 ? <li className="text-sm text-zinc-500">Ingen ledige tider denne dato.</li> : null}
        </ul>
        <button
          className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700 sm:w-auto"
          onClick={() => onOpenRequest(selectedDate, '')}
        >
          Anmod en tid på valgt dato
        </button>
      </article>
    </section>
  );
};

export default ClientDashboard;
