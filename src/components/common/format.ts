import { formatDistanceToNowStrict, format } from 'date-fns';

export const ago = (iso: string | Date) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
export const when = (iso: string | Date) => format(new Date(iso), 'd MMM, HH:mm');
export const day = (iso: string | Date) => format(new Date(iso), 'EEE d MMM');
export const pct = (r: number | null | undefined) => (r === null || r === undefined ? '—' : `${Math.round(r * 100)}%`);
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
