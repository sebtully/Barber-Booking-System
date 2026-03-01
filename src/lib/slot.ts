import type { TimeSlot } from '../types';

export const isSlotBooked = (slot: TimeSlot) => slot.isBooked ?? Boolean(slot.bookedBy);
