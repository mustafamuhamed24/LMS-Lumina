import type { FormState } from '@/lib/form-state';

export type QuizSubmitState = FormState & {
  result?: {
    score: number;
    passed: boolean;
    correct: number;
    total: number;
    attemptsUsed: number;
    maxAttempts: number;
  };
};

export const initialQuizState: QuizSubmitState = { status: 'idle' };
