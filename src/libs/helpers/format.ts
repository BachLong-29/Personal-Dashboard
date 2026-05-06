import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const formatDate = (date: string | Date, format = 'DD/MM/YYYY') =>
  dayjs(date).format(format);

export const formatDateTime = (date: string | Date) => dayjs(date).format('DD/MM/YYYY HH:mm');

export const fromNow = (date: string | Date) => dayjs(date).fromNow();

export const formatCurrency = (amount: number, currency = 'VND', locale = 'vi-VN') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
