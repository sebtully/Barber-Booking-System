import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import {
  addNotification,
  bookSlotForRequest,
  createAdminSlot,
  createTimeRequest,
  deleteAdminSlot,
  getAdminSlots,
  getNotifications,
  getPublicSlots,
  getSlotById,
  getTimeRequests,
  updateTimeRequestStatus,
  storageInfo,
} from './db.mjs';

const SESSION_COOKIE_NAME = 'barber_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = Number(process.env.ADMIN_LOGIN_WINDOW_MS || 10 * 60 * 1000);
const LOGIN_MAX_ATTEMPTS = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 8);
const LOGIN_LOCK_MS = Number(process.env.ADMIN_LOGIN_LOCK_MS || 15 * 60 * 1000);
const SMTP_HOST = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const MAIL_TO = (process.env.MAIL_TO || SMTP_USER).trim();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || '').trim();

if (!ADMIN_EMAIL) {
  throw new Error('ADMIN_EMAIL is required.');
}

if (!ADMIN_PASSWORD_HASH) {
  throw new Error('ADMIN_PASSWORD_HASH is required.');
}

const ADMIN_USER = {
  id: 'admin-1',
  name: 'Salon Admin',
  email: ADMIN_EMAIL,
  role: 'admin',
};

const sessions = new Map();
const loginAttempts = new Map();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createNotification = (name, date, time, type) =>
  `${name} har lavet en ${type === 'booking' ? 'booking' : 'tidsanmodning'}: ${date} kl. ${time}.`;

const emailEnabled = Boolean(SMTP_USER && SMTP_PASS && MAIL_TO);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

const readBody = async (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

const sendJson = (res, statusCode, payload, extraHeaders = {}) => {
  res.writeHead(statusCode, {
    ...jsonHeaders,
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join('='));
    return acc;
  }, {});

const createSessionCookie = (token) =>
  `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/api; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Strict${IS_PRODUCTION ? '; Secure' : ''}`;

const clearSessionCookie = () => `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/api; Max-Age=0; SameSite=Strict${IS_PRODUCTION ? '; Secure' : ''}`;

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return String(req.socket?.remoteAddress || 'unknown');
};

const getRateKey = (req, email = '') => `${getClientIp(req)}|${normalizeEmail(email)}`;

const cleanupLoginAttempt = (record, nowMs) => {
  if (!record) {
    return null;
  }

  if (record.lockedUntil && record.lockedUntil <= nowMs) {
    return null;
  }

  if (record.firstAttemptAt + LOGIN_WINDOW_MS <= nowMs) {
    return null;
  }

  return record;
};

const getLoginAttemptState = (key) => {
  const nowMs = Date.now();
  const state = cleanupLoginAttempt(loginAttempts.get(key), nowMs);
  if (!state) {
    loginAttempts.delete(key);
    return null;
  }
  return state;
};

const registerLoginFailure = (key) => {
  const nowMs = Date.now();
  const current = getLoginAttemptState(key);
  const next = current
    ? { ...current, count: current.count + 1 }
    : {
        count: 1,
        firstAttemptAt: nowMs,
        lockedUntil: 0,
      };

  if (next.count >= LOGIN_MAX_ATTEMPTS) {
    next.lockedUntil = nowMs + LOGIN_LOCK_MS;
  }

  loginAttempts.set(key, next);
  return next;
};

const clearLoginFailures = (key) => {
  loginAttempts.delete(key);
};

const sanitizeText = (value, maxLen) => String(value || '').trim().slice(0, maxLen);

const isValidDateTime = (date, time) => DATE_RE.test(date) && TIME_RE.test(time);

const pruneInMemoryAuthState = () => {
  const nowMs = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (!session || session.expiresAt <= nowMs) {
      sessions.delete(token);
    }
  }

  for (const [key, record] of loginAttempts.entries()) {
    const state = cleanupLoginAttempt(record, nowMs);
    if (!state) {
      loginAttempts.delete(key);
    }
  }
};

const getAdminFromSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  return ADMIN_USER;
};

const requireAdmin = (req, res) => {
  const admin = getAdminFromSession(req);
  if (!admin) {
    sendJson(res, 401, { error: 'Admin login required.' });
    return null;
  }
  return admin;
};

const sendRequestEmailToOwner = async (request) => {
  if (!transporter || !emailEnabled) {
    return {
      sent: false,
      reason: 'email_not_configured',
    };
  }

  const text = [
    'Ny tidsanmodning modtaget',
    `Navn: ${request.name}`,
    `E-mail: ${request.email}`,
    `Telefon: ${request.phone || '-'}`,
    `Dato: ${request.date}`,
    `Tid: ${request.time}`,
    `Besked: ${request.notes || '-'}`,
  ].join('\n');

  await transporter.sendMail({
    from: `"Barber Booking" <${SMTP_USER}>`,
    to: MAIL_TO,
    subject: `Ny tidsanmodning: ${request.date} kl. ${request.time}`,
    text,
  });

  return {
    sent: true,
  };
};

const sendRequestDecisionEmailToClient = async (request, status) => {
  if (!transporter || !emailEnabled) {
    return {
      sent: false,
      reason: 'email_not_configured',
    };
  }

  const approved = status === 'approved';
  const statusText = approved ? 'godkendt' : 'afvist';

  const text = [
    'Svar på din tidsanmodning til Tully Barber',
    '',
    `Hej ${request.name},`,
    `Din tidsanmodning for ${request.date} kl. ${request.time} er ${statusText}.`,
    '',
    approved ? 'Jeg glæder mig til at se dig.' : 'Du er velkommen til at sende en ny anmodning.',
    '',
    'Venlig hilsen',
    'Barber Booking',
  ].join('\n');

  await transporter.sendMail({
    from: `"Tully's Barber" <${SMTP_USER}>`,
    to: request.email,
    subject: `Din tidsanmodning er ${statusText} (${request.date} kl. ${request.time})`,
    text,
  });

  return {
    sent: true,
  };
};

export const requestHandler = async (req, res) => {
  pruneInMemoryAuthState();

  if (!req.url) {
    sendJson(res, 400, { error: 'Missing URL.' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const method = req.method || 'GET';
  const pathname = url.pathname;
  const path = pathname.startsWith('/api') ? pathname : `/api${pathname}`;

  try {
    if (method === 'GET' && path === '/api/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === 'GET' && path === '/api/slots') {
      const slots = await getPublicSlots();
      sendJson(res, 200, { slots });
      return;
    }

    if (method === 'POST' && path === '/api/requests') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const date = String(body.date || '').trim();
      const time = String(body.time || '').trim();
      const slotId = body.slotId ? String(body.slotId).trim() : undefined;
      const phone = sanitizeText(body.phone, 32);
      const notes = sanitizeText(body.notes, 1000);

      if (!name || !email || !date || !time) {
        sendJson(res, 400, { error: 'name, email, date and time are required.' });
        return;
      }

      if (name.length > 100 || email.length > 254 || !EMAIL_RE.test(email) || !isValidDateTime(date, time)) {
        sendJson(res, 400, { error: 'Invalid request data.' });
        return;
      }

      if (slotId) {
        const slot = await getSlotById(slotId);
        if (!slot) {
          sendJson(res, 404, { error: 'Selected slot was not found.' });
          return;
        }
        if (slot.bookedBy) {
          sendJson(res, 409, { error: 'Selected slot is already booked.' });
          return;
        }
      }

      const request = await createTimeRequest({
        name,
        email,
        phone,
        notes,
        date,
        time,
        slotId,
      });

      await addNotification(createNotification(request.name, request.date, request.time, 'request'));

      let emailStatus = {
        sent: false,
        reason: 'email_not_configured',
      };

      try {
        emailStatus = await sendRequestEmailToOwner(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Email send failed.';
        console.error(`[Email fejl] Kunne ikke sende anmodningsmail: ${message}`);
        await addNotification('[Email fejl] Kunne ikke sende anmodningsmail.');
        emailStatus = {
          sent: false,
          reason: 'email_send_failed',
        };
      }

      sendJson(res, 201, { request, emailStatus });
      return;
    }

    if (method === 'POST' && path === '/api/auth/admin/login') {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const rateKey = getRateKey(req, email);
      const currentRate = getLoginAttemptState(rateKey);
      if (currentRate?.lockedUntil && currentRate.lockedUntil > Date.now()) {
        sendJson(res, 429, { error: 'Too many login attempts. Try again later.' });
        return;
      }
      let isValidPassword = false;
      try {
        isValidPassword = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
      } catch {
        isValidPassword = false;
      }

      if (email !== normalizeEmail(ADMIN_USER.email) || !isValidPassword) {
        registerLoginFailure(rateKey);
        sendJson(res, 401, { error: 'Invalid admin credentials.' });
        return;
      }

      clearLoginFailures(rateKey);

      const token = randomUUID();
      sessions.set(token, {
        userId: ADMIN_USER.id,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });

      sendJson(
        res,
        200,
        {
          user: {
            id: ADMIN_USER.id,
            name: ADMIN_USER.name,
            email: ADMIN_USER.email,
            role: ADMIN_USER.role,
          },
        },
        { 'Set-Cookie': createSessionCookie(token) },
      );
      return;
    }

    if (method === 'POST' && path === '/api/auth/admin/logout') {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[SESSION_COOKIE_NAME];
      if (token) {
        sessions.delete(token);
      }

      sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
      return;
    }

    if (method === 'GET' && path === '/api/auth/admin/session') {
      const admin = getAdminFromSession(req);
      if (!admin) {
        sendJson(res, 401, { error: 'No active admin session.' });
        return;
      }

      sendJson(res, 200, {
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
      return;
    }

    if (method === 'GET' && path === '/api/admin/slots') {
      if (!requireAdmin(req, res)) {
        return;
      }

      const slots = await getAdminSlots();
      sendJson(res, 200, { slots });
      return;
    }

    if (method === 'POST' && path === '/api/admin/slots') {
      if (!requireAdmin(req, res)) {
        return;
      }

      const body = await readBody(req);
      const date = String(body.date || '').trim();
      const time = String(body.time || '').trim();

      if (!date || !time) {
        sendJson(res, 400, { error: 'date and time are required.' });
        return;
      }

      if (!isValidDateTime(date, time)) {
        sendJson(res, 400, { error: 'Invalid date or time format.' });
        return;
      }

      try {
        const slot = await createAdminSlot(date, time);
        sendJson(res, 201, { slot });
      } catch (error) {
        const duplicateKey = error && typeof error === 'object' && 'code' in error && error.code === 11000;
        if (duplicateKey) {
          sendJson(res, 409, { error: 'Slot already exists.' });
          return;
        }
        throw error;
      }
      return;
    }

    if (method === 'DELETE' && path.startsWith('/api/admin/slots/')) {
      if (!requireAdmin(req, res)) {
        return;
      }

      const slotId = path.replace('/api/admin/slots/', '');
      const deleteResult = await deleteAdminSlot(slotId);

      if (!deleteResult.ok) {
        if (deleteResult.reason === 'not_found') {
          sendJson(res, 404, { error: 'Slot not found.' });
          return;
        }
        if (deleteResult.reason === 'booked') {
          sendJson(res, 409, { error: 'Booked slots cannot be removed.' });
          return;
        }
      }

      await addNotification(`Ledig tid fjernet: ${deleteResult.slot.date} kl. ${deleteResult.slot.time}.`);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === 'GET' && path === '/api/admin/requests') {
      if (!requireAdmin(req, res)) {
        return;
      }

      const requests = await getTimeRequests();
      sendJson(res, 200, { requests });
      return;
    }

    if (method === 'PATCH' && path.startsWith('/api/admin/requests/')) {
      if (!requireAdmin(req, res)) {
        return;
      }

      const requestId = path.replace('/api/admin/requests/', '');
      const body = await readBody(req);
      const status = body.status;

      if (status !== 'approved' && status !== 'declined') {
        sendJson(res, 400, { error: "status must be 'approved' or 'declined'." });
        return;
      }

      const request = await updateTimeRequestStatus(requestId, status);
      if (!request) {
        sendJson(res, 404, { error: 'Request not found.' });
        return;
      }

      if (status === 'approved') {
        const booked = await bookSlotForRequest(request);
        if (booked) {
          await addNotification(createNotification(request.name, request.date, request.time, 'booking'));
        }
      }

      let emailStatus = {
        sent: false,
        reason: 'email_not_configured',
      };

      try {
        emailStatus = await sendRequestDecisionEmailToClient(request, status);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Email send failed.';
        console.error(`[Email fejl] Kunne ikke sende statusmail til kunde (${request.email}): ${message}`);
        await addNotification(`[Email fejl] Kunne ikke sende statusmail til kunde (${request.email}).`);
        emailStatus = {
          sent: false,
          reason: 'email_send_failed',
        };
      }

      sendJson(res, 200, { request, emailStatus });
      return;
    }

    if (method === 'GET' && path === '/api/admin/notifications') {
      if (!requireAdmin(req, res)) {
        return;
      }

      const notifications = await getNotifications();
      sendJson(res, 200, { notifications });
      return;
    }

    sendJson(res, 404, { error: 'Not found.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    console.error(`[API fejl] ${method} ${path}: ${message}`);
    if (message.toLowerCase().includes('tlsv1 alert')) {
      console.error('[API hint] MongoDB TLS fejl: tjek Atlas Network Access, DB user credentials og MONGODB_URI i Vercel env vars.');
    }
    if (message === 'Payload too large') {
      sendJson(res, 413, { error: message });
      return;
    }
    if (message === 'Invalid JSON body') {
      sendJson(res, 400, { error: message });
      return;
    }
    sendJson(res, 500, { error: 'Internal server error.' });
  }
};

export const runtimeInfo = {
  adminUser: ADMIN_USER,
  emailEnabled,
  mailTo: MAIL_TO,
  smtpHost: SMTP_HOST,
  smtpPort: SMTP_PORT,
  storageMode: storageInfo.mode,
  storageDatabase: storageInfo.database,
};
