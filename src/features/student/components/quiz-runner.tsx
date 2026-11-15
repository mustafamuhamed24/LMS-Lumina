'use client';

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, Send, XCircle } from 'lucide-react';
import { submitQuizAttemptAction } from '@/features/student/actions';
import { initialQuizState, type QuizSubmitState } from '@/features/student/quiz-state';
import type { LearnQuizPayload } from '@/features/student/queries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type AnswerValue = { optionIds: string[]; text: string };

function timeRemaining(expiresAt: string | null) {
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function QuizRunner({ attempt }: { attempt: LearnQuizPayload }) {
  const [state, action, pending] = useActionState<QuizSubmitState, FormData>(submitQuizAttemptAction, initialQuizState);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [remaining, setRemaining] = useState<number | null>(() => timeRemaining(attempt.expires_at));

  useEffect(() => {
    if (!attempt.expires_at) return;
    const timer = window.setInterval(() => setRemaining(timeRemaining(attempt.expires_at)), 1000);
    return () => window.clearInterval(timer);
  }, [attempt.expires_at]);

  const answeredCount = useMemo(
    () =>
      attempt.questions.filter((question) => {
        const value = answers[question.id];
        return Boolean(value && (value.optionIds.length > 0 || value.text.trim().length > 0));
      }).length,
    [answers, attempt.questions],
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        attempt.questions.map((question) => ({
          questionId: question.id,
          optionIds: answers[question.id]?.optionIds ?? [],
          text: answers[question.id]?.text ?? '',
        })),
      ),
    [answers, attempt.questions],
  );

  const submitted = attempt.status !== 'in_progress';
  const passed = state.result?.passed ?? attempt.passed;
  const score = state.result?.score ?? attempt.score;

  if (submitted && !state.result) {
    return (
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-3">
          {passed ? <CheckCircle2 className="size-6 text-emerald-600" /> : <XCircle className="size-6 text-destructive" />}
          <div>
            <p className="font-semibold">Attempt {attempt.attempt_number} submitted</p>
            <p className="text-sm text-muted-foreground">
              Score: {score ?? 0}% · {passed ? 'Passed' : 'Not passed'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.result) {
    return (
      <div className="rounded-xl border p-5">
        <div className="flex flex-col items-center text-center">
          {state.result.passed ? (
            <CheckCircle2 className="size-10 text-emerald-600" />
          ) : (
            <XCircle className="size-10 text-destructive" />
          )}
          <p className="mt-3 text-lg font-semibold">{state.result.passed ? 'Quiz passed' : 'Keep practising'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.result.correct} of {state.result.total} questions correct</p>
          <p className="mt-4 text-3xl font-semibold">{state.result.score}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Attempt {state.result.attemptsUsed} of {state.result.maxAttempts}
          </p>
          <div className="mt-4 w-full max-w-sm">
            <Progress value={state.result.score} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="attemptId" value={attempt.id} />
      <input type="hidden" name="answers" value={payload} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span>
          Attempt {attempt.attempt_number} · {attempt.questions.length} questions · {answeredCount} answered
        </span>
        {remaining !== null ? (
          <span className={cn('inline-flex items-center gap-1 font-medium', remaining < 60 ? 'text-destructive' : 'text-foreground')}>
            <Clock className="size-3.5" /> {formatSeconds(remaining)}
          </span>
        ) : (
          <span>No time limit</span>
        )}
      </div>

      {state.message ? (
        <Alert variant={state.status === 'success' ? 'success' : 'destructive'}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {attempt.questions.length ? (
        attempt.questions.map((question, index) => {
          const value = answers[question.id] ?? { optionIds: [], text: '' };
          return (
            <div key={question.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                  {question.prompt}
                </p>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {question.points} {question.points === 1 ? 'pt' : 'pts'}
                </Badge>
              </div>

              {question.type === 'short_answer' ? (
                <Textarea
                  className="mt-3"
                  rows={3}
                  value={value.text}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { optionIds: [], text: event.target.value } }))}
                  placeholder="Type your answer…"
                />
              ) : (
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const checked = value.optionIds.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50',
                          checked && 'border-primary/50 bg-primary/[0.04]',
                        )}
                      >
                        <input
                          type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                          name={`question-${question.id}`}
                          checked={checked}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: {
                                optionIds:
                                  question.type === 'multiple'
                                    ? checked
                                      ? value.optionIds.filter((id) => id !== option.id)
                                      : [...value.optionIds, option.id]
                                    : [option.id],
                                text: '',
                              },
                            }))
                          }
                          className="size-4 rounded border-input"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <Alert>
          <AlertCircle />
          <AlertTitle>No questions yet</AlertTitle>
          <AlertDescription>This quiz has not been configured. Contact your instructor.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Passing score: {attempt.passing_score}% · Answers are graded on the server.
        </p>
        <Button type="submit" disabled={pending || !attempt.questions.length || remaining === 0}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          {pending ? 'Submitting…' : 'Submit quiz'}
        </Button>
      </div>
    </form>
  );
}
