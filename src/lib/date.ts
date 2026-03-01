import type { CalendarCell } from '../types';

export const weekDays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'];

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDate = () => formatDate(new Date());

export const buildCalendarCells = (monthDate: Date): CalendarCell[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingCells = (monthStart.getDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  for (let index = 0; index < leadingCells; index += 1) {
    cells.push({ date: null, dayNumber: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ date: formatDate(date), dayNumber: day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayNumber: null });
  }

  return cells;
};
