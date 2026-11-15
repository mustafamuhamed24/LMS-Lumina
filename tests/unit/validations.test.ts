import { describe, expect, it } from 'vitest';
import {
  adminUserCreateSchema,
  courseQuerySchema,
  lessonSchema,
  organizationSchema,
  questionPayloadSchema,
  quizSubmitSchema,
  signUpSchema,
  submissionSchema,
} from '@/lib/validations';

const uuid = '11111111-1111-4111-8111-111111111111';

describe('signUpSchema', () => {
  it('accepts a valid signup and normalizes the email', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Ada Lovelace',
      email: '  ADA@Example.COM ',
      password: 'secret123',
      acceptTerms: 'on',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('ada@example.com');
      expect(result.data.acceptTerms).toBe(true);
    }
  });

  it('rejects weak passwords and missing terms', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Ada',
      email: 'ada@example.com',
      password: 'password',
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toContain('password');
      expect(fields).toContain('acceptTerms');
    }
  });
});

describe('courseQuerySchema', () => {
  it('applies defaults and coerces pagination', () => {
    const result = courseQuerySchema.parse({ page: '3', pageSize: '12' });
    expect(result).toMatchObject({ page: 3, pageSize: 12, sort: 'newest' });
  });

  it('falls back to safe pagination values', () => {
    const result = courseQuerySchema.parse({ page: '0', pageSize: '999' });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(9);
  });
});

describe('lessonSchema', () => {
  const base = {
    courseId: uuid,
    sectionId: uuid,
    title: 'A valid lesson title',
    estimatedMinutes: '15',
  };

  it('requires content for reading lessons', () => {
    const result = lessonSchema.safeParse({ ...base, type: 'text', content: '' });
    expect(result.success).toBe(false);
  });

  it('requires a URL for video lessons', () => {
    const result = lessonSchema.safeParse({ ...base, type: 'video', videoUrl: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid video lesson and coerces minutes', () => {
    const result = lessonSchema.safeParse({ ...base, type: 'video', videoUrl: 'https://example.com/v' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.estimatedMinutes).toBe(15);
  });
});

describe('questionPayloadSchema', () => {
  it('requires exactly one correct option for single choice', () => {
    const result = questionPayloadSchema.safeParse({
      prompt: 'Which one?',
      type: 'single',
      points: '2',
      options: [
        { label: 'A', isCorrect: true },
        { label: 'B', isCorrect: true },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('requires accepted answers for short answer questions', () => {
    const result = questionPayloadSchema.safeParse({
      prompt: 'Explain this',
      type: 'short_answer',
      points: 1,
      acceptedAnswers: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('submissionSchema', () => {
  it('allows a file-only submission', () => {
    expect(submissionSchema.safeParse({ assignmentId: uuid, contentText: '' }).success).toBe(true);
  });
});

describe('quizSubmitSchema', () => {
  it('requires at least one answer', () => {
    expect(quizSubmitSchema.safeParse({ attemptId: uuid, answers: [] }).success).toBe(false);
    expect(
      quizSubmitSchema.safeParse({
        attemptId: uuid,
        answers: [{ questionId: uuid, optionIds: [uuid], text: null }],
      }).success,
    ).toBe(true);
  });
});

describe('admin schemas', () => {
  it('only allows known roles', () => {
    const result = adminUserCreateSchema.safeParse({
      fullName: 'New User',
      email: 'new@example.com',
      password: 'secret123',
      role: 'owner',
      orgId: uuid,
    });
    expect(result.success).toBe(false);
  });

  it('validates organization colours', () => {
    expect(
      organizationSchema.safeParse({
        name: 'Lumina',
        slug: 'lumina',
        primaryColor: '#4f46e5',
        isActive: 'on',
      }).success,
    ).toBe(true);
    expect(
      organizationSchema.safeParse({
        name: 'Lumina',
        slug: 'Lumina School',
        primaryColor: 'blue',
        isActive: 'on',
      }).success,
    ).toBe(false);
  });
});
