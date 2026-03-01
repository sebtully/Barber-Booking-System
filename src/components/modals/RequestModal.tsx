import type { RequestDraft } from '../../types';

interface RequestModalProps {
  isOpen: boolean;
  draft: RequestDraft;
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (updater: (current: RequestDraft) => RequestDraft) => void;
}

const RequestModal = ({ isOpen, draft, onClose, onSubmit, onDraftChange }: RequestModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-zinc-100">Anmod om tid</h2>
        <p className="mt-1 text-sm text-zinc-400">Indtast dine oplysninger. Tully modtager anmodningen med det samme.</p>
        <div className="mt-4 space-y-2">
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="text"
            placeholder="Navn"
            value={draft.name}
            onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="email"
            placeholder="E-mail"
            value={draft.email}
            onChange={(event) => onDraftChange((current) => ({ ...current, email: event.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="tel"
            placeholder="Telefonnummer"
            value={draft.phone}
            onChange={(event) => onDraftChange((current) => ({ ...current, phone: event.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="date"
            value={draft.date}
            onChange={(event) => onDraftChange((current) => ({ ...current, date: event.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="time"
            value={draft.time}
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                time: event.target.value,
                slotId: undefined,
              }))
            }
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            placeholder="Ekstra besked (valgfri)"
            value={draft.notes}
            onChange={(event) => onDraftChange((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>
        <div className="mt-4 flex flex-col justify-end gap-2 sm:flex-row">
          <button
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700"
            onClick={onClose}
          >
            Luk
          </button>
          <button
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
            onClick={onSubmit}
          >
            Send anmodning
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
