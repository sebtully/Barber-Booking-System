import { useMemo } from 'react';
import type { TimeRequest, TimeSlot } from '../types';

interface AdminPanelProps {
  slots: TimeSlot[];
  requests: TimeRequest[];
  notifications: string[];
  newSlotDate: string;
  newSlotTime: string;
  adminActionError: string;
  onNewSlotDateChange: (value: string) => void;
  onNewSlotTimeChange: (value: string) => void;
  onCreateSlot: () => void;
  onDeleteSlot: (slotId: string) => void;
  onUpdateRequestStatus: (requestId: string, status: 'approved' | 'declined') => void;
}

const buttonBase =
  'rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-500';
const primaryButton = `${buttonBase} bg-zinc-100 text-zinc-900 hover:bg-white`;
const secondaryButton = `${buttonBase} border border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-700`;
const fieldClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500';

const AdminPanel = ({
  slots,
  requests,
  notifications,
  newSlotDate,
  newSlotTime,
  adminActionError,
  onNewSlotDateChange,
  onNewSlotTimeChange,
  onCreateSlot,
  onDeleteSlot,
  onUpdateRequestStatus,
}: AdminPanelProps) => {
  const sortedSlots = useMemo(
    () => [...slots].sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`)),
    [slots],
  );

  return (
    <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-zinc-100">Opret ledig tid</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input className={fieldClass} type="date" value={newSlotDate} onChange={(event) => onNewSlotDateChange(event.target.value)} />
          <input className={fieldClass} type="time" value={newSlotTime} onChange={(event) => onNewSlotTimeChange(event.target.value)} />
          <button className={primaryButton} onClick={onCreateSlot}>
            Opret
          </button>
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-zinc-100">Alle tider</h2>
        <ul className="mt-3 space-y-2">
          {sortedSlots.map((slot) => (
            <li
              key={slot.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <strong className="text-zinc-100">
                  {slot.date} kl. {slot.time}
                </strong>{' '}
                - {slot.bookedBy ? `Booket af ${slot.bookedBy}` : 'Ledig'}
              </div>
              {!slot.bookedBy ? (
                <button className={secondaryButton} onClick={() => onDeleteSlot(slot.id)}>
                  Fjern
                </button>
              ) : null}
            </li>
          ))}
          {sortedSlots.length === 0 ? <li className="text-sm text-zinc-500">Ingen tider oprettet endnu.</li> : null}
        </ul>
      </article>

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 lg:col-span-2">
        <h2 className="text-lg font-semibold text-zinc-100">Kundeanmodninger</h2>
        <ul className="mt-3 space-y-2">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm text-zinc-300">
                <strong className="text-zinc-100">{request.name}</strong> ({request.email}) onsker {request.date} kl. {request.time}
                {request.phone ? <div>Telefon: {request.phone}</div> : null}
                {request.notes ? <div>Besked: {request.notes}</div> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={[
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    request.status === 'approved'
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : request.status === 'declined'
                        ? 'bg-rose-400/20 text-rose-300'
                        : 'bg-amber-400/20 text-amber-300',
                  ].join(' ')}
                >
                  {request.status}
                </span>
                <button
                  className={primaryButton}
                  disabled={request.status !== 'requested'}
                  onClick={() => onUpdateRequestStatus(request.id, 'approved')}
                >
                  Accepter
                </button>
                <button
                  className={secondaryButton}
                  disabled={request.status !== 'requested'}
                  onClick={() => onUpdateRequestStatus(request.id, 'declined')}
                >
                  Afslag
                </button>
              </div>
            </li>
          ))}
          {requests.length === 0 ? <li className="text-sm text-zinc-500">Ingen anmodninger endnu.</li> : null}
        </ul>
      </article>

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 lg:col-span-2">
        <h2 className="text-lg font-semibold text-zinc-100">Notifikationslog</h2>
        <ul className="mt-3 space-y-2">
          {notifications.map((message) => (
            <li key={message} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300">
              {message}
            </li>
          ))}
          {notifications.length === 0 ? <li className="text-sm text-zinc-500">Ingen notifikationer endnu.</li> : null}
        </ul>
      </article>

      {adminActionError ? (
        <article className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-300 lg:col-span-2">
          {adminActionError}
        </article>
      ) : null}
    </section>
  );
};

export default AdminPanel;
