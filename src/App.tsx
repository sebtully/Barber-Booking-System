import { useMemo, useState } from 'react';

type AppointmentStatus = 'booked' | 'requested' | 'approved' | 'declined';

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  bookedBy?: string;
  customerEmail?: string;
}

interface TimeRequest {
  id: string;
  name: string;
  email: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

const initialSlots: TimeSlot[] = [
  { id: 's1', date: '2026-03-02', time: '09:00' },
  { id: 's2', date: '2026-03-02', time: '10:00' },
  { id: 's3', date: '2026-03-03', time: '14:00' },
];

const createNotification = (name: string, date: string, time: string, type: 'booking' | 'request') =>
  `📧 Simuleret e-mail til ejer: ${name} har lavet en ${type === 'booking' ? 'booking' : 'tidsanmodning'} den ${date} kl. ${time}.`;

const App = () => {
  const [slots, setSlots] = useState<TimeSlot[]>(initialSlots);
  const [requests, setRequests] = useState<TimeRequest[]>([]);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);

  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');

  const availableSlots = useMemo(() => slots.filter((slot) => !slot.bookedBy), [slots]);

  const addNotification = (message: string) => {
    setNotificationLog((current) => [message, ...current]);
  };

  const createSlot = () => {
    if (!newSlotDate || !newSlotTime) {
      return;
    }

    setSlots((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        date: newSlotDate,
        time: newSlotTime,
      },
    ]);

    setNewSlotDate('');
    setNewSlotTime('');
  };

  const bookSlot = (slotId: string) => {
    if (!customerName || !customerEmail) {
      return;
    }

    setSlots((current) =>
      current.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              bookedBy: customerName,
              customerEmail,
            }
          : slot,
      ),
    );

    const selectedSlot = slots.find((slot) => slot.id === slotId);
    if (selectedSlot) {
      addNotification(createNotification(customerName, selectedSlot.date, selectedSlot.time, 'booking'));
    }
  };

  const submitRequest = () => {
    if (!requestName || !requestEmail || !requestDate || !requestTime) {
      return;
    }

    const request: TimeRequest = {
      id: crypto.randomUUID(),
      name: requestName,
      email: requestEmail,
      date: requestDate,
      time: requestTime,
      status: 'requested',
    };

    setRequests((current) => [request, ...current]);
    addNotification(createNotification(requestName, requestDate, requestTime, 'request'));

    setRequestName('');
    setRequestEmail('');
    setRequestDate('');
    setRequestTime('');
  };

  const updateRequestStatus = (requestId: string, status: 'approved' | 'declined') => {
    setRequests((current) =>
      current.map((request) => (request.id === requestId ? { ...request, status } : request)),
    );
  };

  return (
    <main className="page">
      <header>
        <h1>Barber Booking System</h1>
        <p>Administrér ledige tider, modtag forespørgsler og hold styr på kundebookinger.</p>
      </header>

      <section className="grid">
        <article className="card">
          <h2>1) Ledige tider (Admin)</h2>
          <div className="row">
            <input type="date" value={newSlotDate} onChange={(event) => setNewSlotDate(event.target.value)} />
            <input type="time" value={newSlotTime} onChange={(event) => setNewSlotTime(event.target.value)} />
            <button onClick={createSlot}>Opret tid</button>
          </div>
          <ul>
            {slots.map((slot) => (
              <li key={slot.id}>
                <strong>
                  {slot.date} kl. {slot.time}
                </strong>{' '}
                — {slot.bookedBy ? `Booket af ${slot.bookedBy}` : 'Ledig'}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>2) Book ledig tid (Klient)</h2>
          <div className="stack">
            <input
              type="text"
              placeholder="Dit navn"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
            <input
              type="email"
              placeholder="Din e-mail"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
            />
          </div>
          <ul>
            {availableSlots.map((slot) => (
              <li key={slot.id} className="slot-row">
                <span>
                  {slot.date} kl. {slot.time}
                </span>
                <button onClick={() => bookSlot(slot.id)}>Book</button>
              </li>
            ))}
            {availableSlots.length === 0 ? <li>Ingen ledige tider lige nu.</li> : null}
          </ul>
        </article>

        <article className="card">
          <h2>3) Tidsanmodning (Klient)</h2>
          <div className="stack">
            <input
              type="text"
              placeholder="Dit navn"
              value={requestName}
              onChange={(event) => setRequestName(event.target.value)}
            />
            <input
              type="email"
              placeholder="Din e-mail"
              value={requestEmail}
              onChange={(event) => setRequestEmail(event.target.value)}
            />
            <input type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)} />
            <input type="time" value={requestTime} onChange={(event) => setRequestTime(event.target.value)} />
            <button onClick={submitRequest}>Send anmodning</button>
          </div>
        </article>

        <article className="card">
          <h2>4) Håndtér anmodninger (Admin)</h2>
          <ul>
            {requests.map((request) => (
              <li key={request.id} className="request-item">
                <div>
                  <strong>{request.name}</strong> ({request.email}) ønsker {request.date} kl. {request.time}
                </div>
                <div className="row">
                  <span className={`status status-${request.status}`}>{request.status}</span>
                  <button onClick={() => updateRequestStatus(request.id, 'approved')}>Acceptér</button>
                  <button onClick={() => updateRequestStatus(request.id, 'declined')}>Afslå</button>
                </div>
              </li>
            ))}
            {requests.length === 0 ? <li>Ingen tidsanmodninger endnu.</li> : null}
          </ul>
        </article>

        <article className="card full-width">
          <h2>E-mail notifikationer (simuleret)</h2>
          <p>Disse beskeder viser det indhold, som normalt sendes via backend e-mail service.</p>
          <ul>
            {notificationLog.map((message) => (
              <li key={message}>{message}</li>
            ))}
            {notificationLog.length === 0 ? <li>Ingen notifikationer endnu.</li> : null}
          </ul>
        </article>
      </section>
    </main>
  );
};

export default App;
