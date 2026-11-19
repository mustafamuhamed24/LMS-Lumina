/**
 * Learnova LMS — demo data seed.
 *
 * Run with `npm run db:seed` after `npm run db:reset`. The script is idempotent:
 * demo auth users are reused, and demo courses are rebuilt from scratch on every
 * run. All writes use the service-role key, which must never reach the browser.
 */
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

loadEnvConfig(process.cwd(), true);

type Role = Database['public']['Enums']['user_role'];
type LessonType = Database['public']['Enums']['lesson_type'];
type QuestionType = Database['public']['Enums']['question_type'];
type Difficulty = Database['public']['Enums']['difficulty_level'];
type MemberRole = 'org_admin' | 'instructor' | 'student';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'Passw0rd!';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
}

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const ORG_LEARNOVA = '11111111-1111-4111-8111-111111111111';
const ORG_NORTHSTAR = '22222222-2222-4222-8222-222222222222';

function assertOk(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function daysFromNow(days: number, hour = 17) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// ── Users ────────────────────────────────────────────────────────────────────
type SeedUser = {
  key: string;
  email: string;
  fullName: string;
  role: Role;
  orgId: string;
  memberRole: MemberRole;
  headline: string;
  bio: string;
  extraOrg?: { orgId: string; memberRole: MemberRole };
};

const users: SeedUser[] = [
  {
    key: 'super',
    email: 'super@learnova.test',
    fullName: 'Sage Whitfield',
    role: 'super_admin',
    orgId: ORG_LEARNOVA,
    memberRole: 'org_admin',
    headline: 'Platform steward at Learnova',
    bio: 'Keeps Learnova secure, observable and pleasant for every organization.',
    extraOrg: { orgId: ORG_NORTHSTAR, memberRole: 'org_admin' },
  },
  {
    key: 'admin',
    email: 'admin@learnova.test',
    fullName: 'Priya Raman',
    role: 'org_admin',
    orgId: ORG_LEARNOVA,
    memberRole: 'org_admin',
    headline: 'Head of Learning, Learnova Academy',
    bio: 'Partners with instructors to turn expertise into durable learning experiences.',
  },
  {
    key: 'adminNorthstar',
    email: 'admin@northstar.test',
    fullName: 'Marcus Bell',
    role: 'org_admin',
    orgId: ORG_NORTHSTAR,
    memberRole: 'org_admin',
    headline: 'Program Director, Northstar Institute',
    bio: 'Runs applied-science programs for working researchers and communicators.',
  },
  {
    key: 'maya',
    email: 'maya@learnova.test',
    fullName: 'Maya Chen',
    role: 'instructor',
    orgId: ORG_LEARNOVA,
    memberRole: 'instructor',
    headline: 'Design systems lead & instructor',
    bio: 'Builds calm, accessible interfaces and teaches teams how to do the same.',
  },
  {
    key: 'leo',
    email: 'leo@learnova.test',
    fullName: 'Leo Martins',
    role: 'instructor',
    orgId: ORG_LEARNOVA,
    memberRole: 'instructor',
    headline: 'Staff engineer & educator',
    bio: 'Loves React internals, TypeScript edge cases and pragmatic architecture.',
  },
  {
    key: 'nina',
    email: 'nina@northstar.test',
    fullName: 'Nina Patel',
    role: 'instructor',
    orgId: ORG_NORTHSTAR,
    memberRole: 'instructor',
    headline: 'Research methodologist',
    bio: 'Helps teams design credible studies and communicate evidence with clarity.',
  },
  {
    key: 'student',
    email: 'student@learnova.test',
    fullName: 'Amara Okafor',
    role: 'student',
    orgId: ORG_LEARNOVA,
    memberRole: 'student',
    headline: 'Product designer',
    bio: 'Learning design systems and React architecture to level up my craft.',
  },
  {
    key: 'diego',
    email: 'diego@learnova.test',
    fullName: 'Diego Alvarez',
    role: 'student',
    orgId: ORG_LEARNOVA,
    memberRole: 'student',
    headline: 'Frontend engineer',
    bio: 'Building a stronger foundation in component architecture.',
  },
  {
    key: 'sofia',
    email: 'sofia@learnova.test',
    fullName: 'Sofia Rossi',
    role: 'student',
    orgId: ORG_LEARNOVA,
    memberRole: 'student',
    headline: 'Engineering manager',
    bio: 'Exploring how healthy teams ship better software.',
  },
  {
    key: 'northstarStudent',
    email: 'student@northstar.test',
    fullName: 'Noah Kim',
    role: 'student',
    orgId: ORG_NORTHSTAR,
    memberRole: 'student',
    headline: 'Research associate',
    bio: 'Turning policy questions into well-designed studies.',
  },
];

// ── Courses ──────────────────────────────────────────────────────────────────
type QuestionSeed = {
  prompt: string;
  type: QuestionType;
  points: number;
  explanation?: string;
  acceptedAnswers?: string[];
  options?: { label: string; correct?: boolean }[];
};

type QuizSeed = {
  title: string;
  instructions: string;
  timeLimitMinutes: number | null;
  passingScore: number;
  maxAttempts: number;
  questions: QuestionSeed[];
};

type AssignmentSeed = {
  title: string;
  instructions: string;
  dueInDays: number;
  maxPoints: number;
  gradingCriteria: string;
};

type ResourceSeed = { title: string; externalUrl: string };

type LessonSeed = {
  title: string;
  type: LessonType;
  minutes: number;
  preview?: boolean;
  content?: string;
  videoUrl?: string;
  quiz?: QuizSeed;
  assignment?: AssignmentSeed;
  resources?: ResourceSeed[];
};

type SectionSeed = { title: string; lessons: LessonSeed[] };

type CourseSeed = {
  slug: string;
  orgId: string;
  instructorKey: string;
  categorySlug: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  status: 'draft' | 'published' | 'archived';
  featured?: boolean;
  requiresApproval?: boolean;
  thumbnailUrl: string;
  objectives: string[];
  requirements: string[];
  sections: SectionSeed[];
};

const courses: CourseSeed[] = [
  {
    slug: 'design-systems-foundations',
    orgId: ORG_LEARNOVA,
    instructorKey: 'maya',
    categorySlug: 'design',
    title: 'Design Systems Foundations',
    subtitle: 'Build a shared visual language your product teams can actually adopt',
    description:
      'A practical introduction to design systems: tokens, component APIs, documentation, versioning and the organizational work of driving adoption. You will leave with a repeatable audit, a component inventory and a rollout plan for your own team.',
    difficulty: 'beginner',
    durationMinutes: 240,
    status: 'published',
    featured: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    objectives: [
      'Explain how tokens, primitives and components fit together',
      'Audit an existing interface for inconsistency',
      'Document component usage, states and accessibility notes',
      'Plan a phased design-system rollout',
    ],
    requirements: ['Comfort using a modern design tool', 'No coding experience required'],
    sections: [
      {
        title: 'Foundations',
        lessons: [
          {
            title: 'Why design systems matter',
            type: 'text',
            minutes: 12,
            preview: true,
            content: `Design systems are not a component library. They are a shared agreement about how a product looks, behaves and evolves.

A healthy system reduces decision fatigue. Designers stop re-inventing spacing scales, engineers stop rebuilding the same dropdown, and researchers get consistent patterns to test.

Three layers matter:

1. Tokens — named decisions such as color.text.muted or space.4.
2. Primitives — small building blocks like Button, Input and Stack.
3. Patterns — composed experiences such as a checkout form or a course card.

The system succeeds when those layers are documented, versioned and easy to adopt.`,
          },
          {
            title: 'Tokens, primitives and components',
            type: 'text',
            minutes: 18,
            content: `Tokens encode intent, not raw values. Prefer text.muted over gray-500 because intent survives a rebrand.

A useful token taxonomy:

• Color: background, surface, text, border, accent, status
• Space: a 4px or 8px scale with semantic aliases
• Type: family, size, weight, line-height
• Radius, shadow and motion

Primitives wrap tokens behind a stable API. A Button should accept a variant, size and disabled state without exposing every CSS detail.

Components compose primitives into product-level meaning: CourseCard, LessonRow, CertificateBadge.

Rule of thumb: if two teams need the same decision, make it a token. If three teams need the same behavior, make it a component.`,
          },
          {
            title: 'Auditing your current UI',
            type: 'video',
            minutes: 15,
            videoUrl: 'https://www.youtube.com/watch?v=jnFQJ6fJPbw',
            content:
              'Watch the walkthrough of a quick interface audit, then try the same inventory on a screen you own.',
          },
        ],
      },
      {
        title: 'Building the System',
        lessons: [
          {
            title: 'Naming conventions that scale',
            type: 'text',
            minutes: 16,
            content: `Names are the API of your design system. Optimize for predictability.

Use a consistent pattern: category.role.variant.state. For example, color.text.primary, color.surface.raised, border.focus.default.

Avoid names tied to appearance: color.blue is fragile; color.accent is durable. Avoid names tied to a single product area: checkoutGreen will not survive reuse.

For components, name the job: Dialog, not ModalPopup. For props, prefer intent: tone="critical" rather than red={true}.

Document deprecated names and provide migration notes. Renaming without a path is how systems lose trust.`,
          },
          {
            title: 'Documenting components',
            type: 'text',
            minutes: 14,
            content: `Great component documentation answers five questions quickly:

1. When should I use this component?
2. When should I use something else?
3. What states and variants exist?
4. What accessibility behavior is built in?
5. How do I migrate from the previous pattern?

Include a live example, a code snippet and a short do/don't list. Document keyboard behavior and screen-reader expectations, not only visual states.

Keep docs next to the source of truth. A stale wiki is worse than no wiki because it silently teaches the wrong thing.`,
          },
          {
            title: 'Versioning and release notes',
            type: 'video',
            minutes: 12,
            videoUrl: 'https://www.youtube.com/watch?v=oyLBGkS5ICk',
            content:
              'A short walkthrough of semantic versioning for design systems and how to write release notes that product teams read.',
          },
        ],
      },
      {
        title: 'Adoption & Governance',
        lessons: [
          {
            title: 'Rollout plan for product teams',
            type: 'text',
            minutes: 20,
            content: `Adoption is a product problem, not a mandate problem.

Start with a high-leverage surface: a frequently used flow with an engaged team. Measure the before state, ship a visible win and publish the story.

A phased plan:

• Phase 1 — Inventory and agree on tokens with two pilot teams.
• Phase 2 — Ship five primitives with documentation and migration notes.
• Phase 3 — Convert one full flow, then measure defects and delivery time.
• Phase 4 — Open contribution rules and office hours.

Governance should be lightweight: a weekly review, a clear owner per component and a documented path for exceptions.`,
          },
          {
            title: 'Design systems checkpoint',
            type: 'quiz',
            minutes: 15,
            quiz: {
              title: 'Design systems checkpoint',
              instructions:
                'Answer every question. You need 70% to pass and may retry up to three times.',
              timeLimitMinutes: 15,
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  prompt: 'Which layer should store the decision "muted body text"?',
                  type: 'single',
                  points: 2,
                  explanation: 'Tokens encode reusable decisions such as text.muted.',
                  options: [
                    { label: 'A design token', correct: true },
                    { label: 'A page template' },
                    { label: 'A marketing campaign' },
                    { label: 'An analytics event' },
                  ],
                },
                {
                  prompt: 'Which of these are commonly represented as design tokens?',
                  type: 'multiple',
                  points: 3,
                  explanation: 'Color, spacing and typography are core token groups.',
                  options: [
                    { label: 'Color', correct: true },
                    { label: 'Spacing', correct: true },
                    { label: 'Candidate name' },
                    { label: 'Typography', correct: true },
                  ],
                },
                {
                  prompt: 'Component documentation should explain when not to use the component.',
                  type: 'true_false',
                  points: 2,
                  explanation: 'Boundaries prevent misuse and drift.',
                  options: [
                    { label: 'True', correct: true },
                    { label: 'False' },
                  ],
                },
                {
                  prompt: 'Which versioning scheme is recommended for a shared design system?',
                  type: 'short_answer',
                  points: 2,
                  acceptedAnswers: ['semver', 'semantic versioning'],
                  explanation: 'Semantic versioning communicates breaking changes clearly.',
                },
                {
                  prompt: 'Who is responsible for design-system adoption?',
                  type: 'single',
                  points: 1,
                  options: [
                    { label: 'The system team and product teams together', correct: true },
                    { label: 'Only the design team' },
                    { label: 'Only the engineering team' },
                    { label: 'Nobody — adoption happens automatically' },
                  ],
                },
              ],
            },
          },
          {
            title: 'Capstone: audit a design system',
            type: 'assignment',
            minutes: 45,
            assignment: {
              title: 'Capstone: audit a design system',
              instructions:
                'Choose a product surface you can access. Produce a one-page audit that lists: (1) the five most repeated visual decisions, (2) three inconsistencies with user impact, and (3) a prioritized first sprint for a design system team. Attach screenshots or a link if helpful.',
              dueInDays: 10,
              maxPoints: 100,
              gradingCriteria:
                'Clarity of evidence (30), quality of prioritization (30), understanding of system layers (20), writing quality (20).',
            },
            resources: [
              {
                title: 'Design Tokens Community Group specification',
                externalUrl: 'https://www.w3.org/community/design-tokens/',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'modern-react-architecture',
    orgId: ORG_LEARNOVA,
    instructorKey: 'leo',
    categorySlug: 'engineering',
    title: 'Modern React Architecture',
    subtitle: 'Design server-first React applications that stay fast as they grow',
    description:
      'Move beyond component trivia. This course covers the server/client boundary, streaming, data mutations, caching and testing in modern React. You will refactor a legacy component into a server-first design with clear ownership and fewer client-side surprises.',
    difficulty: 'intermediate',
    durationMinutes: 320,
    status: 'published',
    featured: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
    objectives: [
      'Choose the right server/client boundary for each feature',
      'Stream slow data without blocking the shell',
      'Model mutations with server actions and validation',
      'Refactor a legacy component into a testable architecture',
    ],
    requirements: ['Working knowledge of React and TypeScript', 'Familiarity with HTTP fundamentals'],
    sections: [
      {
        title: 'Rendering Model',
        lessons: [
          {
            title: 'Server components vs client components',
            type: 'text',
            minutes: 18,
            preview: true,
            content: `The default should be a server component. Render data, compose layout and keep secrets on the server.

Reach for a client component only when you need:

• State that changes after render
• Event handlers
• Browser-only APIs
• Third-party libraries that assume a DOM

A useful pattern is a server component that fetches data and passes a small serializable view model to a focused client island.

Boundary smell: a client component that fetches everything itself. That usually means the page is paying for JavaScript it does not need.`,
          },
          {
            title: 'Streaming and suspense',
            type: 'video',
            minutes: 16,
            videoUrl: 'https://www.youtube.com/watch?v=TQQPAU21ZUw',
            content:
              'See how Suspense boundaries shape perceived performance and how to avoid blocking the page shell.',
          },
          {
            title: 'Composition patterns',
            type: 'text',
            minutes: 20,
            content: `Composition beats configuration. Instead of adding a new boolean prop for every layout variation, accept slots.

Prefer:

<Card>
  <Card.Header>…</Card.Header>
  <Card.Body>…</Card.Body>
</Card>

over a component with twelve mutually exclusive props.

For server-first apps, keep providers at the edges. A theme provider or query client only needs to wrap interactive regions, not the entire document.

Finally, co-locate feature code. A feature folder with queries, actions and components is easier to reason about than a global components directory.`,
          },
        ],
      },
      {
        title: 'Data & State',
        lessons: [
          {
            title: 'Mutations with server actions',
            type: 'text',
            minutes: 22,
            content: `A server action is a remote function with a familiar call site. Treat it like a public endpoint:

1. Authenticate the caller.
2. Authorize the specific resource.
3. Validate the payload with a schema.
4. Perform the write.
5. Return a typed result.

Never trust hidden fields for identity. Derive the user from the session and the resource from an authorized query.

For optimistic UI, keep the server authoritative. Optimistic updates are a hint, not a source of truth.`,
          },
          {
            title: 'The caching mental model',
            type: 'text',
            minutes: 18,
            content: `Caching is a product decision expressed in code. Ask two questions: how fresh must this be, and who is allowed to see it?

Separate caches by lifetime:

• Request memoization — deduplicate within one render.
• Data cache — reuse across requests with explicit tags.
• Router cache — client navigation reuse.
• Browser/CDN cache — public, cacheable responses.

Invalidate by tag after a mutation. When in doubt, prefer correctness and measure before adding aggressive caching.`,
          },
          {
            title: 'Forms, validation and errors',
            type: 'video',
            minutes: 17,
            videoUrl: 'https://www.youtube.com/watch?v=G8Z5J8b8c9A',
            content:
              'A practical walkthrough of progressive-enhancement forms with shared schema validation and accessible error states.',
          },
        ],
      },
      {
        title: 'Production Readiness',
        lessons: [
          {
            title: 'Testing strategy that pays off',
            type: 'text',
            minutes: 20,
            content: `Test behavior at the boundaries users care about.

• Unit tests for pure transformations and validation schemas.
• Component tests for critical interactive states.
• End-to-end smoke tests for sign-in, enrollment and the primary learning loop.
• Authorization tests for tenant isolation and protected fields.

Avoid a pyramid built on snapshots. A small number of confident tests catches more regressions than a large number of brittle ones.

Make failures legible: assert on user-visible outcomes and error messages.`,
          },
          {
            title: 'Architecture checkpoint',
            type: 'quiz',
            minutes: 15,
            quiz: {
              title: 'Architecture checkpoint',
              instructions: 'Four questions. You need 70% to pass.',
              timeLimitMinutes: 12,
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  prompt: 'What should be the default component type in a modern React app?',
                  type: 'single',
                  points: 2,
                  options: [
                    { label: 'Server component', correct: true },
                    { label: 'Client component' },
                    { label: 'Class component' },
                    { label: 'Web component' },
                  ],
                },
                {
                  prompt: 'Where should the authenticated user id come from in a server action?',
                  type: 'single',
                  points: 2,
                  explanation: 'Hidden form fields can be tampered with; the session is authoritative.',
                  options: [
                    { label: 'The server session', correct: true },
                    { label: 'A hidden input' },
                    { label: 'A query string parameter' },
                    { label: 'A client-side cookie' },
                  ],
                },
                {
                  prompt: 'Select the valid reasons to use a client component.',
                  type: 'multiple',
                  points: 3,
                  options: [
                    { label: 'Event handlers', correct: true },
                    { label: 'Local interactive state', correct: true },
                    { label: 'Reading a secret API key' },
                    { label: 'Browser-only APIs', correct: true },
                  ],
                },
                {
                  prompt: 'What should happen immediately after a successful mutation?',
                  type: 'short_answer',
                  points: 2,
                  acceptedAnswers: ['invalidate', 'revalidate', 'invalidate the cache', 'revalidate the cache'],
                  explanation: 'Invalidate affected cache tags so the next read reflects the write.',
                },
              ],
            },
          },
          {
            title: 'Refactor a legacy component',
            type: 'assignment',
            minutes: 60,
            assignment: {
              title: 'Refactor a legacy component',
              instructions:
                'Pick a legacy component with mixed data fetching, state and presentation. Refactor it into a server component for data, a focused client island for interaction and a pure presentational component. Include a short before/after note explaining what moved and why.',
              dueInDays: 5,
              maxPoints: 100,
              gradingCriteria:
                'Boundary choices (35), testability (25), clarity of explanation (20), code quality (20).',
            },
            resources: [
              {
                title: 'React server components reference',
                externalUrl: 'https://react.dev/reference/rsc/server-components',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'leading-high-performing-teams',
    orgId: ORG_LEARNOVA,
    instructorKey: 'maya',
    categorySlug: 'leadership',
    title: 'Leading High-Performing Teams',
    subtitle: 'Build trust, give useful feedback and run teams that can sustain excellence',
    description:
      'Leadership is a set of repeatable practices, not a personality trait. Learn how to create psychological safety, run one-on-ones that matter, set outcome-based goals and diagnose team health before it becomes a retention problem.',
    difficulty: 'beginner',
    durationMinutes: 180,
    status: 'published',
    requiresApproval: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    objectives: [
      'Create the conditions for psychological safety',
      'Deliver feedback that changes behavior without eroding trust',
      'Set goals around outcomes rather than activity',
      'Diagnose and improve team health',
    ],
    requirements: ['Currently leading or preparing to lead a team'],
    sections: [
      {
        title: 'Leading Yourself',
        lessons: [
          {
            title: 'Trust and psychological safety',
            type: 'text',
            minutes: 16,
            preview: true,
            content: `Teams do their best work when people can ask questions, admit mistakes and challenge decisions without fear.

Leaders create safety through small, repeated signals:

• Ask genuine questions and wait.
• Admit what you do not know.
• Separate the person from the problem.
• Respond to bad news with curiosity before consequences.

Safety is not niceness. It is the confidence that candor is welcome and that standards are clear.`,
          },
          {
            title: 'Feedback that lands',
            type: 'text',
            minutes: 18,
            content: `Useful feedback is specific, timely and about behavior rather than identity.

A simple structure:

1. Observation — "In yesterday's review, you interrupted the designer twice."
2. Impact — "They stopped sharing the rest of their concerns."
3. Request — "Next time, can you note questions and ask after they finish?"

Ask for permission when the moment is sensitive. Close the loop later.

Praise deserves the same specificity. "Great job" is pleasant; "The migration plan you wrote made the risk visible and changed our launch decision" is useful.`,
          },
          {
            title: 'One-on-ones that matter',
            type: 'video',
            minutes: 14,
            videoUrl: 'https://www.youtube.com/watch?v=Kq2r1Q5eZ4Y',
            content:
              'A short demonstration of a one-on-one focused on growth, blockers and signal rather than status reporting.',
          },
        ],
      },
      {
        title: 'Leading the Work',
        lessons: [
          {
            title: 'Goal setting with outcomes',
            type: 'text',
            minutes: 18,
            content: `Output is not outcome. "Ship the new dashboard" is a task. "Reduce time-to-first-insight for new customers" is an outcome.

Write goals with three parts:

• A measurable outcome
• A time horizon
• A constraint or guardrail

Example: Reduce onboarding completion time from 18 minutes to 10 minutes by the end of the quarter without increasing support contacts.

Review goals weekly, but change them rarely. Constant reprioritization teaches the team that goals are decorative.`,
          },
          {
            title: 'Team health check',
            type: 'quiz',
            minutes: 12,
            quiz: {
              title: 'Team health check',
              instructions: 'Three questions on the leadership practices in this course.',
              timeLimitMinutes: 10,
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  prompt: 'Which response best protects psychological safety after a mistake?',
                  type: 'single',
                  points: 2,
                  options: [
                    { label: 'Ask what happened and what the team learned', correct: true },
                    { label: 'Assign blame publicly to reinforce standards' },
                    { label: 'Ignore the mistake' },
                    { label: 'Cancel the project' },
                  ],
                },
                {
                  prompt: 'Which of these are outcome-based goals?',
                  type: 'multiple',
                  points: 3,
                  options: [
                    { label: 'Reduce onboarding time to 10 minutes', correct: true },
                    { label: 'Write 40 tickets' },
                    { label: 'Increase activation by 15% with no rise in support load', correct: true },
                    { label: 'Hold 12 meetings' },
                  ],
                },
                {
                  prompt: 'Feedback should focus on identity, not behavior.',
                  type: 'true_false',
                  points: 2,
                  options: [
                    { label: 'True' },
                    { label: 'False', correct: true },
                  ],
                },
              ],
            },
          },
          {
            title: 'Team health plan',
            type: 'assignment',
            minutes: 40,
            assignment: {
              title: 'Team health plan',
              instructions:
                'Describe the team you lead (or a team you know well). Identify two health risks using observable evidence, then propose a 30-day experiment for each with a success signal. Keep it to one page.',
              dueInDays: 14,
              maxPoints: 100,
              gradingCriteria:
                'Evidence quality (30), experiment design (30), measurement (20), feasibility (20).',
            },
            resources: [
              {
                title: 'Psychological safety research overview',
                externalUrl: 'https://psychsafety.com/',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'data-storytelling-essentials',
    orgId: ORG_LEARNOVA,
    instructorKey: 'leo',
    categorySlug: 'data',
    title: 'Data Storytelling Essentials',
    subtitle: 'Turn analysis into decisions with clear narratives and honest visuals',
    description:
      'A draft course on choosing the right chart, framing a decision and presenting evidence without misleading your audience. This course is intentionally unpublished so administrators and instructors can preview builder workflows.',
    difficulty: 'beginner',
    durationMinutes: 120,
    status: 'draft',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    objectives: ['Choose charts that match the question', 'Lead with the decision', 'Avoid common visual distortions'],
    requirements: ['No prior analytics experience required'],
    sections: [
      {
        title: 'Framing',
        lessons: [
          {
            title: 'Start with the decision',
            type: 'text',
            minutes: 15,
            content:
              'A data story begins with the decision the audience needs to make. Write the decision at the top of the page, then choose only the evidence that changes it.',
          },
          {
            title: 'Choosing the right chart',
            type: 'text',
            minutes: 18,
            content:
              'Use position and length for precise comparisons. Avoid pie charts for more than three categories. Label axes honestly and show uncertainty when it matters.',
          },
        ],
      },
      {
        title: 'Delivery',
        lessons: [
          {
            title: 'Narrative structure for reviews',
            type: 'video',
            minutes: 16,
            videoUrl: 'https://www.youtube.com/watch?v=8V8WN8b5l1s',
            content: 'A short example of a review narrative: context, finding, implication, recommendation.',
          },
          {
            title: 'Exercise: rewrite a dashboard',
            type: 'text',
            minutes: 20,
            content:
              'Take an existing dashboard and rewrite its top section as a one-sentence recommendation with two supporting visuals. Remove every metric that does not change the decision.',
          },
        ],
      },
    ],
  },
  {
    slug: 'applied-research-methods',
    orgId: ORG_NORTHSTAR,
    instructorKey: 'nina',
    categorySlug: 'applied-science',
    title: 'Applied Research Methods',
    subtitle: 'Design credible studies that survive contact with the real world',
    description:
      'A rigorous but practical path from research question to defensible evidence. Learn how to scope questions, review literature efficiently, choose methods, avoid common validity threats and communicate uncertainty to decision makers.',
    difficulty: 'advanced',
    durationMinutes: 260,
    status: 'published',
    featured: true,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    objectives: [
      'Turn a fuzzy problem into an answerable research question',
      'Select methods that match the evidence needed',
      'Identify threats to validity before data collection',
      'Communicate findings with calibrated uncertainty',
    ],
    requirements: ['Some experience with research or analytics', 'Willingness to critique your own assumptions'],
    sections: [
      {
        title: 'Framing the Question',
        lessons: [
          {
            title: 'From problem to research question',
            type: 'text',
            minutes: 20,
            preview: true,
            content: `A strong research question names a population, a construct and a comparison or decision.

Weak: "How do people feel about the new process?"
Stronger: "Among newly onboarded analysts, does the guided checklist reduce time to first valid submission compared with the current handbook?"

Write the decision the study will inform. If no decision changes, the study is probably curiosity rather than research.

Then write the claim you hope to support and the evidence that would change your mind.`,
          },
          {
            title: 'Literature review without rabbit holes',
            type: 'text',
            minutes: 18,
            content: `A literature review is a map of what is already known and where the gaps are. Time-box it.

1. Write your question and inclusion criteria.
2. Search three sources: a scholarly index, a practitioner library and a citation trail.
3. Extract findings into a table: study, population, method, finding, limitation.
4. Stop when new sources stop changing the table.

Record your search terms and dates so the review is reproducible.`,
          },
          {
            title: 'Methods overview',
            type: 'video',
            minutes: 18,
            videoUrl: 'https://www.youtube.com/watch?v=2Jp1w5xHq3Q',
            content: 'A tour of qualitative, quantitative and mixed-methods designs and when each is appropriate.',
          },
        ],
      },
      {
        title: 'Evidence & Communication',
        lessons: [
          {
            title: 'Sampling and validity',
            type: 'text',
            minutes: 22,
            content: `Every study has threats to validity. Name them before a reviewer does.

• Selection bias: who is missing from the sample?
• Measurement bias: does the instrument capture the construct?
• Confounding: what else changed at the same time?
• Attrition: who dropped out and why?
• Generalization: which population does this really describe?

Mitigations do not need to be expensive. Pre-register the analysis, collect a comparison group, pilot the instrument and report limitations plainly.`,
          },
          {
            title: 'Research methods checkpoint',
            type: 'quiz',
            minutes: 15,
            quiz: {
              title: 'Research methods checkpoint',
              instructions: 'Four questions. 70% to pass.',
              timeLimitMinutes: 12,
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  prompt: 'Which element makes a research question answerable?',
                  type: 'single',
                  points: 2,
                  options: [
                    { label: 'A named population, construct and comparison', correct: true },
                    { label: 'A long literature review' },
                    { label: 'A large budget' },
                    { label: 'A preferred statistical test' },
                  ],
                },
                {
                  prompt: 'Which are threats to validity?',
                  type: 'multiple',
                  points: 3,
                  options: [
                    { label: 'Selection bias', correct: true },
                    { label: 'Confounding', correct: true },
                    { label: 'Attrition', correct: true },
                    { label: 'A clear decision statement' },
                  ],
                },
                {
                  prompt: 'A pilot study is only useful for large quantitative studies.',
                  type: 'true_false',
                  points: 2,
                  options: [
                    { label: 'True' },
                    { label: 'False', correct: true },
                  ],
                },
                {
                  prompt: 'What should be reported alongside a finding to communicate uncertainty?',
                  type: 'short_answer',
                  points: 2,
                  acceptedAnswers: ['confidence interval', 'confidence intervals', 'ci', 'margin of error'],
                },
              ],
            },
          },
          {
            title: 'Research proposal',
            type: 'assignment',
            minutes: 50,
            assignment: {
              title: 'Research proposal',
              instructions:
                'Write a two-page proposal: question, decision context, method, sample, analysis plan, validity threats and limitations. Include a short section on how you will communicate uncertainty to a non-specialist audience.',
              dueInDays: 7,
              maxPoints: 100,
              gradingCriteria:
                'Question quality (25), method fit (30), validity awareness (25), communication plan (20).',
            },
            resources: [
              {
                title: 'Cochrane handbook — planning a review',
                externalUrl: 'https://training.cochrane.org/handbook',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'science-communication-studio',
    orgId: ORG_NORTHSTAR,
    instructorKey: 'nina',
    categorySlug: 'communication',
    title: 'Science Communication Studio',
    subtitle: 'Translate complex evidence for the people who need to act on it',
    description:
      'An archived studio course that walks through message design, analogy, visual explanation and handling uncertainty in public communication. It remains available for administrators and instructors to inspect archived-course behavior.',
    difficulty: 'intermediate',
    durationMinutes: 150,
    status: 'archived',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    objectives: ['Design a message for a specific audience', 'Explain uncertainty without misleading', 'Use analogies responsibly'],
    requirements: ['Experience communicating research or technical work'],
    sections: [
      {
        title: 'Message Design',
        lessons: [
          {
            title: 'Audience and message',
            type: 'text',
            minutes: 18,
            content:
              'Start with what the audience already believes and what they need to decide. A message is a change in understanding, not a summary of your slides.',
          },
          {
            title: 'Analogy and explanation',
            type: 'text',
            minutes: 20,
            content:
              'Analogies are powerful and lossy. Name what the analogy captures and where it breaks down. Retire it as soon as it creates a misconception.',
          },
        ],
      },
      {
        title: 'Delivery',
        lessons: [
          {
            title: 'Explaining uncertainty',
            type: 'video',
            minutes: 16,
            videoUrl: 'https://www.youtube.com/watch?v=1X4v8p6yF3A',
            content: 'Techniques for communicating ranges, confidence and trade-offs without false precision.',
          },
          {
            title: 'Studio critique',
            type: 'assignment',
            minutes: 35,
            assignment: {
              title: 'Studio critique',
              instructions:
                'Bring a 300-word explanation of a technical finding for a non-specialist audience. Explain one design choice, one trade-off and one thing you would test with readers.',
              dueInDays: 21,
              maxPoints: 50,
              gradingCriteria: 'Audience fit (20), clarity (15), honesty about uncertainty (15).',
            },
          },
        ],
      },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding Learnova LMS demo data…\n');

  // Platform settings
  {
    const { error } = await admin
      .from('platform_settings')
      .upsert(
        {
          id: true,
          platform_name: 'Learnova LMS',
          tagline: 'Knowledge, structured.',
          support_email: 'support@learnova.test',
          allow_signups: true,
          require_enrollment_approval: false,
          primary_color: '#4f46e5',
        },
        { onConflict: 'id' },
      );
    assertOk(error, 'platform settings');
  }

  // Organizations
  {
    const { error } = await admin.from('organizations').upsert(
      [
        {
          id: ORG_LEARNOVA,
          name: 'Learnova Academy',
          slug: 'learnova-academy',
          description:
            'A modern learning organization focused on design, engineering and leadership.',
          primary_color: '#4f46e5',
          website_url: 'https://learnova.test',
          is_active: true,
        },
        {
          id: ORG_NORTHSTAR,
          name: 'Northstar Institute',
          slug: 'northstar-institute',
          description: 'Applied science and professional education for a changing world.',
          primary_color: '#0f766e',
          website_url: 'https://northstar.test',
          is_active: true,
        },
      ],
      { onConflict: 'id' },
    );
    assertOk(error, 'organizations');
  }

  // Auth users + profiles + memberships
  const { data: authList, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  assertOk(listError, 'list auth users');
  const authByEmail = new Map(
    (authList?.users ?? [])
      .filter((user) => user.email)
      .map((user) => [user.email!.toLowerCase(), user]),
  );

  const userIds = new Map<string, string>();
  for (const user of users) {
    let authUser = authByEmail.get(user.email);
    if (!authUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: SEED_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.fullName },
      });
      assertOk(error, `create user ${user.email}`);
      if (!data.user) throw new Error(`create user ${user.email}: no user returned`);
      authUser = data.user;
      console.log(`  + created ${user.email}`);
    } else {
      const { error } = await admin.auth.admin.updateUserById(authUser.id, {
        password: SEED_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.fullName },
      });
      assertOk(error, `update user ${user.email}`);
      console.log(`  = reused ${user.email}`);
    }
    userIds.set(user.key, authUser.id);

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: authUser.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        status: 'active',
        default_org_id: user.orgId,
        email_verified: true,
        headline: user.headline,
        bio: user.bio,
      },
      { onConflict: 'id' },
    );
    assertOk(profileError, `profile ${user.email}`);

    const memberships = [
      { org_id: user.orgId, user_id: authUser.id, role: user.memberRole, status: 'active' as const },
      ...(user.extraOrg
        ? [
            {
              org_id: user.extraOrg.orgId,
              user_id: authUser.id,
              role: user.extraOrg.memberRole,
              status: 'active' as const,
            },
          ]
        : []),
    ];
    // The auth signup trigger adds every new user to the first active org.
    // Remove that default membership so seeded tenants stay isolated.
    const { error: membershipResetError } = await admin
      .from('organization_members')
      .delete()
      .eq('user_id', authUser.id);
    assertOk(membershipResetError, `reset membership ${user.email}`);
    const { error: membershipError } = await admin
      .from('organization_members')
      .insert(memberships);
    assertOk(membershipError, `membership ${user.email}`);
  }

  // Instructor access requests
  {
    const demoUserIds = [...userIds.values()];
    const { error: resetError } = await admin.from('instructor_requests').delete().in('user_id', demoUserIds);
    assertOk(resetError, 'reset instructor requests');

    const sofiaId = userIds.get('sofia');
    if (sofiaId) {
      const { error } = await admin.from('instructor_requests').insert({
        user_id: sofiaId,
        org_id: ORG_LEARNOVA,
        status: 'pending',
        message: 'I would like to teach design systems, accessibility and research-led product design.',
      });
      assertOk(error, 'instructor request');
      console.log('  + instructor request for sofia@learnova.test');
    }
  }

  // Categories
  const categories = [
    { org_id: ORG_LEARNOVA, slug: 'design', name: 'Design', color: '#8b5cf6', description: 'Product, interface and systems design.' },
    { org_id: ORG_LEARNOVA, slug: 'engineering', name: 'Engineering', color: '#0ea5e9', description: 'Modern software craft and architecture.' },
    { org_id: ORG_LEARNOVA, slug: 'leadership', name: 'Leadership', color: '#f59e0b', description: 'People, teams and organizational health.' },
    { org_id: ORG_LEARNOVA, slug: 'data', name: 'Data & Analytics', color: '#10b981', description: 'Evidence, measurement and communication.' },
    { org_id: ORG_NORTHSTAR, slug: 'applied-science', name: 'Applied Science', color: '#0f766e', description: 'Research methods and applied evidence.' },
    { org_id: ORG_NORTHSTAR, slug: 'communication', name: 'Communication', color: '#e11d48', description: 'Explaining complex work to real audiences.' },
  ];
  {
    const { error } = await admin
      .from('categories')
      .upsert(categories, { onConflict: 'org_id,slug' });
    assertOk(error, 'categories');
  }
  const { data: categoryRows, error: categoryError } = await admin
    .from('categories')
    .select('id,org_id,slug')
    .in('org_id', [ORG_LEARNOVA, ORG_NORTHSTAR]);
  assertOk(categoryError, 'load categories');
  const categoryByKey = new Map(
    (categoryRows ?? []).map((category) => [`${category.org_id}:${category.slug}`, category.id]),
  );

  // Rebuild demo courses (cascades sections, lessons, assessments, progress, certs)
  const slugs = courses.map((course) => course.slug);
  {
    const { error } = await admin.from('courses').delete().in('slug', slugs);
    assertOk(error, 'delete previous demo courses');
  }

  type SeededLesson = {
    id: string;
    courseSlug: string;
    title: string;
    type: LessonType;
    position: number;
    sectionId: string;
    sectionTitle: string;
  };
  type SeededCourse = { id: string; slug: string; lessonIds: string[]; lessons: SeededLesson[] };
  const seededCourses: SeededCourse[] = [];

  for (const course of courses) {
    const instructorId = userIds.get(course.instructorKey);
    if (!instructorId) throw new Error(`Missing instructor ${course.instructorKey}`);
    const categoryId = categoryByKey.get(`${course.orgId}:${course.categorySlug}`);
    if (!categoryId) throw new Error(`Missing category ${course.categorySlug}`);

    const { data: courseRow, error: courseError } = await admin
      .from('courses')
      .insert({
        org_id: course.orgId,
        instructor_id: instructorId,
        category_id: categoryId,
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        difficulty: course.difficulty,
        duration_minutes: course.durationMinutes,
        learning_objectives: course.objectives,
        requirements: course.requirements,
        status: course.status,
        is_featured: course.featured ?? false,
        requires_approval: course.requiresApproval ?? false,
        published_at: course.status === 'published' ? daysAgo(30) : null,
        created_by: instructorId,
      })
      .select('id')
      .single();
    assertOk(courseError, `course ${course.slug}`);
    if (!courseRow) throw new Error(`course ${course.slug}: no row returned`);

    const lessons: SeededLesson[] = [];
    let globalPosition = 0;
    for (const [sectionIndex, section] of course.sections.entries()) {
      const { data: sectionRow, error: sectionError } = await admin
        .from('course_sections')
        .insert({ course_id: courseRow.id, title: section.title, position: sectionIndex })
        .select('id')
        .single();
      assertOk(sectionError, `section ${course.slug}/${section.title}`);
      if (!sectionRow) throw new Error(`section ${section.title}: no row`);

      for (const lesson of section.lessons) {
        const { data: lessonRow, error: lessonError } = await admin
          .from('lessons')
          .insert({
            course_id: courseRow.id,
            section_id: sectionRow.id,
            title: lesson.title,
            type: lesson.type,
            content: lesson.content ?? null,
            video_url: lesson.videoUrl ?? null,
            estimated_minutes: lesson.minutes,
            position: globalPosition,
            is_preview: lesson.preview ?? false,
            is_published: true,
          })
          .select('id')
          .single();
        assertOk(lessonError, `lesson ${course.slug}/${lesson.title}`);
        if (!lessonRow) throw new Error(`lesson ${lesson.title}: no row`);

        lessons.push({
          id: lessonRow.id,
          courseSlug: course.slug,
          title: lesson.title,
          type: lesson.type,
          position: globalPosition,
          sectionId: sectionRow.id,
          sectionTitle: section.title,
        });
        globalPosition += 1;

        for (const resource of lesson.resources ?? []) {
          const { error: resourceError } = await admin.from('lesson_resources').insert({
            lesson_id: lessonRow.id,
            title: resource.title,
            external_url: resource.externalUrl,
            uploaded_by: instructorId,
          });
          assertOk(resourceError, `resource ${course.slug}/${resource.title}`);
        }

        if (lesson.quiz) {
          const { data: quizRow, error: quizError } = await admin
            .from('quizzes')
            .insert({
              org_id: course.orgId,
              course_id: courseRow.id,
              lesson_id: lessonRow.id,
              title: lesson.quiz.title,
              instructions: lesson.quiz.instructions,
              time_limit_minutes: lesson.quiz.timeLimitMinutes,
              passing_score: lesson.quiz.passingScore,
              max_attempts: lesson.quiz.maxAttempts,
              randomize_questions: false,
              randomize_answers: false,
              show_results: true,
            })
            .select('id')
            .single();
          assertOk(quizError, `quiz ${course.slug}/${lesson.quiz.title}`);
          if (!quizRow) throw new Error(`quiz ${lesson.quiz.title}: no row`);

          for (const [questionIndex, question] of lesson.quiz.questions.entries()) {
            const { data: questionRow, error: questionError } = await admin
              .from('questions')
              .insert({
                quiz_id: quizRow.id,
                prompt: question.prompt,
                type: question.type,
                points: question.points,
                position: questionIndex,
                explanation: question.explanation ?? null,
                accepted_answers: question.acceptedAnswers ?? [],
              })
              .select('id')
              .single();
            assertOk(questionError, `question ${questionIndex + 1} of ${lesson.quiz.title}`);
            if (!questionRow) throw new Error(`question ${questionIndex + 1}: no row`);

            if (question.options?.length) {
              const { error: optionError } = await admin.from('quiz_options').insert(
                question.options.map((option, optionIndex) => ({
                  question_id: questionRow.id,
                  label: option.label,
                  is_correct: option.correct ?? false,
                  position: optionIndex,
                })),
              );
              assertOk(optionError, `options for question ${questionIndex + 1}`);
            }
          }
        }

        if (lesson.assignment) {
          const { error: assignmentError } = await admin.from('assignments').insert({
            org_id: course.orgId,
            course_id: courseRow.id,
            lesson_id: lessonRow.id,
            title: lesson.assignment.title,
            instructions: lesson.assignment.instructions,
            due_at: daysFromNow(lesson.assignment.dueInDays),
            max_points: lesson.assignment.maxPoints,
            grading_criteria: lesson.assignment.gradingCriteria,
          });
          assertOk(assignmentError, `assignment ${course.slug}/${lesson.assignment.title}`);
        }
      }
    }

    seededCourses.push({
      id: courseRow.id,
      slug: course.slug,
      lessonIds: lessons.map((lesson) => lesson.id),
      lessons,
    });
    console.log(`  + ${course.title} (${lessons.length} lessons, ${course.status})`);
  }

  const courseBySlug = new Map(seededCourses.map((course) => [course.slug, course]));
  const categoryBySlug = new Map(courses.map((course) => [course.slug, course]));

  // Helper to pull lesson ids for a course, ordered.
  const lessonsFor = (slug: string) => {
    const course = courseBySlug.get(slug);
    if (!course) throw new Error(`Unknown course ${slug}`);
    return course.lessons.slice().sort((a, b) => a.position - b.position);
  };

  // ── Enrollments & progress ────────────────────────────────────────────────
  type EnrollmentPlan = {
    studentKey: string;
    courseSlug: string;
    status: 'pending' | 'active' | 'completed';
    completedLessons: number;
    enrolledDaysAgo: number;
    lastAccessedDaysAgo?: number;
    completedDaysAgo?: number;
    certificateCode?: string;
  };

  const enrollmentPlans: EnrollmentPlan[] = [
    {
      studentKey: 'student',
      courseSlug: 'design-systems-foundations',
      status: 'completed',
      completedLessons: 9,
      enrolledDaysAgo: 45,
      lastAccessedDaysAgo: 4,
      completedDaysAgo: 5,
      certificateCode: 'LUM-A1B2C3D4E5F6',
    },
    {
      studentKey: 'student',
      courseSlug: 'modern-react-architecture',
      status: 'active',
      completedLessons: 4,
      enrolledDaysAgo: 24,
      lastAccessedDaysAgo: 1,
    },
    {
      studentKey: 'student',
      courseSlug: 'leading-high-performing-teams',
      status: 'pending',
      completedLessons: 0,
      enrolledDaysAgo: 2,
    },
    {
      studentKey: 'diego',
      courseSlug: 'design-systems-foundations',
      status: 'active',
      completedLessons: 6,
      enrolledDaysAgo: 40,
      lastAccessedDaysAgo: 3,
    },
    {
      studentKey: 'diego',
      courseSlug: 'modern-react-architecture',
      status: 'active',
      completedLessons: 3,
      enrolledDaysAgo: 20,
      lastAccessedDaysAgo: 2,
    },
    {
      studentKey: 'sofia',
      courseSlug: 'design-systems-foundations',
      status: 'active',
      completedLessons: 2,
      enrolledDaysAgo: 15,
      lastAccessedDaysAgo: 6,
    },
    {
      studentKey: 'sofia',
      courseSlug: 'leading-high-performing-teams',
      status: 'active',
      completedLessons: 2,
      enrolledDaysAgo: 12,
      lastAccessedDaysAgo: 2,
    },
    {
      studentKey: 'northstarStudent',
      courseSlug: 'applied-research-methods',
      status: 'active',
      completedLessons: 3,
      enrolledDaysAgo: 18,
      lastAccessedDaysAgo: 1,
    },
  ];

  type SeededEnrollment = { id: string; studentId: string; courseId: string; slug: string };
  const enrolledByKey = new Map<string, SeededEnrollment>();

  for (const plan of enrollmentPlans) {
    const studentId = userIds.get(plan.studentKey);
    if (!studentId) throw new Error(`Missing student ${plan.studentKey}`);
    const course = courseBySlug.get(plan.courseSlug);
    if (!course) throw new Error(`Missing course ${plan.courseSlug}`);
    const seedCourse = categoryBySlug.get(plan.courseSlug);
    if (!seedCourse) throw new Error(`Missing course definition ${plan.courseSlug}`);

    const lessons = lessonsFor(plan.courseSlug);
    const total = lessons.length;
    const completed = Math.min(plan.completedLessons, total);
    const progress = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

    const { data: enrollmentRow, error: enrollmentError } = await admin
      .from('enrollments')
      .insert({
        org_id: seedCourse.orgId,
        course_id: course.id,
        student_id: studentId,
        status: plan.status,
        progress_percent: progress,
        enrolled_at: daysAgo(plan.enrolledDaysAgo),
        last_accessed_at:
          plan.status === 'pending'
            ? null
            : daysAgo(plan.lastAccessedDaysAgo ?? plan.enrolledDaysAgo),
        completed_at: plan.status === 'completed' ? daysAgo(plan.completedDaysAgo ?? 0) : null,
      })
      .select('id')
      .single();
    assertOk(enrollmentError, `enrollment ${plan.studentKey}/${plan.courseSlug}`);
    if (!enrollmentRow) throw new Error(`enrollment ${plan.studentKey}/${plan.courseSlug}: no row`);

    if (completed > 0) {
      const completedAt = daysAgo(plan.completedDaysAgo ?? Math.max(0, plan.lastAccessedDaysAgo ?? 1));
      const { error: progressError } = await admin.from('lesson_progress').insert(
        lessons.slice(0, completed).map((lesson) => ({
          org_id: seedCourse.orgId,
          enrollment_id: enrollmentRow.id,
          lesson_id: lesson.id,
          student_id: studentId,
          completed_at: completedAt,
          last_viewed_at: completedAt,
        })),
      );
      assertOk(progressError, `lesson progress ${plan.studentKey}/${plan.courseSlug}`);
    }

    enrolledByKey.set(`${plan.studentKey}:${plan.courseSlug}`, {
      id: enrollmentRow.id,
      studentId,
      courseId: course.id,
      slug: plan.courseSlug,
    });

    if (plan.certificateCode && plan.status === 'completed') {
      const student = users.find((user) => user.key === plan.studentKey);
      const instructor = users.find((user) => user.key === seedCourse.instructorKey);
      const orgName = seedCourse.orgId === ORG_LEARNOVA ? 'Learnova Academy' : 'Northstar Institute';
      const { error: certificateError } = await admin.from('certificates').insert({
        org_id: seedCourse.orgId,
        enrollment_id: enrollmentRow.id,
        student_id: studentId,
        course_id: course.id,
        code: plan.certificateCode,
        student_name: student?.fullName ?? 'Student',
        course_title: seedCourse.title,
        instructor_name: instructor?.fullName ?? 'Instructor',
        org_name: orgName,
        issued_at: daysAgo(plan.completedDaysAgo ?? 0),
      });
      assertOk(certificateError, `certificate ${plan.certificateCode}`);
    }

    console.log(
      `  + enrollment ${plan.studentKey} → ${plan.courseSlug} (${plan.status}, ${progress}%)`,
    );
  }

  // ── Quiz attempts (submitted) ─────────────────────────────────────────────
  type AttemptPlan = {
    studentKey: string;
    courseSlug: string;
    quizTitle: string;
    score: number;
    passed: boolean;
    daysAgo: number;
  };
  const attemptPlans: AttemptPlan[] = [
    {
      studentKey: 'student',
      courseSlug: 'design-systems-foundations',
      quizTitle: 'Design systems checkpoint',
      score: 90,
      passed: true,
      daysAgo: 7,
    },
    {
      studentKey: 'diego',
      courseSlug: 'design-systems-foundations',
      quizTitle: 'Design systems checkpoint',
      score: 60,
      passed: false,
      daysAgo: 6,
    },
    {
      studentKey: 'northstarStudent',
      courseSlug: 'applied-research-methods',
      quizTitle: 'Research methods checkpoint',
      score: 80,
      passed: true,
      daysAgo: 3,
    },
  ];

  for (const plan of attemptPlans) {
    const enrollment = enrolledByKey.get(`${plan.studentKey}:${plan.courseSlug}`);
    if (!enrollment) throw new Error(`Missing enrollment for attempt ${plan.studentKey}/${plan.courseSlug}`);
    const course = seededCourses.find((row) => row.slug === plan.courseSlug);
    if (!course) throw new Error(`Missing course ${plan.courseSlug}`);
    const lesson = course.lessons.find((row) => row.title === plan.quizTitle);
    if (!lesson) throw new Error(`Missing quiz lesson ${plan.quizTitle}`);

    const { data: quizRow, error: quizError } = await admin
      .from('quizzes')
      .select('id,org_id')
      .eq('lesson_id', lesson.id)
      .single();
    assertOk(quizError, `load quiz ${plan.quizTitle}`);
    if (!quizRow) throw new Error(`Quiz ${plan.quizTitle} not found`);

    const startedAt = daysAgo(plan.daysAgo);
    const submittedAt = new Date(new Date(startedAt).getTime() + 11 * 60 * 1000).toISOString();
    const { error: attemptError } = await admin.from('quiz_attempts').insert({
      org_id: quizRow.org_id,
      quiz_id: quizRow.id,
      student_id: enrollment.studentId,
      enrollment_id: enrollment.id,
      attempt_number: 1,
      status: 'submitted',
      started_at: startedAt,
      submitted_at: submittedAt,
      expires_at: null,
      score: plan.score,
      passed: plan.passed,
    });
    assertOk(attemptError, `quiz attempt ${plan.studentKey}/${plan.quizTitle}`);
  }

  // ── Assignment submissions ────────────────────────────────────────────────
  type SubmissionPlan = {
    studentKey: string;
    courseSlug: string;
    assignmentTitle: string;
    content: string;
    status: 'submitted' | 'graded' | 'returned';
    grade?: number;
    feedback?: string;
    instructorKey?: string;
    daysAgo: number;
  };
  const submissionPlans: SubmissionPlan[] = [
    {
      studentKey: 'student',
      courseSlug: 'design-systems-foundations',
      assignmentTitle: 'Capstone: audit a design system',
      content:
        'Audit of the checkout surface: five repeated visual decisions (spacing, field height, error color, focus ring, label placement), three inconsistencies with user impact, and a two-sprint plan starting with tokens and form primitives. Screenshots attached in the appendix.',
      status: 'graded',
      grade: 94,
      feedback:
        'Excellent evidence and prioritization. Your first sprint is realistic. Next time, connect the inconsistency directly to a measured user outcome.',
      instructorKey: 'maya',
      daysAgo: 8,
    },
    {
      studentKey: 'diego',
      courseSlug: 'design-systems-foundations',
      assignmentTitle: 'Capstone: audit a design system',
      content:
        'I audited the account settings area and found inconsistent spacing plus three button variants. The proposed first sprint focuses on consolidating form controls.',
      status: 'graded',
      grade: 88,
      feedback:
        'Strong inventory. Add more evidence about user impact and explain why your chosen first sprint is the highest-leverage slice.',
      instructorKey: 'maya',
      daysAgo: 4,
    },
    {
      studentKey: 'sofia',
      courseSlug: 'design-systems-foundations',
      assignmentTitle: 'Capstone: audit a design system',
      content:
        'Draft audit of the team workspace: repeated card patterns, inconsistent empty states and two competing modal implementations. I am still collecting screenshots.',
      status: 'submitted',
      daysAgo: 1,
    },
    {
      studentKey: 'student',
      courseSlug: 'modern-react-architecture',
      assignmentTitle: 'Refactor a legacy component',
      content:
        'I moved data fetching to a server component and extracted a client-only filter island. The presentational table is now pure. I still need to add a test for the empty state.',
      status: 'returned',
      feedback:
        'Good boundary choices. Please add the empty-state test and explain how you would handle pagination cache invalidation before resubmitting.',
      instructorKey: 'leo',
      daysAgo: 3,
    },
    {
      studentKey: 'sofia',
      courseSlug: 'leading-high-performing-teams',
      assignmentTitle: 'Team health plan',
      content:
        'Two observed risks: decisions stall after reviews, and on-call handoffs lack context. I propose a decision-log experiment and a handoff template with a two-week success signal.',
      status: 'submitted',
      daysAgo: 2,
    },
    {
      studentKey: 'northstarStudent',
      courseSlug: 'applied-research-methods',
      assignmentTitle: 'Research proposal',
      content:
        'Proposal: among newly onboarded analysts, does a guided checklist reduce time to first valid submission? Mixed-methods pilot with a comparison group, pre-registered analysis and a plain-language uncertainty brief.',
      status: 'submitted',
      daysAgo: 1,
    },
  ];

  for (const plan of submissionPlans) {
    const enrollment = enrolledByKey.get(`${plan.studentKey}:${plan.courseSlug}`);
    if (!enrollment) throw new Error(`Missing enrollment for submission ${plan.studentKey}/${plan.courseSlug}`);
    const course = seededCourses.find((row) => row.slug === plan.courseSlug);
    if (!course) throw new Error(`Missing course ${plan.courseSlug}`);
    const lesson = course.lessons.find((row) => row.title === plan.assignmentTitle);
    if (!lesson) throw new Error(`Missing assignment lesson ${plan.assignmentTitle}`);

    const { data: assignmentRow, error: assignmentError } = await admin
      .from('assignments')
      .select('id,org_id')
      .eq('lesson_id', lesson.id)
      .single();
    assertOk(assignmentError, `load assignment ${plan.assignmentTitle}`);
    if (!assignmentRow) throw new Error(`Assignment ${plan.assignmentTitle} not found`);

    const submittedAt = daysAgo(plan.daysAgo);
    const { error: submissionError } = await admin.from('assignment_submissions').insert({
      org_id: assignmentRow.org_id,
      assignment_id: assignmentRow.id,
      student_id: enrollment.studentId,
      content_text: plan.content,
      submitted_at: submittedAt,
      updated_at: submittedAt,
      status: plan.status,
      grade: plan.status === 'graded' ? (plan.grade ?? null) : null,
      feedback: plan.feedback ?? null,
      graded_by:
        plan.status === 'graded' && plan.instructorKey ? (userIds.get(plan.instructorKey) ?? null) : null,
      graded_at: plan.status === 'graded' ? daysAgo(Math.max(0, plan.daysAgo - 1)) : null,
    });
    assertOk(submissionError, `submission ${plan.studentKey}/${plan.assignmentTitle}`);
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  type NotificationPlan = {
    userKey: string;
    orgId: string;
    type: Database['public']['Enums']['notification_type'];
    title: string;
    body: string;
    link: string;
    read: boolean;
    daysAgo: number;
  };
  const notificationPlans: NotificationPlan[] = [
    {
      userKey: 'student',
      orgId: ORG_LEARNOVA,
      type: 'completion',
      title: 'Course completed',
      body: 'Congratulations! You completed "Design Systems Foundations" and earned a certificate.',
      link: '/student/certificates',
      read: false,
      daysAgo: 5,
    },
    {
      userKey: 'student',
      orgId: ORG_LEARNOVA,
      type: 'grade',
      title: 'Capstone graded: 94/100',
      body: 'Maya Chen left feedback on your design-system audit.',
      link: '/student/assignments',
      read: false,
      daysAgo: 4,
    },
    {
      userKey: 'student',
      orgId: ORG_LEARNOVA,
      type: 'deadline',
      title: 'Assignment due soon',
      body: '"Refactor a legacy component" is due in two days.',
      link: '/student/assignments',
      read: false,
      daysAgo: 1,
    },
    {
      userKey: 'student',
      orgId: ORG_LEARNOVA,
      type: 'feedback',
      title: 'Submission returned for revision',
      body: 'Leo Martins returned your React refactor with feedback. You can resubmit until graded.',
      link: '/student/assignments',
      read: true,
      daysAgo: 3,
    },
    {
      userKey: 'diego',
      orgId: ORG_LEARNOVA,
      type: 'grade',
      title: 'Design-system audit graded',
      body: 'You scored 88/100. Review Maya\'s feedback and keep going.',
      link: '/student/assignments',
      read: false,
      daysAgo: 3,
    },
    {
      userKey: 'diego',
      orgId: ORG_LEARNOVA,
      type: 'quiz',
      title: 'Quiz attempt recorded',
      body: 'You scored 60% on the design systems checkpoint. You have two attempts left.',
      link: '/student/my-courses',
      read: true,
      daysAgo: 6,
    },
    {
      userKey: 'sofia',
      orgId: ORG_LEARNOVA,
      type: 'enrollment',
      title: 'Enrollment approved',
      body: 'Your request to join "Leading High-Performing Teams" was approved.',
      link: '/student/my-courses',
      read: true,
      daysAgo: 12,
    },
    {
      userKey: 'sofia',
      orgId: ORG_LEARNOVA,
      type: 'deadline',
      title: 'Team health plan due soon',
      body: 'Submit your 30-day experiment plan before the deadline.',
      link: '/student/assignments',
      read: false,
      daysAgo: 1,
    },
    {
      userKey: 'northstarStudent',
      orgId: ORG_NORTHSTAR,
      type: 'system',
      title: 'Welcome to Northstar Institute',
      body: 'Your learning space is ready. Start with Applied Research Methods.',
      link: '/student/my-courses',
      read: true,
      daysAgo: 18,
    },
    {
      userKey: 'northstarStudent',
      orgId: ORG_NORTHSTAR,
      type: 'deadline',
      title: 'Research proposal due in one week',
      body: 'Your proposal is due next week. Review the rubric before submitting.',
      link: '/student/assignments',
      read: false,
      daysAgo: 2,
    },
    {
      userKey: 'maya',
      orgId: ORG_LEARNOVA,
      type: 'assignment',
      title: 'New submission to review',
      body: 'Sofia Rossi submitted "Capstone: audit a design system".',
      link: '/instructor/assignments',
      read: false,
      daysAgo: 1,
    },
    {
      userKey: 'leo',
      orgId: ORG_LEARNOVA,
      type: 'enrollment',
      title: 'New student enrolled',
      body: 'Diego Alvarez joined "Modern React Architecture".',
      link: '/instructor/students',
      read: true,
      daysAgo: 20,
    },
    {
      userKey: 'admin',
      orgId: ORG_LEARNOVA,
      type: 'system',
      title: 'Weekly learning summary',
      body: '3 courses are published, 7 learners are active, and 1 certificate was issued this week.',
      link: '/admin/analytics',
      read: false,
      daysAgo: 1,
    },
    {
      userKey: 'adminNorthstar',
      orgId: ORG_NORTHSTAR,
      type: 'system',
      title: 'Program review scheduled',
      body: 'Applied Research Methods is reviewed next Monday. Check enrollment and completion trends.',
      link: '/admin/analytics',
      read: false,
      daysAgo: 2,
    },
  ];

  if (notificationPlans.length) {
    const demoUserIds = users.map((user) => userIds.get(user.key)!);
    const { error: notificationResetError } = await admin
      .from('notifications')
      .delete()
      .in('user_id', demoUserIds);
    assertOk(notificationResetError, 'reset notifications');
    const { error } = await admin.from('notifications').insert(
      notificationPlans.map((plan) => ({
        org_id: plan.orgId,
        user_id: userIds.get(plan.userKey)!,
        type: plan.type,
        title: plan.title,
        body: plan.body,
        link: plan.link,
        read_at: plan.read ? daysAgo(Math.max(0, plan.daysAgo - 1)) : null,
        created_at: daysAgo(plan.daysAgo),
      })),
    );
    assertOk(error, 'notifications');
  }

  // ── Activity logs ─────────────────────────────────────────────────────────
  const designCourse = courseBySlug.get('design-systems-foundations');
  const reactCourse = courseBySlug.get('modern-react-architecture');
  const researchCourse = courseBySlug.get('applied-research-methods');
  const activityRows = [
    {
      org_id: ORG_LEARNOVA,
      user_id: userIds.get('student')!,
      action: 'course.completed',
      entity_type: 'course',
      entity_id: designCourse?.id ?? null,
      metadata: { course: 'Design Systems Foundations' },
      created_at: daysAgo(5),
    },
    {
      org_id: ORG_LEARNOVA,
      user_id: userIds.get('student')!,
      action: 'lesson.completed',
      entity_type: 'lesson',
      entity_id: lessonsFor('design-systems-foundations')[0]?.id ?? null,
      metadata: { course: 'Design Systems Foundations' },
      created_at: daysAgo(6),
    },
    {
      org_id: ORG_LEARNOVA,
      user_id: userIds.get('diego')!,
      action: 'enrollment.created',
      entity_type: 'enrollment',
      entity_id: null,
      metadata: { course: 'Modern React Architecture' },
      created_at: daysAgo(20),
    },
    {
      org_id: ORG_LEARNOVA,
      user_id: userIds.get('maya')!,
      action: 'submission.graded',
      entity_type: 'assignment_submission',
      entity_id: null,
      metadata: { assignment: 'Capstone: audit a design system', score: 94 },
      created_at: daysAgo(4),
    },
    {
      org_id: ORG_LEARNOVA,
      user_id: userIds.get('leo')!,
      action: 'course.updated',
      entity_type: 'course',
      entity_id: reactCourse?.id ?? null,
      metadata: { field: 'description' },
      created_at: daysAgo(2),
    },
    {
      org_id: ORG_NORTHSTAR,
      user_id: userIds.get('northstarStudent')!,
      action: 'quiz.submitted',
      entity_type: 'quiz_attempt',
      entity_id: null,
      metadata: { quiz: 'Research methods checkpoint', score: 80 },
      created_at: daysAgo(3),
    },
    {
      org_id: ORG_NORTHSTAR,
      user_id: userIds.get('adminNorthstar')!,
      action: 'course.published',
      entity_type: 'course',
      entity_id: researchCourse?.id ?? null,
      metadata: { course: 'Applied Research Methods' },
      created_at: daysAgo(25),
    },
  ];
  {
    const demoUserIds = users.map((user) => userIds.get(user.key)!);
    const { error: activityResetError } = await admin
      .from('activity_logs')
      .delete()
      .in('user_id', demoUserIds);
    assertOk(activityResetError, 'reset activity logs');
    const { error } = await admin.from('activity_logs').insert(activityRows);
    assertOk(error, 'activity logs');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const [{ count: courseCount }, { count: lessonCount }, { count: enrollmentCount }] =
    await Promise.all([
      admin.from('courses').select('id', { count: 'exact', head: true }).in('slug', slugs),
      admin.from('lessons').select('id', { count: 'exact', head: true }),
      admin.from('enrollments').select('id', { count: 'exact', head: true }),
    ]);

  console.log(`\nSeed complete.`);
  console.log(`  Courses: ${courseCount ?? 0}`);
  console.log(`  Lessons: ${lessonCount ?? 0}`);
  console.log(`  Enrollments: ${enrollmentCount ?? 0}`);
  console.log(`  Demo password: ${SEED_PASSWORD}`);
  console.log(`  super@learnova.test       → super admin`);
  console.log(`  admin@learnova.test       → org admin (Learnova Academy)`);
  console.log(`  admin@northstar.test    → org admin (Northstar Institute)`);
  console.log(`  maya@learnova.test        → instructor`);
  console.log(`  leo@learnova.test         → instructor`);
  console.log(`  nina@northstar.test     → instructor`);
  console.log(`  student@learnova.test     → student (completed course + certificate)`);
  console.log(`  diego@learnova.test       → student`);
  console.log(`  sofia@learnova.test       → student`);
  console.log(`  student@northstar.test  → student (second tenant)`);
}

main().catch((error) => {
  console.error('\nSeed failed:', error);
  process.exitCode = 1;
});
