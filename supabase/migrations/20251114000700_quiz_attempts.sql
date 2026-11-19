-- =============================================================================
-- Learnova LMS — secure quiz attempt lifecycle
-- Learners never read questions, options or answer keys directly. These
-- security-definer functions expose sanitized questions, enforce enrollment and
-- attempt limits, and grade submissions entirely on the server.
-- =============================================================================

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns table (
  attempt_id uuid,
  attempt_number integer,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_quiz public.quizzes%rowtype;
  v_existing public.quiz_attempts%rowtype;
  v_used integer;
  v_next integer;
  v_id uuid;
  v_expires timestamptz;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select q.* into v_quiz
  from public.quizzes q
  join public.courses c on c.id = q.course_id
  join public.lessons l on l.id = q.lesson_id
  where q.id = p_quiz_id
    and c.status = 'published'
    and c.deleted_at is null
    and l.is_published;

  if not found then
    raise exception 'Quiz not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.course_id = v_quiz.course_id
      and e.student_id = v_uid
      and e.status in ('active', 'completed')
  ) then
    raise exception 'You must be enrolled to attempt this quiz' using errcode = '42501';
  end if;

  select * into v_existing
  from public.quiz_attempts a
  where a.quiz_id = p_quiz_id
    and a.student_id = v_uid
    and a.status = 'in_progress'
  order by a.attempt_number desc
  limit 1;

  if found and (v_existing.expires_at is null or v_existing.expires_at > now()) then
    return query select v_existing.id, v_existing.attempt_number, v_existing.expires_at;
    return;
  end if;

  select count(*) into v_used
  from public.quiz_attempts a
  where a.quiz_id = p_quiz_id and a.student_id = v_uid;

  if v_used >= v_quiz.max_attempts then
    raise exception 'You have used all % attempts for this quiz', v_quiz.max_attempts using errcode = '42501';
  end if;

  select coalesce(max(a.attempt_number), 0) + 1 into v_next
  from public.quiz_attempts a
  where a.quiz_id = p_quiz_id and a.student_id = v_uid;

  v_expires := case
    when v_quiz.time_limit_minutes is null then null
    else now() + make_interval(mins => v_quiz.time_limit_minutes)
  end;

  insert into public.quiz_attempts (
    org_id, quiz_id, student_id, enrollment_id, attempt_number, status, started_at, expires_at
  )
  select
    v_quiz.org_id, p_quiz_id, v_uid, e.id, v_next, 'in_progress', now(), v_expires
  from public.enrollments e
  where e.course_id = v_quiz.course_id
    and e.student_id = v_uid
    and e.status in ('active', 'completed')
  returning id into v_id;

  return query select v_id, v_next, v_expires;
end;
$$;

create or replace function public.get_quiz_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_payload jsonb;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', a.id,
    'quiz_id', a.quiz_id,
    'status', a.status,
    'attempt_number', a.attempt_number,
    'expires_at', a.expires_at,
    'started_at', a.started_at,
    'score', a.score,
    'passed', a.passed,
    'lesson_id', q.lesson_id,
    'course_id', q.course_id,
    'quiz_title', q.title,
    'instructions', q.instructions,
    'time_limit_minutes', q.time_limit_minutes,
    'passing_score', q.passing_score,
    'max_attempts', q.max_attempts,
    'show_results', q.show_results,
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', qu.id,
          'prompt', qu.prompt,
          'type', qu.type,
          'points', qu.points,
          'position', qu.position,
          'options', coalesce((
            select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label) order by o.position, o.id)
            from public.quiz_options o
            where o.question_id = qu.id
          ), '[]'::jsonb)
        )
        order by qu.position, qu.id
      )
      from public.questions qu
      where qu.quiz_id = q.id
    ), '[]'::jsonb)
  )
  into v_payload
  from public.quiz_attempts a
  join public.quizzes q on q.id = a.quiz_id
  where a.id = p_attempt_id
    and a.student_id = v_uid;

  if v_payload is null then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;

  return v_payload;
end;
$$;

create or replace function public.submit_quiz_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
returns table (
  score numeric,
  passed boolean,
  correct_answers integer,
  total_questions integer,
  attempts_used integer,
  max_attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_quiz public.quizzes%rowtype;
  v_question public.questions%rowtype;
  v_answer jsonb;
  v_selected uuid[];
  v_expected uuid[];
  v_text text;
  v_is_correct boolean;
  v_awarded numeric;
  v_total_points numeric := 0;
  v_earned numeric := 0;
  v_correct integer := 0;
  v_total_questions integer := 0;
  v_score numeric;
  v_passed boolean;
  v_used integer;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id and a.student_id = v_uid;

  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'This attempt has already been submitted' using errcode = '42501';
  end if;

  if v_attempt.expires_at is not null and v_attempt.expires_at < now() then
    raise exception 'The time limit for this attempt has expired' using errcode = '42501';
  end if;

  select * into v_quiz from public.quizzes q where q.id = v_attempt.quiz_id;
  if not found then
    raise exception 'Quiz not found' using errcode = 'P0002';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid answers payload' using errcode = '22023';
  end if;

  for v_question in
    select * from public.questions q where q.quiz_id = v_quiz.id order by q.position, q.id
  loop
    v_total_points := v_total_points + v_question.points;
    v_total_questions := v_total_questions + 1;

    select answer into v_answer
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) as t(answer)
    where answer ->> 'question_id' = v_question.id::text
    limit 1;

    if v_answer is null then
      continue;
    end if;

    v_text := nullif(btrim(coalesce(v_answer ->> 'answer_text', '')), '');
    v_selected := '{}'::uuid[];
    v_is_correct := false;
    v_awarded := 0;

    if v_question.type = 'short_answer' then
      if v_text is not null and exists (
        select 1
        from unnest(v_question.accepted_answers) accepted
        where lower(btrim(accepted)) = lower(v_text)
      ) then
        v_is_correct := true;
        v_awarded := v_question.points;
      end if;
    else
      select coalesce(array_agg(distinct value::uuid), '{}'::uuid[])
      into v_selected
      from jsonb_array_elements_text(coalesce(v_answer -> 'selected_option_ids', '[]'::jsonb)) as t(value);

      if exists (
        select 1
        from unnest(v_selected) as selected(option_id)
        where not exists (
          select 1 from public.quiz_options o
          where o.id = selected.option_id and o.question_id = v_question.id
        )
      ) then
        raise exception 'An answer option does not belong to the question' using errcode = '22023';
      end if;

      select coalesce(array_agg(o.id order by o.id), '{}'::uuid[])
      into v_expected
      from public.quiz_options o
      where o.question_id = v_question.id and o.is_correct;

      if cardinality(v_expected) > 0
         and cardinality(v_selected) = cardinality(v_expected)
         and v_selected = v_expected then
        v_is_correct := true;
        v_awarded := v_question.points;
      end if;
    end if;

    if v_is_correct then
      v_correct := v_correct + 1;
    end if;
    v_earned := v_earned + v_awarded;

    insert into public.quiz_answers (
      attempt_id, question_id, selected_option_ids, answer_text, is_correct, points_awarded
    ) values (
      v_attempt.id, v_question.id, v_selected, v_text, v_is_correct, v_awarded
    )
    on conflict (attempt_id, question_id) do update
      set selected_option_ids = excluded.selected_option_ids,
          answer_text = excluded.answer_text,
          is_correct = excluded.is_correct,
          points_awarded = excluded.points_awarded;
  end loop;

  v_score := case
    when v_total_points > 0 then round((v_earned / v_total_points) * 100, 2)
    else 0
  end;
  v_passed := v_score >= v_quiz.passing_score;

  update public.quiz_attempts
  set status = 'submitted',
      submitted_at = now(),
      score = v_score,
      passed = v_passed
  where id = v_attempt.id;

  select count(*) into v_used
  from public.quiz_attempts a
  where a.quiz_id = v_attempt.quiz_id and a.student_id = v_uid;

  return query select v_score, v_passed, v_correct, v_total_questions, v_used, v_quiz.max_attempts;
end;
$$;

revoke all on function public.start_quiz_attempt(uuid) from public;
revoke all on function public.get_quiz_attempt(uuid) from public;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;

grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.get_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
