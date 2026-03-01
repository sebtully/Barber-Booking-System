import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';

const MONGODB_URI = String(process.env.MONGODB_URI || '').trim();
const MONGODB_DB = String(process.env.MONGODB_DB || 'barber_booking').trim();

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Set it in your .env or Vercel environment.');
}

const MONGO_CACHE_KEY = '__barberMongoCache';
const mongoCache =
  globalThis[MONGO_CACHE_KEY] ||
  (globalThis[MONGO_CACHE_KEY] = {
    readyPromise: null,
    db: null,
    collections: null,
  });

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultSlots = () => {
  const now = new Date();
  const tomorrowDate = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const dayAfterTomorrowDate = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));

  return [
    { id: 's1', date: tomorrowDate, time: '09:00' },
    { id: 's2', date: tomorrowDate, time: '10:00' },
    { id: 's3', date: dayAfterTomorrowDate, time: '14:00' },
  ];
};

const toPublicSlot = (slot) => ({
  id: slot.id,
  date: slot.date,
  time: slot.time,
  isBooked: Boolean(slot.bookedBy),
});

const toAdminSlot = (slot) => ({
  id: slot.id,
  date: slot.date,
  time: slot.time,
  ...(slot.bookedBy ? { bookedBy: slot.bookedBy } : {}),
  ...(slot.customerEmail ? { customerEmail: slot.customerEmail } : {}),
});

const toTimeRequest = (request) => ({
  id: request.id,
  name: request.name,
  email: request.email,
  phone: request.phone || '',
  notes: request.notes || '',
  date: request.date,
  time: request.time,
  status: request.status,
  ...(request.slotId ? { slotId: request.slotId } : {}),
});

const ensureReady = async () => {
  if (mongoCache.readyPromise) {
    return mongoCache.readyPromise;
  }

  mongoCache.readyPromise = (async () => {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(MONGODB_DB);
    const slots = db.collection('slots');
    const requests = db.collection('requests');
    const notifications = db.collection('notifications');
    const meta = db.collection('meta');

    await Promise.all([
      slots.createIndex({ id: 1 }, { unique: true }),
      slots.createIndex({ date: 1, time: 1 }, { unique: true }),
      requests.createIndex({ id: 1 }, { unique: true }),
      notifications.createIndex({ createdAt: -1 }),
      meta.createIndex({ key: 1 }, { unique: true }),
    ]);

    const seedKey = 'default_slots_seeded_v1';
    const seedMarker = await meta.findOne({ key: seedKey });
    if (!seedMarker) {
      const slotCount = await slots.countDocuments();
      if (slotCount === 0) {
        await slots.insertMany(getDefaultSlots());
      }
      await meta.insertOne({ key: seedKey, seededAt: new Date() });
    }

    mongoCache.db = db;
    mongoCache.collections = {
      slots,
      requests,
      notifications,
    };
  })().catch((error) => {
    mongoCache.readyPromise = null;
    throw error;
  });

  return mongoCache.readyPromise;
};

const getCollections = async () => {
  await ensureReady();
  return mongoCache.collections;
};

export const storageInfo = {
  mode: 'mongodb',
  database: MONGODB_DB,
};

export const getPublicSlots = async () => {
  const { slots } = await getCollections();
  const docs = await slots.find({}).sort({ date: 1, time: 1 }).toArray();
  return docs.map(toPublicSlot);
};

export const getAdminSlots = async () => {
  const { slots } = await getCollections();
  const docs = await slots.find({}).sort({ date: 1, time: 1 }).toArray();
  return docs.map(toAdminSlot);
};

export const getSlotById = async (slotId) => {
  const { slots } = await getCollections();
  return slots.findOne({ id: slotId });
};

export const createAdminSlot = async (date, time) => {
  const { slots } = await getCollections();
  const slot = { id: randomUUID(), date, time };
  await slots.insertOne(slot);
  return slot;
};

export const deleteAdminSlot = async (slotId) => {
  const { slots } = await getCollections();
  const existing = await slots.findOne({ id: slotId });

  if (!existing) {
    return { ok: false, reason: 'not_found' };
  }

  if (existing.bookedBy) {
    return { ok: false, reason: 'booked' };
  }

  await slots.deleteOne({ id: slotId });
  return { ok: true, slot: existing };
};

export const createTimeRequest = async ({ name, email, phone, notes, date, time, slotId }) => {
  const { requests } = await getCollections();
  const request = {
    id: randomUUID(),
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
    notes: String(notes || '').trim(),
    date: String(date || '').trim(),
    time: String(time || '').trim(),
    status: 'requested',
    slotId: slotId ? String(slotId).trim() : undefined,
  };

  await requests.insertOne(request);
  return request;
};

export const getTimeRequests = async () => {
  const { requests } = await getCollections();
  const docs = await requests.find({}).sort({ date: -1, time: -1 }).toArray();
  return docs.map(toTimeRequest);
};

export const updateTimeRequestStatus = async (requestId, status) => {
  const { requests } = await getCollections();
  const updateResult = await requests.updateOne({ id: requestId }, { $set: { status } });

  if (!updateResult.matchedCount) {
    return null;
  }

  const updated = await requests.findOne({ id: requestId });
  return updated ? toTimeRequest(updated) : null;
};

export const bookSlotForRequest = async (request) => {
  const { slots } = await getCollections();
  const bookingPatch = {
    $set: {
      bookedBy: request.name,
      customerEmail: request.email,
    },
  };

  if (request.slotId) {
    const slotByIdResult = await slots.updateOne({ id: request.slotId, bookedBy: { $exists: false } }, bookingPatch);
    if (slotByIdResult.modifiedCount > 0) {
      return true;
    }
  }

  const matchingSlotResult = await slots.updateOne(
    { date: request.date, time: request.time, bookedBy: { $exists: false } },
    bookingPatch,
  );
  if (matchingSlotResult.modifiedCount > 0) {
    return true;
  }

  const alreadyBooked = await slots.findOne({ date: request.date, time: request.time, bookedBy: { $exists: true } });
  if (alreadyBooked) {
    return false;
  }

  await slots.insertOne({
    id: randomUUID(),
    date: request.date,
    time: request.time,
    bookedBy: request.name,
    customerEmail: request.email,
  });

  return true;
};

export const addNotification = async (message) => {
  const { notifications } = await getCollections();
  await notifications.insertOne({
    message: String(message || ''),
    createdAt: new Date(),
  });
};

export const getNotifications = async () => {
  const { notifications } = await getCollections();
  const docs = await notifications.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => String(doc.message || ''));
};
