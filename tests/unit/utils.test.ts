import { describe, expect, it } from 'vitest';
import {
  clamp,
  formatDate,
  formatDuration,
  formatNumber,
  formatRelative,
  initials,
  initialsColor,
  isOverdue,
  percent,
  pluralize,
  slugify,
  truncate,
} from '@/lib/utils';

describe('slugify', () => {
  it('normalizes accents, punctuation and whitespace', () => {
    expect(slugify('  Crème Brûlée & Systems!  ')).toBe('creme-brulee-systems');
  });

  it('strips leading and trailing separators and caps length', () => {
    expect(slugify('---Hello World---')).toBe('hello-world');
    expect(slugify('a'.repeat(120))).toHaveLength(80);
  });
});

describe('initials', () => {
  it('takes the first two name parts', () => {
    expect(initials('Amara Okafor')).toBe('AO');
    expect(initials('  maya   lopez  ')).toBe('ML');
  });

  it('handles empty names', () => {
    expect(initials(null)).toBe('?');
    expect(initials('')).toBe('?');
  });
});

describe('format helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(95)).toBe('1h 35m');
  });

  it('formats dates and invalid values', () => {
    expect(formatDate('2026-02-03T12:00:00')).toBe('3 Feb 2026');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('formats numbers and percentages', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(null)).toBe('0');
    expect(percent(42.5)).toBe('43%');
  });

  it('formats relative dates in the past', () => {
    expect(formatRelative(new Date(Date.now() - 60_000))).toMatch(/minute.*ago/);
    expect(formatRelative(null)).toBe('—');
  });
});

describe('misc helpers', () => {
  it('truncates long strings with an ellipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abcd…');
    expect(truncate('abc', 4)).toBe('abc');
  });

  it('pluralizes correctly', () => {
    expect(pluralize(1, 'course')).toBe('course');
    expect(pluralize(2, 'course')).toBe('courses');
    expect(pluralize(2, 'person', 'people')).toBe('people');
  });

  it('clamps values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('detects overdue dates', () => {
    expect(isOverdue('2000-01-01T00:00:00')).toBe(true);
    expect(isOverdue(new Date(Date.now() + 86_400_000).toISOString())).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });

  it('picks a stable colour class', () => {
    expect(initialsColor('same-seed')).toBe(initialsColor('same-seed'));
    expect(initialsColor('x')).toMatch(/bg-/);
  });
});
