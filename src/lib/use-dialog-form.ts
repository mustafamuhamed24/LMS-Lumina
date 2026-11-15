'use client';

import { useActionState } from 'react';
import { initialFormState, type FormState } from '@/lib/form-state';

type FormAction = (previous: FormState, formData: FormData) => Promise<FormState>;

/**
 * Wraps a server action and closes its dialog when the action succeeds.
 * Closing from the action callback (instead of an effect) avoids cascading
 * renders and keeps the dialog lifecycle tied to the user event.
 */
export function useDialogFormAction(action: FormAction, setOpen: (open: boolean) => void) {
  return useActionState<FormState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.status === 'success') setOpen(false);
    return result;
  }, initialFormState);
}
