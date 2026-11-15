export type FieldErrors = Record<string, string[]>;

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: FieldErrors;
};

export const initialFormState: FormState = { status: 'idle' };

export function fieldError(state: FormState, key: string) {
  return state.fieldErrors?.[key]?.[0];
}
