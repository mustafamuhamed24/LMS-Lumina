# Deploying Learnova LMS

**Developer:** Mustafa Muhamed

This guide covers a production deployment on Vercel with a hosted Supabase project:
environment variables, the platform-owner account, instant verification-free signup, and the
settings that make reset and invitation links return to the deployed app instead of `localhost`.

> **Vercel does not send authentication email.** Supabase Auth sends signup and password-reset
> messages. To make them come from Learnova rather than a shared Supabase mailer, configure custom
> SMTP and the branded templates in this repository.

## 1. What runs where

| Piece | Runs on | Notes |
| --- | --- | --- |
| Next.js app | Vercel (or any Node host) | Server actions, route handlers and PDFs |
| Postgres, Auth, Storage | Supabase | RLS enforces tenancy |
| Auth email | Your SMTP provider via Supabase | Sender identity and DNS belong to your domain |

The browser only ever receives the public Supabase URL and anon key. `SUPABASE_SERVICE_ROLE_KEY`
must be a server-only environment variable.

## 2. Environment files

| File | Commit? | Purpose |
| --- | --- | --- |
| `.env.example` | Yes | Local development template |
| `.env.production.example` | Yes | Production variable list for the host |
| `.env.local` | No | Your local values (already gitignored) |
| `.env.production.local` | No | Optional local production build using hosted keys |
| `.env.production` | No | Gitignored; prefer the host dashboard |

`npm run build` on your machine reads `.env.production.local`. On Vercel, set the same variables
in **Project → Settings → Environment Variables** for Production (and Preview if needed):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Optional — fallbacks only. The platform owner edits both values in
# Admin → Settings; these are used when the database value is missing.
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
NEXT_PUBLIC_SUPPORT_WHATSAPP=201234567890
```

`NEXT_PUBLIC_APP_URL` is not cosmetic: it is the origin used for invitation and password-reset
links. If it is missing or still points at `localhost`, the app falls back to the incoming request
host, but the Supabase redirect allow-list must still contain the deployed domain.

## 3. Platform owner login

A platform owner is a profile with `role = 'super_admin'`. Only that role can open
`/admin/platform` and manage every tenant. Public signup can never create one.

### Existing hosted owner

The hosted project already has a confirmed super admin. Sign in at:

```
https://your-domain.com/login
```

Then open **Platform control** (`/admin/platform`) from the admin sidebar.

If the password is unknown, use one of these recovery paths:

1. **Bootstrap script (recommended).** From a trusted terminal with the production values loaded:

   ```bash
   npm run admin:create -- owner@example.com "Platform Owner"
   ```

   The script reuses the existing auth user, sets a new strong password, confirms the email,
   promotes the profile, ensures an organization membership and writes an audit entry. It prints
   the password once.

2. **Forgot password.** Open `/forgot-password`. This only works once SMTP is configured, because
   Supabase must deliver the reset message.

3. **Supabase Dashboard → Authentication → Users.** Open the person, reset the password or send a
   recovery link, then confirm the profile role under **Table Editor → profiles**.

### Create a new owner

```bash
npm run admin:create -- owner@example.com "Platform Owner" "S3curePass!" learnova-academy
```

- Password and organization slug are optional.
- Omit the password to generate one and print it once.
- Omit the slug to use the first active organization.
- Running it again for the same address resets the password and reapplies access.

Never grant `super_admin` through public signup or a client-side update. The
`profiles_protect_privileges` trigger blocks user-scoped changes to role, status, email, default
organization and verification.

## 4. Supabase project setup

1. Create the project at <https://supabase.com/dashboard>.
2. Link it locally:

   ```bash
   npx supabase link --project-ref YOUR-PROJECT-REF
   ```

3. Push the schema:

   ```bash
   npx supabase db push
   ```

4. Confirm the private buckets from the migrations exist (`course-media`, `submissions`) and that
   `avatars` is the only public bucket.
5. Copy the project URL, anon key and service-role key into the host environment.

Do not create tables by hand in production. Migrations are the source of truth.

## 5. Point Auth at the deployed domain

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
| --- | --- |
| Site URL | `https://your-domain.com` |
| Redirect URLs | `https://your-domain.com` |
| | `https://your-domain.com/auth/callback` |
| | `https://your-domain.com/reset-password` |

For Vercel preview deployments, add a preview pattern separately, for example
`https://*-your-team.vercel.app/**`. Supabase matches redirect URLs exactly unless you use a
wildcard, so a missing `/auth/callback` entry produces a link that falls back to the Site URL.

The app's callback accepts both styles:

- `?code=...` from the default Supabase confirmation URL (same browser).
- `?token_hash=...&type=signup|recovery|...` from the branded templates (works across devices).

The callback handles recovery and invitation links; signup does not need it because accounts are
confirmed server-side and signed in immediately. If a session is present, the middleware sends the
person straight to their dashboard; password recovery links land on `/reset-password`.

## 6. Send email from your own domain

### 6.1 Choose an SMTP provider

Any transactional provider works. Common choices:

| Provider | Host | Port | User |
| --- | --- | --- | --- |
| Resend | `smtp.resend.com` | 587 | `resend` |
| SendGrid | `smtp.sendgrid.net` | 587 | `apikey` |
| Postmark | `smtp.postmarkapp.com` | 587 | Server token |
| Amazon SES | `email-smtp.<region>.amazonaws.com` | 587 | SMTP credentials |

Use port **587 with STARTTLS** (or 465 with implicit TLS if your provider requires it).

### 6.2 Verify the sending domain

At your DNS provider:

1. Add the SPF record the provider gives you, for example
   `v=spf1 include:_spf.resend.com ~all` (merge with an existing SPF record rather than adding a
   second one).
2. Add the DKIM CNAME/TXT records and wait for verification.
3. Optionally add a DMARC record, for example `v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com`.
4. Use a sender such as `no-reply@your-domain.com` or `auth@your-domain.com`. The local part does
   not need a mailbox, but the domain must be verified.

### 6.3 Configure Supabase SMTP

In **Supabase Dashboard → Authentication → Emails → SMTP Settings**:

| Field | Value |
| --- | --- |
| Enable custom SMTP | On |
| Host | Provider SMTP host |
| Port | `587` |
| Username | Provider username |
| Password | Provider API key / SMTP password |
| Sender email | `no-reply@your-domain.com` |
| Sender name | `Learnova LMS` |

Send a test email from the dashboard before continuing. Check the message source: the `From`
header should be your domain, and SPF/DKIM should pass.

### 6.4 Apply the branded templates

The HTML lives in [`supabase/templates/`](supabase/templates):

| Template | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirmation.html` | Confirm your Learnova LMS account |
| Reset password | `recovery.html` | Reset your Learnova LMS password |
| Magic link | `magic_link.html` | Your Learnova LMS sign-in link |
| Invite | `invite.html` | You are invited to Learnova LMS |
| Change email | `email_change.html` | Confirm your new Learnova LMS email |

Local Supabase reads them through `supabase/config.toml`. For the hosted project, open
**Authentication → Emails → Templates**, paste each file's contents into the matching template,
and use the subject above. The templates link to `{{ .RedirectTo }}?token_hash=...&type=...`,
which is what makes confirmation work when the email is opened on a different device.

> Keep `{{ .RedirectTo }}` and `{{ .TokenHash }}` intact when editing. They are Supabase template
> variables, not placeholders to replace manually.

## 7. Signup behavior — instant access, no verification

Learnova confirms new accounts on the server and signs the person in immediately, so there is no
confirmation email to wait for and no verification step.

- `/register` creates the auth user, confirms it with the service role, opens a session and sends
  the person straight to their workspace with a welcome popup.
- Sign-in also recovers older unconfirmed accounts: if Supabase reports `email not confirmed`, the
  server confirms the account once and retries the sign-in.
- Local and hosted environments behave the same way, regardless of the **Confirm email** toggle in
  **Authentication → Sign In / Providers → Email**.

Because email ownership is not verified, treat this mode as trust-on-first-use: anyone can register
with an address they do not own. Keep it for internal, demo or managed deployments, and switch back
to Supabase's confirmation flow if you need verified addresses.


## 8. Deploy on Vercel

1. Import the repository into Vercel.
2. Framework preset: **Next.js**. Build command: `npm run build`. Install command: `npm install`.
3. Add the four required variables to **Production**.
4. Set `NEXT_PUBLIC_APP_URL` to the final domain, including `https://`, with no trailing slash.
5. Deploy.
6. Add the same domain to Supabase **Site URL** and **Redirect URLs**, then redeploy if you changed
   `NEXT_PUBLIC_APP_URL` (it is inlined at build time).
7. Create or recover the owner:

   ```bash
   npm run admin:create -- owner@example.com "Platform Owner"
   ```

8. Sign in, open `/admin/platform`, and confirm the dashboard loads.

## 9. Post-deploy smoke test

- [ ] `/register` creates an account and lands in the workspace immediately with the welcome popup.
- [ ] Signing out and back in with the same credentials works without a verification step.
- [ ] `/forgot-password` delivers a reset link that returns to `/reset-password`.
- [ ] The owner can open `/admin/platform`; an org admin is redirected to `/admin`.
- [ ] A student can enroll, complete a lesson and download a certificate.
- [ ] `/verify` validates the certificate code.
- [ ] Uploads work and private files are served through signed URLs.
- [ ] The service-role key is absent from the browser bundle and from client logs.

## 10. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Confirmation link points at `localhost` | `NEXT_PUBLIC_APP_URL` was local at build time | Set the deployed URL in the host and redeploy |
| Link opens the Supabase site or an error page | Redirect URL missing from the allow-list | Add `https://your-domain.com/auth/callback` |
| No reset email | Custom SMTP not enabled, or rate limit reached | Configure SMTP, send a test, check Supabase Auth logs |
| Mail lands in spam | SPF/DKIM/DMARC not aligned | Verify DNS records and the `From` domain |
| Email says “Supabase Auth” | Dashboard templates not updated | Paste the files from `supabase/templates/` |
| Owner cannot open `/admin/platform` | Profile role is not `super_admin` | Run `npm run admin:create` or edit the role as a super admin |
| Password reset email never arrives | SMTP missing or the address has no account | Configure SMTP; the response is intentionally generic |
| Build fails with an invalid public env | A variable is missing or malformed | Check `NEXT_PUBLIC_SUPABASE_URL`, anon key and app URL |

## 11. Security checklist

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never prefix it with `NEXT_PUBLIC_`.
- Rotate the owner password after the first sign-in and keep the super-admin group small.
- Use organization admins for day-to-day tenant work.
- Signups are trusted on first use: accounts are confirmed server-side and signed in immediately, so
  email ownership is not proven. Use verified email if you later need that guarantee.
- Review **Authentication → Users**, the activity log and pending instructor requests regularly.
- Back up the database and test a restore before you need it.
