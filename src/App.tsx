import { useEffect, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import AdminPanel from './components/AdminPanel';
import ClientDashboard from './components/ClientDashboard';
import ClientHeader from './components/ClientHeader';
import AdminLoginModal from './components/modals/AdminLoginModal';
import RequestModal from './components/modals/RequestModal';
import { getTodayDate } from './lib/date';
import {
  createAdminSlot,
  createClientRequest,
  deleteAdminSlot,
  getAdminNotifications,
  getAdminRequests,
  getAdminSession,
  getAdminSlots,
  getPublicSlots,
  loginAdmin,
  logoutAdmin as logoutAdminRequest,
  updateAdminRequestStatus,
} from './services/barberApi';
import type { AdminUser, RequestDraft, TimeRequest, TimeSlot } from './types';

const todayDate = getTodayDate();

const App = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [requests, setRequests] = useState<TimeRequest[]>([]);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminActionError, setAdminActionError] = useState('');

  const [newSlotDate, setNewSlotDate] = useState(todayDate);
  const [newSlotTime, setNewSlotTime] = useState('09:00');

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDraft, setRequestDraft] = useState<RequestDraft>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    date: todayDate,
    time: '',
  });

  const loadPublicSlots = async () => {
    const publicSlots = await getPublicSlots();
    setSlots(publicSlots);
  };

  const loadAdminData = async () => {
    const [adminSlots, adminRequests, adminNotifications] = await Promise.all([
      getAdminSlots(),
      getAdminRequests(),
      getAdminNotifications(),
    ]);
    setSlots(adminSlots);
    setRequests(adminRequests);
    setNotificationLog(adminNotifications);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setGlobalError('');

      try {
        await loadPublicSlots();
      } catch {
        setGlobalError('Kunne ikke hente ledige tider.');
      }

      try {
        const user = await getAdminSession();
        setAdminUser(user);
        await loadAdminData();
      } catch {
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setRequestDraft((current) => ({
      ...current,
      slotId: undefined,
      time: current.slotId ? '' : current.time,
    }));
  };

  const openRequestModal = (date: string, time: string, slotId?: string) => {
    setRequestSuccess('');
    setGlobalError('');
    setRequestDraft((current) => ({
      ...current,
      date,
      time,
      slotId,
    }));
    setIsRequestModalOpen(true);
  };

  const submitRequest = async () => {
    if (!requestDraft.name || !requestDraft.email || !requestDraft.date || !requestDraft.time) {
      setGlobalError('Navn, e-mail, dato og tid er paakraevet.');
      return;
    }

    try {
      setGlobalError('');
      const response = await createClientRequest(requestDraft);
      if (response.emailStatus?.sent) {
        setRequestSuccess('Din anmodning er sendt til admin, og e-mail er afsendt.');
      } else if (response.emailStatus?.reason === 'email_send_failed') {
        setRequestSuccess('Din anmodning er sendt til admin, men e-mail kunne ikke afsendes.');
      } else {
        setRequestSuccess('Din anmodning er sendt til admin. E-mail er ikke konfigureret endnu.');
      }
      closeRequestModal();
      setRequestDraft((current) => ({
        ...current,
        notes: '',
        time: '',
        slotId: undefined,
      }));
      await loadPublicSlots();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke sende anmodning.';
      setGlobalError(message);
    }
  };

  const submitAdminLogin = async () => {
    try {
      setAdminLoginError('');
      setGlobalError('');
      const user = await loginAdmin(adminEmail, adminPassword);
      setAdminUser(user);
      setAdminEmail('');
      setAdminPassword('');
      setIsAdminLoginOpen(false);
      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login fejlede.';
      setAdminLoginError(message);
    }
  };

  const logoutAdmin = async () => {
    try {
      await logoutAdminRequest();
    } catch {
      // Ignore logout request errors and clear UI state anyway.
    }

    setAdminUser(null);
    setRequests([]);
    setNotificationLog([]);
    setAdminActionError('');
    setAdminLoginError('');
    setGlobalError('');
    setRequestSuccess('');

    try {
      await loadPublicSlots();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke hente offentlige tider.';
      setGlobalError(message);
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlotDate || !newSlotTime) {
      return;
    }

    try {
      setAdminActionError('');
      await createAdminSlot(newSlotDate, newSlotTime);
      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke oprette tid.';
      setAdminActionError(message);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'approved' | 'declined') => {
    try {
      setAdminActionError('');
      await updateAdminRequestStatus(requestId, status);
      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke opdatere anmodning.';
      setAdminActionError(message);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      setAdminActionError('');
      await deleteAdminSlot(slotId);
      await loadAdminData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke fjerne tid.';
      setAdminActionError(message);
    }
  };

  const wrapperClass = 'mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8';

  if (adminUser) {
    return (
      <main className={wrapperClass}>
        <AdminHeader adminUser={adminUser} onLogout={logoutAdmin} />
        {globalError ? (
          <p className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{globalError}</p>
        ) : null}
        {loading ? <p className="mb-4 text-sm text-zinc-400">Indlaeser...</p> : null}
        <AdminPanel
          slots={slots}
          requests={requests}
          notifications={notificationLog}
          newSlotDate={newSlotDate}
          newSlotTime={newSlotTime}
          adminActionError={adminActionError}
          onNewSlotDateChange={setNewSlotDate}
          onNewSlotTimeChange={setNewSlotTime}
          onCreateSlot={() => void handleCreateSlot()}
          onDeleteSlot={(slotId) => void handleDeleteSlot(slotId)}
          onUpdateRequestStatus={(requestId, status) => void handleUpdateRequestStatus(requestId, status)}
        />
      </main>
    );
  }

  return (
    <main className={wrapperClass}>
      <ClientHeader onAdminLoginClick={() => setIsAdminLoginOpen(true)} />
      {globalError ? (
        <p className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{globalError}</p>
      ) : null}
      {requestSuccess ? (
        <p className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {requestSuccess}
        </p>
      ) : null}
      {loading ? <p className="mb-4 text-sm text-zinc-400">Indlaeser...</p> : null}
      <ClientDashboard
        slots={slots}
        selectedDate={selectedDate}
        calendarMonth={calendarMonth}
        onPrevMonth={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
        onNextMonth={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
        onDateSelect={setSelectedDate}
        onOpenRequest={openRequestModal}
      />
      <RequestModal
        isOpen={isRequestModalOpen}
        draft={requestDraft}
        onClose={closeRequestModal}
        onSubmit={() => void submitRequest()}
        onDraftChange={setRequestDraft}
      />
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        email={adminEmail}
        password={adminPassword}
        error={adminLoginError}
        onClose={() => setIsAdminLoginOpen(false)}
        onSubmit={() => void submitAdminLogin()}
        onEmailChange={setAdminEmail}
        onPasswordChange={setAdminPassword}
      />
    </main>
  );
};

export default App;
