import type { AdminUser } from '../types';

interface AdminHeaderProps {
  adminUser: AdminUser;
  onLogout: () => void;
}

const AdminHeader = ({ adminUser, onLogout }: AdminHeaderProps) => (
  <header className="mb-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Admin Panel</h1>
        <p className="mt-1 text-sm text-zinc-400">Logget ind som {adminUser.name}</p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Admin
        </span>
        <button
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700"
          onClick={onLogout}
        >
          Log ud admin
        </button>
      </div>
    </div>
  </header>
);

export default AdminHeader;
