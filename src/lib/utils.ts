import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNowStrict, isPast, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined, pattern = 'd MMM yyyy') {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? format(date, pattern) : '—';
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, 'd MMM yyyy, HH:mm');
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return '—';
  return `${formatDistanceToNowStrict(date)} ${isPast(date) ? 'ago' : 'from now'}`.replace(' ago from now', ' ago');
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes || minutes < 1) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function truncate(value: string, length = 120) {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

export function percent(value: number | null | undefined, digits = 0) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function initialsColor(seed: string) {
  const colors = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % colors.length;
  return colors[hash] ?? colors[0]!;
}

export function isOverdue(dueAt: string | null | undefined) {
  return Boolean(dueAt && isPast(new Date(dueAt)));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
