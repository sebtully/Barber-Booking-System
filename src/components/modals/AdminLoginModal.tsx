interface AdminLoginModalProps {
  isOpen: boolean;
  email: string;
  password: string;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

const AdminLoginModal = ({
  isOpen,
  email,
  password,
  error,
  onClose,
  onSubmit,
  onEmailChange,
  onPasswordChange,
}: AdminLoginModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-zinc-100">Admin login</h2>
        <p className="mt-1 text-sm text-zinc-400">Kun administrator har adgang til admin-panelet.</p>
        <div className="mt-4 space-y-2">
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="email"
            placeholder="Admin e-mail"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            type="password"
            placeholder="Admin kodeord"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
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
            Log ind
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
