interface ClientHeaderProps {
  onAdminLoginClick: () => void;
}

const ClientHeader = ({ onAdminLoginClick }: ClientHeaderProps) => (
  <header className="mb-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Tully&apos;s Barber</h1>
      </div>
      <div className="flex w-full sm:w-auto">
        <button
          onClick={onAdminLoginClick}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700 sm:w-auto"
        >
          Admin login
        </button>
      </div>
    </div>
  </header>
);

export default ClientHeader;
