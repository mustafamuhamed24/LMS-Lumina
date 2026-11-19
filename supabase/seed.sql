-- =============================================================================
-- Baseline seed data (idempotent).
-- Demo users, courses and learning records are created by scripts/seed.ts via
-- the Supabase Admin API (passwords cannot be safely seeded in plain SQL).
-- =============================================================================

insert into public.platform_settings (id, platform_name, tagline, support_email, primary_color)
values (true, 'Learnova LMS', 'Knowledge, structured.', 'support@learnova.test', '#4f46e5')
on conflict (id) do update
  set platform_name = excluded.platform_name,
      tagline = excluded.tagline,
      support_email = excluded.support_email;

insert into public.organizations (id, name, slug, description, primary_color, website_url)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Learnova Academy',
    'learnova-academy',
    'A modern learning organization focused on design, engineering and leadership.',
    '#4f46e5',
    'https://learnova.test'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Northstar Institute',
    'northstar-institute',
    'Applied science and professional education for a changing world.',
    '#0f766e',
    'https://northstar.test'
  )
on conflict (id) do nothing;
