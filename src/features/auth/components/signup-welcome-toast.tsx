'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Shows a one-time confirmation after signup. Learnova confirms new accounts
 * instantly, so there is no verification step to wait for — the popup simply
 * reassures people that their workspace is ready.
 */
export function SignupWelcomeToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') !== '1') return;

    toast.success('Welcome to Learnova', {
      description: 'Your account is ready — no email verification needed.',
      duration: 6000,
    });

    params.delete('welcome');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  return null;
}
