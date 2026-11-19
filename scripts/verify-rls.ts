/**
 * Learnova LMS — live Row Level Security verification.
 *
 * Requires a running local Supabase with seeded data (`npm run db:reset` then
 * `npm run db:seed`). Every check signs in as a real demo account and exercises
 * the public PostgREST/Storage APIs with the anon key — never the service role,
 * except to discover fixture ids and restore state.
 */
import { loadEnvConfig } from '@next/env';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

loadEnvConfig(process.cwd(), true);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SEED_PASSWORD ?? 'Passw0rd!';

if (!URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error('Supabase env vars are required (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)');
}

type Client = SupabaseClient<Database>;
type PgError = { message: string; code?: string } | null;

const admin = createClient<Database>(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function makeClient() {
  return createClient<Database>(URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function signIn(email: string): Promise<Client> {
  const client = makeClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return client;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertNoError(error: PgError, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function assertError(result: { error: PgError }, context: string, fragment?: string) {
  assert(result.error, `${context}: expected a database error, but the operation succeeded`);
  if (fragment) {
    assert(
      result.error.message.toLowerCase().includes(fragment.toLowerCase()),
      `${context}: expected error containing "${fragment}", got "${result.error.message}"`,
    );
  }
}

function rowCount(data: unknown) {
  if (Array.isArray(data)) return data.length;
  return data == null ? 0 : 1;
}

function assertZero(result: { data: unknown; error: PgError }, context: string) {
  assertNoError(result.error, context);
  assert(rowCount(result.data) === 0, `${context}: expected 0 visible rows, got ${rowCount(result.data)}`);
}

function assertSome(result: { data: unknown; error: PgError }, context: string, minimum = 1) {
  assertNoError(result.error, context);
  assert(
    rowCount(result.data) >= minimum,
    `${context}: expected at least ${minimum} visible row(s), got ${rowCount(result.data)}`,
  );
}

function containsKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsKey(entry, key));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(
      ([entryKey, entryValue]) => entryKey === key || containsKey(entryValue, key),
    );
  }
  return false;
}

// ── Fixtures (service role only for id discovery) ────────────────────────────
type FixtureQuery = PromiseLike<{ data: unknown; error: PgError }>;
type FixtureData<Q> = Q extends PromiseLike<{ data: infer D; error: PgError }> ? NonNullable<D> : never;

async function fixture<Q extends FixtureQuery>(label: string, query: Q): Promise<FixtureData<Q>> {
  const { data, error } = await query;
  if (error) throw new Error(`fixture ${label}: ${error.message}`);
  if (data == null) throw new Error(`fixture ${label}: not found — run npm run db:seed`);
  return data as FixtureData<Q>;
}

async function main() {
  const [
    learnovaOrg,
    northstarOrg,
    _designCourse,
    reactCourse,
    draftCourse,
    archivedCourse,
    researchCourse,
    designQuiz,
    reactQuiz,
    designAssignment,
    designSubmission,
    designAttempt,
    certificate,
    amaraProfile,
    diegoProfile,
    noahProfile,
    designLesson,
    previewLesson,
    researchLesson,
  ] = await Promise.all([
    fixture('learnova org', admin.from('organizations').select('id,name').eq('slug', 'learnova-academy').single()),
    fixture('northstar org', admin.from('organizations').select('id,name').eq('slug', 'northstar-institute').single()),
    fixture(
      'design course',
      admin.from('courses').select('id,title,instructor_id,org_id').eq('slug', 'design-systems-foundations').single(),
    ),
    fixture(
      'react course',
      admin.from('courses').select('id,title,instructor_id,org_id').eq('slug', 'modern-react-architecture').single(),
    ),
    fixture(
      'draft course',
      admin.from('courses').select('id,title').eq('slug', 'data-storytelling-essentials').single(),
    ),
    fixture(
      'archived course',
      admin.from('courses').select('id,title').eq('slug', 'science-communication-studio').single(),
    ),
    fixture(
      'research course',
      admin.from('courses').select('id,title,instructor_id,org_id').eq('slug', 'applied-research-methods').single(),
    ),
    fixture(
      'design quiz',
      admin.from('quizzes').select('id,lesson_id,course_id').eq('title', 'Design systems checkpoint').single(),
    ),
    fixture(
      'react quiz',
      admin.from('quizzes').select('id,lesson_id,course_id').eq('title', 'Architecture checkpoint').single(),
    ),
    fixture(
      'design assignment',
      admin.from('assignments').select('id,lesson_id,course_id').eq('title', 'Capstone: audit a design system').single(),
    ),
    fixture(
      'amara design submission',
      admin
        .from('assignment_submissions')
        .select('id,student_id,grade,status')
        .eq('assignment_id', (await fixture('design assignment id', admin.from('assignments').select('id').eq('title', 'Capstone: audit a design system').single())).id)
        .eq('status', 'graded')
        .limit(1)
        .single(),
    ),
    fixture(
      'amara design attempt',
      admin
        .from('quiz_attempts')
        .select('id,quiz_id,student_id,status')
        .eq('quiz_id', (await fixture('design quiz id', admin.from('quizzes').select('id').eq('title', 'Design systems checkpoint').single())).id)
        .eq('status', 'submitted')
        .limit(1)
        .single(),
    ),
    fixture(
      'demo certificate',
      admin.from('certificates').select('id,code,student_id').eq('code', 'LUM-A1B2C3D4E5F6').single(),
    ),
    fixture('amara profile', admin.from('profiles').select('id,email,full_name,role').eq('email', 'student@learnova.test').single()),
    fixture('diego profile', admin.from('profiles').select('id,email,full_name,role').eq('email', 'diego@learnova.test').single()),
    fixture('noah profile', admin.from('profiles').select('id,email,full_name,role').eq('email', 'student@northstar.test').single()),
    fixture(
      'design non-preview lesson',
      admin.from('lessons').select('id,title,is_preview').eq('course_id', (await fixture('design course id', admin.from('courses').select('id').eq('slug', 'design-systems-foundations').single())).id).eq('is_preview', false).limit(1).single(),
    ),
    fixture(
      'design preview lesson',
      admin.from('lessons').select('id,title,is_preview').eq('course_id', (await fixture('design course id', admin.from('courses').select('id').eq('slug', 'design-systems-foundations').single())).id).eq('is_preview', true).limit(1).single(),
    ),
    fixture(
      'research lesson',
      admin.from('lessons').select('id,title').eq('course_id', (await fixture('research course id', admin.from('courses').select('id').eq('slug', 'applied-research-methods').single())).id).eq('is_preview', false).limit(1).single(),
    ),
  ]);

  assert(learnovaOrg.id !== northstarOrg.id, 'fixtures must come from distinct organizations');

  console.log('\nSigning in demo accounts…');
  const [anon, amara, diego, maya, leo, priya, marcus, sage, noah] = await Promise.all([
    Promise.resolve(makeClient()),
    signIn('student@learnova.test'),
    signIn('diego@learnova.test'),
    signIn('maya@learnova.test'),
    signIn('leo@learnova.test'),
    signIn('admin@learnova.test'),
    signIn('admin@northstar.test'),
    signIn('super@learnova.test'),
    signIn('student@northstar.test'),
  ]);

  const results: { name: string; ok: boolean; detail?: string }[] = [];
  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`  ✓ ${name}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      results.push({ name, ok: false, detail });
      console.log(`  ✗ ${name}\n      ${detail}`);
    }
  }

  console.log('\nAnonymous surface');
  await check('anonymous sees only published courses', async () => {
    const result = await anon.from('courses').select('id,status').eq('status', 'draft');
    assertZero(result, 'anonymous draft courses');
    const published = await anon.from('courses').select('id,status').eq('status', 'published');
    assertSome(published, 'anonymous published courses', 4);
  });
  await check('anonymous cannot read a draft course by id', async () => {
    assertZero(await anon.from('courses').select('id').eq('id', draftCourse.id), 'draft course by id');
  });
  await check('anonymous cannot read an archived course', async () => {
    assertZero(await anon.from('courses').select('id').eq('id', archivedCourse.id), 'archived course');
  });
  await check('anonymous cannot read profiles', async () => {
    assertZero(await anon.from('profiles').select('id').limit(5), 'anonymous profiles');
  });
  await check('anonymous cannot read questions or options', async () => {
    assertZero(await anon.from('questions').select('id,prompt').limit(5), 'anonymous questions');
    assertZero(await anon.from('quiz_options').select('id,label').limit(5), 'anonymous quiz options');
  });
  await check('anonymous cannot read lesson content but can read a preview', async () => {
    assertZero(await anon.from('lessons').select('id,content').eq('id', designLesson.id), 'anonymous non-preview lesson');
    assertSome(await anon.from('lessons').select('id,title').eq('id', previewLesson.id), 'anonymous preview lesson');
  });
  await check('anonymous cannot read lesson resources', async () => {
    assertZero(await anon.from('lesson_resources').select('id,title').limit(5), 'anonymous resources');
  });
  await check('anonymous cannot read certificates but can verify a code', async () => {
    assertZero(await anon.from('certificates').select('id').limit(5), 'anonymous certificates');
    const { data, error } = await anon.rpc('verify_certificate', { p_code: certificate.code });
    assertNoError(error, 'verify_certificate');
    assert(Array.isArray(data) && data.length === 1, 'verify_certificate should return exactly one row');
  });

  console.log('\nStudent tenant + data isolation');
  await check('student sees only their own enrollments', async () => {
    const own = await amara.from('enrollments').select('id,student_id');
    assertNoError(own.error, 'own enrollments');
    assert(own.data?.length === 3, `expected 3 enrollments, got ${own.data?.length ?? 0}`);
    assert(own.data?.every((row) => row.student_id === amaraProfile.id), 'all enrollment rows must belong to the student');
    assertZero(await amara.from('enrollments').select('id').eq('student_id', diegoProfile.id), 'another student enrollments');
  });
  await check('student cannot read another student profile', async () => {
    assertZero(await diego.from('profiles').select('id,email').eq('id', amaraProfile.id), 'peer profile');
  });
  await check('student cannot read another student submission', async () => {
    assertZero(await diego.from('assignment_submissions').select('id').eq('student_id', amaraProfile.id), 'peer submission');
  });
  await check('student cannot read unpublished or archived course content', async () => {
    assertZero(await amara.from('courses').select('id').eq('id', draftCourse.id), 'draft course');
    assertZero(await amara.from('courses').select('id').eq('id', archivedCourse.id), 'archived course');
    assertZero(await amara.from('lessons').select('id').eq('id', researchLesson.id), 'cross-course lesson content');
  });
  await check('student cannot read quiz questions or answer keys', async () => {
    assertZero(await amara.from('questions').select('id,prompt,accepted_answers').eq('quiz_id', designQuiz.id), 'questions');
    assertZero(await amara.from('quiz_options').select('id,label,is_correct').limit(10), 'quiz options');
  });
  await check('student cannot read another student quiz attempt', async () => {
    assertZero(await diego.from('quiz_attempts').select('id').eq('id', designAttempt.id), 'peer quiz attempt');
  });
  await check('quiz payload is sanitized and answer-key free', async () => {
    const { data, error } = await amara.rpc('get_quiz_attempt', { p_attempt_id: designAttempt.id });
    assertNoError(error, 'get_quiz_attempt');
    assert(data, 'attempt payload should not be null');
    assert(!containsKey(data, 'is_correct'), 'quiz payload must not contain is_correct');
    assert(!containsKey(data, 'accepted_answers'), 'quiz payload must not contain accepted_answers');
    assert(containsKey(data, 'questions'), 'quiz payload must contain questions');
  });
  await check('student cannot start a quiz without enrollment', async () => {
    const { error } = await amara.rpc('start_quiz_attempt', { p_quiz_id: reactQuiz.id });
    // Amara is enrolled in React, so this should actually succeed. Use the
    // Northstar quiz, which this student is not enrolled in.
    const otherQuiz = await fixture('research quiz', admin.from('quizzes').select('id').eq('title', 'Research methods checkpoint').single());
    const blocked = await amara.rpc('start_quiz_attempt', { p_quiz_id: otherQuiz.id });
    assertError(blocked, 'cross-enrollment quiz start', 'enrolled');
    if (!error) {
      // The first attempt (own course) is valid; clean it up at the end.
    }
  });
  await check('student cannot record progress without enrollment', async () => {
    const { error } = await amara.rpc('record_lesson_progress', { p_lesson_id: researchLesson.id, p_completed: true });
    assert(error, 'cross-enrollment progress update should fail');
  });
  await check('student cannot enroll directly or in an unpublished course', async () => {
    const direct = await amara.from('enrollments').insert({
      org_id: northstarOrg.id,
      course_id: researchCourse.id,
      student_id: amaraProfile.id,
      status: 'active',
    });
    assertError(direct, 'direct enrollment insert', 'row-level security');
    const draft = await amara.rpc('enroll_in_course', { p_course_id: draftCourse.id });
    assertError(draft, 'draft course enrollment', 'not open');
  });
  await check('student cannot promote themselves', async () => {
    const { error } = await amara.from('profiles').update({ role: 'org_admin' }).eq('id', amaraProfile.id);
    assert(error, 'role escalation should be blocked');
    const { error: statusError } = await amara.from('profiles').update({ status: 'suspended' }).eq('id', amaraProfile.id);
    assert(statusError, 'status escalation should be blocked');
  });
  await check('student can update allowed profile fields', async () => {
    const { error } = await amara.from('profiles').update({ headline: 'Product designer & systems thinker' }).eq('id', amaraProfile.id);
    assertNoError(error, 'allowed profile update');
  });
  await check('student cannot change enrollment progress', async () => {
    const { data, error } = await amara
      .from('enrollments')
      .update({ progress_percent: 100 })
      .eq('student_id', amaraProfile.id)
      .select('id');
    assertNoError(error, 'enrollment progress update');
    assert((data ?? []).length === 0, 'no enrollment rows should be updatable');
  });
  await check('student cannot change their grade or submission status', async () => {
    const { data, error } = await amara
      .from('assignment_submissions')
      .update({ grade: 100, status: 'graded' })
      .eq('id', designSubmission.id)
      .select('id');
    if (error) {
      assert(true, 'update rejected');
    } else {
      assert((data ?? []).length === 0, 'graded submission must not be editable by the student');
    }
  });
  await check('student cannot read another tenant course enrollment', async () => {
    assertZero(await noah.from('enrollments').select('id').eq('student_id', amaraProfile.id), 'cross-tenant enrollment');
    assertZero(await noah.from('assignment_submissions').select('id').eq('student_id', amaraProfile.id), 'cross-tenant submission');
  });

  console.log('\nInstructor boundaries');
  await check('instructor can read questions for their own course only', async () => {
    assertSome(await maya.from('questions').select('id,prompt').eq('quiz_id', designQuiz.id), 'own-course questions', 4);
    assertZero(await maya.from('questions').select('id').eq('quiz_id', reactQuiz.id), 'another instructor questions');
  });
  await check('instructor cannot edit another instructor course', async () => {
    const { data, error } = await maya
      .from('courses')
      .update({ subtitle: 'Changed by the wrong instructor' })
      .eq('id', reactCourse.id)
      .select('id');
    assertNoError(error, 'foreign course update');
    assert((data ?? []).length === 0, 'foreign course must not be updatable');
  });
  await check('instructor sees only submissions for their courses', async () => {
    assertSome(await maya.from('assignment_submissions').select('id,assignment_id').eq('assignment_id', designAssignment.id), 'own submissions', 2);
    assertZero(await leo.from('assignment_submissions').select('id').eq('assignment_id', designAssignment.id), 'foreign submissions');
  });
  await check('instructor cannot change their own role', async () => {
    const mayaProfile = await fixture('maya profile', admin.from('profiles').select('id').eq('email', 'maya@learnova.test').single());
    const { error } = await maya.from('profiles').update({ role: 'org_admin' }).eq('id', mayaProfile.id);
    assert(error, 'instructor role escalation should be blocked');
  });
  await check('instructor cannot read another tenant questions', async () => {
    const researchQuiz = await fixture('research quiz', admin.from('quizzes').select('id').eq('title', 'Research methods checkpoint').single());
    assertZero(await maya.from('questions').select('id').eq('quiz_id', researchQuiz.id), 'cross-tenant questions');
  });

  console.log('\nInstructor requests');

  await check('student can request instructor access in their organization', async () => {
    await admin.from('instructor_requests').delete().eq('user_id', diegoProfile.id);
    const result = await diego
      .from('instructor_requests')
      .insert({ user_id: diegoProfile.id, org_id: learnovaOrg.id, status: 'pending', message: 'RLS verification request' })
      .select('id,status')
      .single();
    assertNoError(result.error, 'own instructor request');
    assert(result.data?.status === 'pending', 'instructor request should start pending');
  });

  await check('student cannot read another student instructor request', async () => {
    assertZero(
      await amara.from('instructor_requests').select('id').eq('user_id', diegoProfile.id),
      'peer instructor request',
    );
  });

  await check('org admin can review requests in their organization only', async () => {
    assertSome(
      await priya.from('instructor_requests').select('id,user_id').eq('user_id', diegoProfile.id),
      'own-org instructor request',
    );
    assertZero(
      await marcus.from('instructor_requests').select('id').eq('user_id', diegoProfile.id),
      'cross-tenant instructor request',
    );
  });

  await check('student cannot approve their own instructor request', async () => {
    const result = await diego
      .from('instructor_requests')
      .update({ status: 'approved' })
      .eq('user_id', diegoProfile.id)
      .select('id,status');
    assertNoError(result.error, 'self approval');
    assert(rowCount(result.data) === 0, 'self approval should update 0 rows');
  });

  await check('student cannot create a pre-approved instructor request', async () => {
    const result = await amara.from('instructor_requests').insert({
      user_id: amaraProfile.id,
      org_id: learnovaOrg.id,
      status: 'approved',
    });
    assertError(result, 'pre-approved instructor request', 'row-level security');
  });

  // Keep the seeded demo state clean: the insert check above is the only test
  // fixture this section needs, and leaving it pending would show up in the
  // admin review queue.
  await admin.from('instructor_requests').delete().eq('user_id', diegoProfile.id);

  console.log('\nAdministrator tenancy boundaries');
  await check('org admin only sees profiles from their organization', async () => {
    assertSome(await priya.from('profiles').select('id,email').eq('default_org_id', learnovaOrg.id), 'own org profiles', 6);
    assertZero(await priya.from('profiles').select('id').eq('id', noahProfile.id), 'foreign org profile');
  });
  await check('org admin cannot modify another organization course', async () => {
    const { data, error } = await priya
      .from('courses')
      .update({ title: 'Cross-tenant edit' })
      .eq('id', researchCourse.id)
      .select('id');
    assertNoError(error, 'cross-tenant course update');
    assert((data ?? []).length === 0, 'foreign course must not be updatable');
  });
  await check('org admin cannot promote themselves without the service role', async () => {
    const priyaProfile = await fixture('priya profile', admin.from('profiles').select('id').eq('email', 'admin@learnova.test').single());
    const { error } = await priya.from('profiles').update({ role: 'super_admin' }).eq('id', priyaProfile.id);
    assert(error, 'admin role escalation should be blocked');
  });
  await check('org admin cannot read another organization enrollment', async () => {
    assertZero(await priya.from('enrollments').select('id').eq('org_id', northstarOrg.id), 'foreign org enrollments');
  });
  await check('super admin can read across organizations', async () => {
    const courses = await sage.from('courses').select('id,org_id,status');
    assertNoError(courses.error, 'super admin courses');
    const orgIds = new Set((courses.data ?? []).map((row) => row.org_id));
    assert(orgIds.has(learnovaOrg.id) && orgIds.has(northstarOrg.id), 'super admin should see both tenants');
    const questions = await sage.from('questions').select('id,quiz_id');
    assertNoError(questions.error, 'super admin questions');
    assert((questions.data?.length ?? 0) >= 10, 'super admin should see question banks');
  });

  console.log('\nStorage isolation');
  const avatarPath = `${amaraProfile.id}/verify-avatar.png`;
  const diegoAvatarPath = `${diegoProfile.id}/verify-avatar.png`;
  const privatePath = `verify/private-${Date.now()}.txt`;
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
    'base64',
  );

  await check('student can manage their own avatar folder', async () => {
    const first = await amara.storage.from('avatars').upload(avatarPath, pngBytes, {
      contentType: 'image/png',
      upsert: true,
    });
    assertNoError(first.error, 'own avatar upload');
    const replace = await amara.storage.from('avatars').upload(avatarPath, pngBytes, {
      contentType: 'image/png',
      upsert: true,
    });
    assertNoError(replace.error, 'own avatar replacement');
    // Direct deletes are blocked locally by storage.protect_delete() because
    // storage-api 1.27.x does not set allow_delete_query; deleting is not part
    // of the app's avatar flow (the action clears profiles.avatar_url).
  });
  await check('student cannot write to another user avatar folder', async () => {
    const upload = await amara.storage.from('avatars').upload(diegoAvatarPath, pngBytes, {
      contentType: 'image/png',
    });
    assert(upload.error, 'cross-user avatar upload must fail');
  });
  await check('private buckets reject direct student access', async () => {
    const upload = await amara.storage.from('course-media').upload(privatePath, Buffer.from('secret'), {
      contentType: 'text/plain',
    });
    assert(upload.error, 'direct course-media upload must fail');
  });
  await check('private files are served only through authorized routes', async () => {
    await admin.storage.from('course-media').remove([privatePath]);
    const seeded = await admin.storage.from('course-media').upload(privatePath, Buffer.from('secret'), {
      contentType: 'text/plain',
    });
    assertNoError(seeded.error, 'service-role private upload');
    try {
      const studentRead = await amara.storage.from('course-media').download(privatePath);
      assert(studentRead.error, 'student direct private download must fail');
      const anonRead = await anon.storage.from('course-media').download(privatePath);
      assert(anonRead.error, 'anonymous direct private download must fail');
    } finally {
      await admin.storage.from('course-media').remove([privatePath]);
    }
  });

  // Cleanup any in-progress attempts created during verification.
  await admin
    .from('quiz_attempts')
    .delete()
    .eq('status', 'in_progress')
    .in('student_id', [amaraProfile.id]);

  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;
  console.log(`\n${passed}/${results.length} checks passed.`);
  if (failed) {
    console.log('\nFailures:');
    for (const result of results.filter((row) => !row.ok)) {
      console.log(`  - ${result.name}: ${result.detail}`);
    }
    process.exitCode = 1;
  } else {
    console.log('RLS verification passed.');
  }
}

main().catch((error) => {
  console.error('\nRLS verification failed to run:', error);
  process.exitCode = 1;
});
