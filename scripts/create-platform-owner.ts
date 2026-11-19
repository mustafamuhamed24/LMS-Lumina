/**
 * Learnova LMS — platform owner bootstrap.
 *
 * Creates (or promotes) the first `super_admin` account. Super admins are the
 * only people who can open `/admin/platform`, manage every tenant and grant
 * platform-level roles. Public signup can never produce one, by design.
 *
 * Usage:
 *   npm run admin:create -- owner@example.com "Platform Owner" "S3curePass!" learnova-academy
 *
 * The password and organization slug are optional: a strong password is
 * generated when omitted and the first active organization is used if no slug
 * is given. Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local. All writes use the service role, which must never reach the
 * browser.
 */
import { randomBytes } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

loadEnvConfig(process.cwd(), true);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.',
  );
  process.exit(1);
}

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function usage() {
  console.log(`
Create or promote the platform owner (super admin).

Usage:
  npm run admin:create -- <email> ["Full name"] ["Password"] [org-slug]

Examples:
  npm run admin:create -- owner@example.com "Platform Owner" "S3curePass!" learnova-academy
  npm run admin:create -- owner@example.com

Notes:
  - Password is optional; a strong one is generated and printed when omitted.
  - Organization slug is optional; the first active organization is used.
`);
}

function generatePassword() {
  // 24 URL-safe characters with at least one letter and one number.
  let value = randomBytes(18).toString('base64url');
  if (!/[A-Za-z]/.test(value)) value = `a${value}`;
  if (!/[0-9]/.test(value)) value = `${value}7`;
  return value;
}

function assertPassword(password: string) {
  if (password.length < 8 || password.length > 72) {
    throw new Error('Password must be between 8 and 72 characters.');
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password must include at least one letter and one number.');
  }
}

function assertEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`"${email}" does not look like an email address.`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }

  const [emailArg, nameArg, passwordArg, orgSlugArg] = args;
  if (!emailArg) {
    usage();
    process.exitCode = 1;
    return;
  }

  const email = emailArg.trim().toLowerCase();
  assertEmail(email);

  const fullName = nameArg?.trim() || email.split('@')[0] || 'Platform Owner';
  const password = passwordArg ?? generatePassword();
  assertPassword(password);

  // Resolve the organization before touching auth so failures are obvious.
  let orgQuery = admin
    .from('organizations')
    .select('id,name,slug')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1);

  if (orgSlugArg) {
    orgQuery = admin
      .from('organizations')
      .select('id,name,slug')
      .eq('slug', orgSlugArg)
      .is('deleted_at', null)
      .limit(1);
  }

  const { data: organizations, error: orgError } = await orgQuery;
  if (orgError) throw orgError;

  const organization = organizations?.[0];
  if (!organization) {
    throw new Error(
      orgSlugArg
        ? `No organization with slug "${orgSlugArg}" was found.`
        : 'No organization exists yet. Seed the baseline data or create an organization in Supabase first.',
    );
  }

  // Reuse an existing auth user when the email is already registered.
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id,email,full_name,role')
    .eq('email', email)
    .maybeSingle();

  let userId: string;
  let created = false;

  if (existingProfile) {
    userId = existingProfile.id;
    const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (passwordError) throw passwordError;
    console.log(`\nReusing existing account: ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return the created user.');
    userId = data.user.id;
    created = true;
    console.log(`\nCreated account: ${email}`);
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      email,
      role: 'super_admin',
      status: 'active',
      default_org_id: organization.id,
      headline: 'Platform administrator',
      email_verified: true,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { error: memberError } = await admin.from('organization_members').upsert(
    {
      org_id: organization.id,
      user_id: userId,
      role: 'org_admin',
      status: 'active',
    },
    { onConflict: 'org_id,user_id' },
  );
  if (memberError) throw memberError;

  await admin.from('notifications').insert({
    org_id: organization.id,
    user_id: userId,
    type: 'system',
    title: 'Platform owner access',
    body: 'Your account has platform-wide access. Open Platform control to review tenants, people and instructor requests.',
    link: '/admin/platform',
  });

  await admin.from('activity_logs').insert({
    org_id: organization.id,
    user_id: userId,
    action: created ? 'platform.owner_created' : 'platform.owner_promoted',
    entity_type: 'profile',
    entity_id: userId,
    metadata: { email, via: 'scripts/create-platform-owner.ts' },
  });

  console.log(`Promoted to super admin (organization: ${organization.name}).`);
  console.log('\n──────────────────────────────────────────────');
  console.log(`  Sign-in URL : ${APP_URL}/login`);
  console.log(`  Email       : ${email}`);
  console.log(`  Password    : ${password}`);
  console.log('  Dashboard   : /admin  →  Platform control (/admin/platform)');
  console.log('──────────────────────────────────────────────');
  console.log('Store the password securely and rotate it after the first sign-in.');
  if (!passwordArg) console.log('This password was generated for you.');
}

main().catch((error) => {
  console.error(`\nFailed to create the platform owner: ${(error as Error).message}`);
  process.exit(1);
});
