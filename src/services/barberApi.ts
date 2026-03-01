import { apiRequest } from '../lib/api';
import type { AdminUser, RequestDraft, TimeRequest, TimeSlot } from '../types';

export const getPublicSlots = async () => {
  const data = await apiRequest<{ slots: TimeSlot[] }>('/api/slots');
  return data.slots;
};

export const createClientRequest = async (payload: RequestDraft) => {
  const data = await apiRequest<{ request: TimeRequest; emailStatus?: { sent?: boolean; reason?: string; message?: string } }>(
    '/api/requests',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false,
  );
  return data;
};

export const getAdminSession = async () => {
  const data = await apiRequest<{ user: AdminUser }>('/api/auth/admin/session', {}, true);
  return data.user;
};

export const loginAdmin = async (email: string, password: string) => {
  const data = await apiRequest<{ user: AdminUser }>(
    '/api/auth/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    true,
  );
  return data.user;
};

export const logoutAdmin = async () => {
  await apiRequest('/api/auth/admin/logout', { method: 'POST' }, true);
};

export const getAdminSlots = async () => {
  const data = await apiRequest<{ slots: TimeSlot[] }>('/api/admin/slots', {}, true);
  return data.slots;
};

export const createAdminSlot = async (date: string, time: string) => {
  const data = await apiRequest<{ slot: TimeSlot }>(
    '/api/admin/slots',
    {
      method: 'POST',
      body: JSON.stringify({ date, time }),
    },
    true,
  );
  return data.slot;
};

export const deleteAdminSlot = async (slotId: string) => {
  await apiRequest(
    `/api/admin/slots/${slotId}`,
    {
      method: 'DELETE',
    },
    true,
  );
};

export const getAdminRequests = async () => {
  const data = await apiRequest<{ requests: TimeRequest[] }>('/api/admin/requests', {}, true);
  return data.requests;
};

export const updateAdminRequestStatus = async (requestId: string, status: 'approved' | 'declined') => {
  const data = await apiRequest<{ request: TimeRequest }>(
    `/api/admin/requests/${requestId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    true,
  );
  return data.request;
};

export const getAdminNotifications = async () => {
  const data = await apiRequest<{ notifications: string[] }>('/api/admin/notifications', {}, true);
  return data.notifications;
};
