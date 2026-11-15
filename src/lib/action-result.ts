import 'server-only';

import { ZodError } from 'zod';

export type FieldErrors = Record<string, string[]>;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors; code?: string };

export class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'The requested resource was not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  fieldErrors: FieldErrors;
  constructor(message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export function zodFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return errors;
}

export function firstFieldMessage(errors: FieldErrors, fallback = 'Please check the highlighted fields.') {
  for (const messages of Object.values(errors)) {
    if (messages?.[0]) return messages[0];
  }
  return fallback;
}

export function actionFailure(error: string, fieldErrors?: FieldErrors, code?: string): ActionResult<never> {
  return { ok: false, error, fieldErrors, code };
}

/**
 * Converts errors into safe user-facing messages. Database internals, stack
 * traces and service responses are logged server-side only.
 */
export function actionError(error: unknown, context: string): ActionResult<never> {
  if (error instanceof AuthorizationError) {
    return actionFailure(error.message, undefined, 'forbidden');
  }
  if (error instanceof NotFoundError) {
    return actionFailure(error.message, undefined, 'not_found');
  }
  if (error instanceof ValidationError) {
    return actionFailure(error.message, error.fieldErrors, 'validation');
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code ?? '');
    const message = String((error as { message?: string }).message ?? '');

    if (code === '23505' || code === '23505') {
      return actionFailure('That record already exists. Please use different values.', undefined, 'conflict');
    }
    if (code === '23503') {
      return actionFailure('This record is still referenced by other data and cannot be changed.', undefined, 'conflict');
    }
    if (code === '23514') {
      return actionFailure('The submitted values violate a data rule. Please review the form.', undefined, 'validation');
    }
    if (code === '42501' || /row-level security|permission denied/i.test(message)) {
      return actionFailure('You do not have permission to perform this action.', undefined, 'forbidden');
    }
    if (code === 'P0002') {
      return actionFailure('The requested record could not be found.', undefined, 'not_found');
    }
    if (code === 'PGRST116') {
      return actionFailure('The requested record could not be found.', undefined, 'not_found');
    }
  }

  if (error instanceof Error) {
    const message = error.message;
    if (/invalid login credentials/i.test(message)) {
      return actionFailure('The email or password is incorrect.', undefined, 'invalid_credentials');
    }
    if (/email not confirmed/i.test(message)) {
      return actionFailure('Please verify your email address before signing in.', undefined, 'email_unconfirmed');
    }
    if (/user already registered/i.test(message)) {
      return actionFailure('An account with that email already exists.', undefined, 'email_taken');
    }
    if (/password should be at least/i.test(message)) {
      return actionFailure('Your password does not meet the minimum requirements.', undefined, 'weak_password');
    }
    if (/rate limit|too many/i.test(message)) {
      return actionFailure('Too many attempts. Please wait a moment and try again.', undefined, 'rate_limited');
    }
    if (/fetch failed|network|ECONNREFUSED/i.test(message)) {
      return actionFailure('The service is temporarily unavailable. Please try again.', undefined, 'network');
    }
  }

  console.error(`[action:${context}]`, error);
  return actionFailure('Something went wrong. Please try again.', undefined, 'internal');
}
