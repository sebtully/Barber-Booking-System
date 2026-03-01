export type AppointmentStatus = 'requested' | 'approved' | 'declined';

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  isBooked?: boolean;
  bookedBy?: string;
  customerEmail?: string;
}

export interface TimeRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  slotId?: string;
}

export interface RequestDraft {
  name: string;
  email: string;
  phone: string;
  notes: string;
  date: string;
  time: string;
  slotId?: string;
}

export interface CalendarCell {
  date: string | null;
  dayNumber: number | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}
