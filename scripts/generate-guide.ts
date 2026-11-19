/**
 * Generates the Lumina LMS platform guide PDF.
 *
 * Usage: npm run docs:pdf
 * Output: docs/Lumina-LMS-Platform-Guide.pdf
 *
 * The layout engine below is intentionally self-contained: two passes measure
 * the content, record section pages, then draw a cover, a table of contents and
 * the body with page numbering. It uses pdf-lib standard fonts, so no external
 * rendering service or browser is required.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const OUTPUT = path.join(process.cwd(), 'docs', 'Lumina-LMS-Platform-Guide.pdf');
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { top: 64, bottom: 64, left: 54, right: 54 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const BOTTOM_LIMIT = MARGIN.bottom + 18;

const ink = rgb(0.11, 0.13, 0.2);
const muted = rgb(0.42, 0.45, 0.53);
const accent = rgb(0.31, 0.27, 0.83);
const accentSoft = rgb(0.93, 0.93, 0.99);
const surface = rgb(0.965, 0.968, 0.978);
const border = rgb(0.88, 0.89, 0.93);
const white = rgb(1, 1, 1);
const navy = rgb(0.09, 0.11, 0.21);
const gold = rgb(0.79, 0.64, 0.3);

type Align = 'left' | 'right' | 'center';

type Block =
  | { kind: 'h1'; id: string; title: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string; size?: number }
  | { kind: 'lead'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'code'; lines: string[] }
  | { kind: 'callout'; title: string; text: string; tone?: 'accent' | 'warning' | 'success' }
  | { kind: 'table'; headers: string[]; rows: string[][]; widths: number[]; fontSize?: number }
  | { kind: 'spacer'; height: number }
  | { kind: 'pagebreak' };

type Section = { id: string; title: string; page: number };

class Layout {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  draw: boolean;
  sections: Section[] = [];
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  mono: PDFFont;

  private constructor(
    doc: PDFDocument,
    page: PDFPage,
    regular: PDFFont,
    bold: PDFFont,
    italic: PDFFont,
    mono: PDFFont,
    draw: boolean,
  ) {
    this.doc = doc;
    this.page = page;
    this.regular = regular;
    this.bold = bold;
    this.italic = italic;
    this.mono = mono;
    this.draw = draw;
    this.y = PAGE.height - MARGIN.top;
  }

  static async create(draw: boolean) {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
    const mono = await doc.embedFont(StandardFonts.Courier);
    // Reserve the cover and contents pages so body pagination is identical in
    // the measuring and drawing passes, then start the body on its own page.
    for (let index = 0; index < 2; index += 1) doc.addPage([PAGE.width, PAGE.height]);
    const page = doc.addPage([PAGE.width, PAGE.height]);
    return new Layout(doc, page, regular, bold, italic, mono, draw);
  }

  get pages() {
    return this.doc.getPages();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN.top;
  }

  ensure(height: number) {
    if (this.y - height < BOTTOM_LIMIT) this.newPage();
  }

  wrap(text: string, width: number, size: number, font: PDFFont = this.regular) {
    const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push('');
        continue;
      }
      let current = '';
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > width && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  text(value: string, options: {
    x?: number;
    size?: number;
    font?: PDFFont;
    color?: typeof ink;
    align?: Align;
    width?: number;
  } = {}) {
    const size = options.size ?? 10.5;
    if (this.draw) {
      const font = options.font ?? this.regular;
      const color = options.color ?? ink;
      const width = options.width ?? CONTENT_WIDTH;
      const align = options.align ?? 'left';
      let x = options.x ?? MARGIN.left;
      if (align === 'right') x = MARGIN.left + width - font.widthOfTextAtSize(value, size);
      if (align === 'center') x = MARGIN.left + (width - font.widthOfTextAtSize(value, size)) / 2;
      this.page.drawText(value, { x, y: this.y - size, size, font, color });
    }
    this.y -= size;
  }

  gap(height: number) {
    this.y -= height;
  }

  rule(color = border, thickness = 0.7) {
    if (!this.draw) return;
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: MARGIN.left + CONTENT_WIDTH, y: this.y },
      color,
      thickness,
    });
  }

  h1(id: string, title: string) {
    this.ensure(96);
    if (this.y < PAGE.height - MARGIN.top - 4) this.gap(16);
    this.ensure(96);
    this.sections.push({ id, title, page: this.doc.getPageCount() });
    const index = String(this.sections.length).padStart(2, '0');
    if (this.draw) {
      this.page.drawText(`SECTION ${index}`, {
        x: MARGIN.left,
        y: this.y - 8,
        size: 7.5,
        font: this.bold,
        color: accent,
      });
    }
    this.y -= 22;
    this.text(title, { size: 21, font: this.bold, color: ink });
    this.y -= 8;
    if (this.draw) {
      this.page.drawRectangle({ x: MARGIN.left, y: this.y, width: 42, height: 2.6, color: accent });
    }
    this.y -= 16;
  }

  h2(text: string) {
    this.ensure(46);
    this.gap(6);
    this.text(text, { size: 13.5, font: this.bold, color: ink });
    this.gap(5);
  }

  h3(text: string) {
    this.ensure(34);
    this.gap(2);
    this.text(text, { size: 10.5, font: this.bold, color: accent });
    this.gap(2);
  }

  p(text: string, size = 10.5) {
    const lines = this.wrap(text, CONTENT_WIDTH, size);
    for (const line of lines) {
      this.ensure(15);
      this.text(line, { size, color: ink, font: this.regular });
      this.y -= 4.5;
    }
    this.gap(1);
  }

  lead(text: string) {
    const lines = this.wrap(text, CONTENT_WIDTH - 16, 11.2);
    const height = lines.length * 15.2 + 14;
    this.ensure(height);
    if (this.draw) {
      this.page.drawRectangle({
        x: MARGIN.left,
        y: this.y - height + 6,
        width: CONTENT_WIDTH,
        height,
        color: accentSoft,
      });
      this.page.drawRectangle({ x: MARGIN.left, y: this.y - height + 6, width: 3, height, color: accent });
    }
    this.y -= 7;
    for (const line of lines) {
      this.text(line, { x: MARGIN.left + 14, size: 11.2, color: ink, width: CONTENT_WIDTH - 16 });
      this.y -= 4.4;
    }
    this.gap(8);
  }

  bullets(items: string[]) {
    for (const item of items) {
      const lines = this.wrap(item, CONTENT_WIDTH - 16, 10.5);
      this.ensure(lines.length * 15 + 6);
      if (this.draw) {
        this.page.drawCircle({ x: MARGIN.left + 3, y: this.y - 7, size: 1.7, color: accent });
      }
      let first = true;
      for (const line of lines) {
        this.text(line, { x: MARGIN.left + 14, size: 10.5 });
        if (first) {
          first = false;
          this.y -= 4;
        } else {
          this.y -= 4.5;
        }
      }
    }
    this.gap(4);
  }

  steps(items: string[]) {
    items.forEach((item, index) => {
      const lines = this.wrap(item, CONTENT_WIDTH - 26, 10.5);
      const height = lines.length * 15 + 6;
      this.ensure(height);
      if (this.draw) {
        this.page.drawCircle({ x: MARGIN.left + 8, y: this.y - 7.5, size: 8, color: accentSoft });
        const label = String(index + 1);
        this.page.drawText(label, {
          x: MARGIN.left + 8 - this.bold.widthOfTextAtSize(label, 8) / 2,
          y: this.y - 10.2,
          size: 8,
          font: this.bold,
          color: accent,
        });
      }
      for (const line of lines) {
        this.text(line, { x: MARGIN.left + 24, size: 10.5, width: CONTENT_WIDTH - 26 });
        this.y -= 4.5;
      }
      this.gap(3);
    });
    this.gap(2);
  }

  code(lines: string[]) {
    const size = 8.6;
    const wrapped: string[] = [];
    for (const line of lines) {
      const segments = this.wrap(line || ' ', CONTENT_WIDTH - 26, size, this.mono);
      wrapped.push(...segments);
    }
    const height = wrapped.length * 12.4 + 16;
    this.ensure(height);
    if (this.draw) {
      const boxY = this.y - height + 4;
      this.page.drawRectangle({ x: MARGIN.left, y: boxY, width: CONTENT_WIDTH, height, color: surface });
      this.page.drawRectangle({
        x: MARGIN.left,
        y: boxY,
        width: CONTENT_WIDTH,
        height,
        borderColor: border,
        borderWidth: 0.6,
      });
    }
    this.y -= 11;
    for (const line of wrapped) {
      this.text(line, { x: MARGIN.left + 12, size, font: this.mono, color: rgb(0.18, 0.21, 0.31) });
      this.y -= 2.6;
    }
    this.gap(9);
  }

  callout(title: string, body: string, tone: 'accent' | 'warning' | 'success' = 'accent') {
    const palette =
      tone === 'warning'
        ? { fill: rgb(0.99, 0.96, 0.9), bar: rgb(0.78, 0.5, 0.11), label: rgb(0.55, 0.34, 0.05) }
        : tone === 'success'
          ? { fill: rgb(0.93, 0.98, 0.95), bar: rgb(0.04, 0.5, 0.35), label: rgb(0.02, 0.4, 0.28) }
          : { fill: accentSoft, bar: accent, label: accent };
    const bodyLines = this.wrap(body, CONTENT_WIDTH - 30, 10);
    const height = 22 + bodyLines.length * 14 + 8;
    this.ensure(height);
    if (this.draw) {
      this.page.drawRectangle({
        x: MARGIN.left,
        y: this.y - height + 4,
        width: CONTENT_WIDTH,
        height,
        color: palette.fill,
      });
      this.page.drawRectangle({ x: MARGIN.left, y: this.y - height + 4, width: 3, height, color: palette.bar });
    }
    this.y -= 6;
    this.text(title, { x: MARGIN.left + 14, size: 9.6, font: this.bold, color: palette.label });
    this.y -= 2;
    for (const line of bodyLines) {
      this.text(line, { x: MARGIN.left + 14, size: 10, color: ink, width: CONTENT_WIDTH - 30 });
      this.y -= 4;
    }
    this.gap(9);
  }

  table(headers: string[], rows: string[][], widths: number[], fontSize = 8.8) {
    const scale = CONTENT_WIDTH / widths.reduce((sum, width) => sum + width, 0);
    const columns = widths.map((width) => width * scale);
    const padding = 5;
    const lineHeight = 11.4;

    const layoutRow = (cells: string[], font: PDFFont) =>
      cells.map((cell, index) => this.wrap(cell, (columns[index] ?? 0) - padding * 2, fontSize, font));

    const headerLines = layoutRow(headers, this.bold);
    const headerHeight = Math.max(...headerLines.map((lines) => lines.length)) * lineHeight + padding * 2;

    const drawHeader = () => {
      const height = headerHeight;
      if (this.draw) {
        this.page.drawRectangle({
          x: MARGIN.left,
          y: this.y - height,
          width: CONTENT_WIDTH,
          height,
          color: accent,
        });
        let x = MARGIN.left;
        headerLines.forEach((lines, index) => {
          lines.forEach((line, lineIndex) => {
            this.page.drawText(line, {
              x: x + padding,
              y: this.y - padding - fontSize - lineIndex * lineHeight,
              size: fontSize,
              font: this.bold,
              color: white,
            });
          });
          x += columns[index] ?? 0;
        });
      }
      this.y -= height;
    };

    this.ensure(headerHeight + 40);
    drawHeader();

    rows.forEach((row, rowIndex) => {
      const cells = layoutRow(row, this.regular);
      const height = Math.max(...cells.map((lines) => lines.length)) * lineHeight + padding * 2;
      if (this.y - height < BOTTOM_LIMIT) {
        this.newPage();
        drawHeader();
      }
      if (this.draw) {
        if (rowIndex % 2 === 1) {
          this.page.drawRectangle({
            x: MARGIN.left,
            y: this.y - height,
            width: CONTENT_WIDTH,
            height,
            color: rgb(0.975, 0.977, 0.985),
          });
        }
        this.page.drawLine({
          start: { x: MARGIN.left, y: this.y - height },
          end: { x: MARGIN.left + CONTENT_WIDTH, y: this.y - height },
          color: border,
          thickness: 0.5,
        });
        let x = MARGIN.left;
        cells.forEach((lines, index) => {
          lines.forEach((line, lineIndex) => {
            this.page.drawText(line, {
              x: x + padding,
              y: this.y - padding - fontSize - lineIndex * lineHeight,
              size: fontSize,
              font: this.regular,
              color: ink,
            });
          });
          x += columns[index] ?? 0;
        });
      }
      this.y -= height;
    });

    this.gap(10);
  }

  render(blocks: Block[]) {
    for (const block of blocks) {
      switch (block.kind) {
        case 'h1':
          this.h1(block.id, block.title);
          break;
        case 'h2':
          this.h2(block.text);
          break;
        case 'h3':
          this.h3(block.text);
          break;
        case 'p':
          this.p(block.text, block.size);
          break;
        case 'lead':
          this.lead(block.text);
          break;
        case 'bullets':
          this.bullets(block.items);
          break;
        case 'steps':
          this.steps(block.items);
          break;
        case 'code':
          this.code(block.lines);
          break;
        case 'callout':
          this.callout(block.title, block.text, block.tone);
          break;
        case 'table':
          this.table(block.headers, block.rows, block.widths, block.fontSize);
          break;
        case 'spacer':
          this.gap(block.height);
          break;
        case 'pagebreak':
          this.newPage();
          break;
      }
    }
  }
}

const DEMO_ACCOUNTS: [string, string, string][] = [
  ['super@lumina.test', 'Platform owner (super admin)', 'Sage Whitfield'],
  ['admin@lumina.test', 'Organization admin, Lumina Academy', 'Priya Raman'],
  ['admin@northstar.test', 'Organization admin, Northstar Institute', 'Marcus Bell'],
  ['maya@lumina.test', 'Instructor, Lumina Academy', 'Maya Chen'],
  ['leo@lumina.test', 'Instructor, Lumina Academy', 'Leo Martins'],
  ['nina@northstar.test', 'Instructor, Northstar Institute', 'Nina Patel'],
  ['student@lumina.test', 'Student with a completed course', 'Amara Okafor'],
  ['diego@lumina.test', 'Student in progress', 'Diego Alvarez'],
  ['sofia@lumina.test', 'Student with a pending instructor request', 'Sofia Rossi'],
  ['student@northstar.test', 'Student in the second tenant', 'Noah Kim'],
];

function content(): Block[] {
  return [
    {
      kind: 'h1',
      id: 'overview',
      title: 'Platform at a glance',
    },
    {
      kind: 'lead',
      text: 'Lumina is a multi-tenant learning platform: one deployment serves many organizations while keeping every tenant, course, submission and certificate isolated.',
    },
    {
      kind: 'p',
      text: 'People work in four roles. Learners browse a private or public catalog, enroll, work through lessons, take quizzes and submit assignments. Instructors build the curriculum. Organization admins run everything inside their tenant. The platform owner sees every tenant, reviews teaching requests and manages access across the entire installation.',
    },
    {
      kind: 'table',
      headers: ['Role', 'Scope', 'Primary responsibilities'],
      rows: [
        ['Platform owner (super admin)', 'Every tenant', 'Cross-tenant insights, tenant setup, platform settings, access changes, teaching approvals'],
        ['Organization admin', 'One or more organizations', 'People, branding, categories, courses, enrollments, analytics, teaching approvals'],
        ['Instructor', 'Courses they manage', 'Course builder, lessons, quizzes, assignments, grading, course analytics'],
        ['Student', 'Their own learning', 'Catalog, enrollment, lessons, assessments, certificates, notifications'],
      ],
      widths: [1.35, 1.15, 2.6],
    },
    { kind: 'h2', text: 'Core concepts' },
    {
      kind: 'bullets',
      items: [
        'Organization: the tenant root. Every category, course, enrollment, submission and certificate carries an organization id.',
        'Profile and membership: a profile holds the primary role used for routing; organization_members holds the tenant role used for permissions. A person can belong to more than one organization.',
        'Course lifecycle: draft, published, archived. Only published courses appear in the public catalog; students only see content they are allowed to access.',
        'Lesson types: video, text, PDF, resource, quiz and assignment. Lessons can be previewed before enrollment when marked as previews.',
        'Enrollment: created through a protected server function. Organizations can require admin approval before learning starts.',
        'Certificates: issued automatically when every published lesson is complete, with a public verification page and a downloadable PDF.',
      ],
    },
    {
      kind: 'callout',
      title: 'Tenant isolation is enforced in the database',
      tone: 'success',
      text: 'Row Level Security policies, security-definer predicates and privilege-escalation triggers enforce access even if someone calls the API directly with the public anon key. The browser never receives the service-role key.',
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'start', title: 'Get started locally' },
    { kind: 'p', text: 'The project is a single Next.js application with a local Supabase stack (Postgres, Auth and Storage) running in Docker.' },
    { kind: 'h2', text: 'Prerequisites' },
    {
      kind: 'bullets',
      items: [
        'Node.js 20.9 or newer and npm 10 or newer.',
        'Docker Desktop, running.',
        'Supabase CLI available through npx (no global install required).',
      ],
    },
    { kind: 'h2', text: 'First run' },
    {
      kind: 'code',
      lines: [
        'npm install',
        'npx supabase start',
        'cp .env.example .env.local',
        'npx supabase db reset',
        'npm run db:seed',
        'npm run dev',
      ],
    },
    {
      kind: 'p',
      text: 'Copy the API URL, anon key and service-role key printed by supabase status into .env.local. The application runs at http://localhost:3000. The local stack also exposes Supabase Studio at http://127.0.0.1:54323 and Mailpit, a local inbox, at http://127.0.0.1:54324.',
    },
    {
      kind: 'callout',
      title: 'Demo data is disposable',
      text: 'supabase db reset recreates the database from migrations. npm run db:seed then creates the demo organizations, users, courses and assessments. Re-run both whenever you want a clean slate.',
    },
    { kind: 'h2', text: 'Local service URLs' },
    {
      kind: 'table',
      headers: ['Service', 'URL', 'Notes'],
      rows: [
        ['Application', 'http://localhost:3000', 'The Next.js app in development'],
        ['Supabase API', 'http://127.0.0.1:54321', 'Auth, REST and Storage gateway'],
        ['Database', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres', 'Local Postgres'],
        ['Supabase Studio', 'http://127.0.0.1:54323', 'Tables, SQL, auth users'],
        ['Mailpit', 'http://127.0.0.1:54324', 'Captured confirmation and reset emails'],
      ],
      widths: [1.1, 2.5, 2.5],
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'owner', title: 'The platform owner account' },
    {
      kind: 'lead',
      text: 'A platform owner is a profile with the super_admin role. Only this role can open Platform control, see every tenant and grant platform-level access. Public registration can never create one.',
    },
    { kind: 'h2', text: 'Local demo owner' },
    {
      kind: 'p',
      text: 'After npm run db:seed, sign in with super@lumina.test and the demo password Passw0rd!. This account owns the local installation and can open /admin/platform immediately.',
    },
    {
      kind: 'table',
      headers: ['Field', 'Value'],
      rows: [
        ['Sign-in page', 'http://localhost:3000/login'],
        ['Email', 'super@lumina.test'],
        ['Password', 'Passw0rd! (or SEED_PASSWORD from .env.local)'],
        ['Landing page', '/admin'],
        ['Platform control', '/admin/platform'],
      ],
      widths: [1.4, 4],
    },
    { kind: 'h2', text: 'Create the owner for a real deployment' },
    { kind: 'p', text: 'Use the bootstrap script. It creates or updates the auth user, promotes the profile, ensures an organization membership and writes an audit entry. Run it from the project root with production environment values available.' },
    {
      kind: 'code',
      lines: [
        'npm run admin:create -- owner@example.com "Platform Owner" "S3curePass!" lumina-academy',
        '',
        '# Password and organization slug are optional:',
        'npm run admin:create -- owner@example.com',
      ],
    },
    {
      kind: 'p',
      text: 'The script uses the service-role key and therefore must run in a trusted terminal, never in the browser. Omit the password to have a strong one generated and printed once. Omit the slug to use the first active organization. Running the command again for the same email resets the password and re-applies super-admin access, which makes it a safe recovery tool.',
    },
    { kind: 'h2', text: 'Promote an existing account in the UI' },
    {
      kind: 'steps',
      items: [
        'Sign in as an existing platform owner.',
        'Open Admin, then Users.',
        'Choose Add user, or Edit on an existing person.',
        'Select Platform administrator as the role and save.',
      ],
    },
    {
      kind: 'p',
      text: 'The role picker only offers Platform administrator to super admins. Organization admins cannot grant or create that role, and the server action rejects the attempt even if the request is forged.',
    },
    {
      kind: 'callout',
      title: 'Direct SQL needs care',
      tone: 'warning',
      text: 'A trigger protects role, status, email, default organization and verification fields from user-scoped writes. If SQL is your only option, run the update with the service role, or temporarily disable the profiles_protect_privileges trigger in a transaction and re-enable it immediately. Afterwards make sure the person has an org_admin membership in their default organization.',
    },
    { kind: 'h2', text: 'Owner hygiene' },
    {
      kind: 'bullets',
      items: [
        'Use a unique, long password and change the bootstrap password after the first sign-in.',
        'Keep the super-admin group small; use organization admins for day-to-day tenant work.',
        'Review the activity log and the recent-accounts list on Platform control regularly.',
        'Never share the service-role key. It bypasses Row Level Security and must only exist in server-side environment settings.',
      ],
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'platform', title: 'Platform control dashboard' },
    { kind: 'p', text: 'Open /admin/platform from the Platform item in the admin sidebar, or from the Platform button on the admin dashboard. The route calls requireSuperAdmin: organization admins are redirected to /admin.' },
    { kind: 'h2', text: 'What the page shows' },
    {
      kind: 'bullets',
      items: [
        'Headline metrics: organizations and active tenants, total people, published courses, and the platform-wide completion rate.',
        'Growth chart: new accounts and enrollments over the last six months.',
        'People by role: students, instructors, organization admins and platform admins, plus grading rate and certificates issued.',
        'Tenants table: members, courses and live courses, enrollments and completion percentage for every organization, with a shortcut to that tenant’s people.',
        'Access management: the ten most recent accounts with inline role, organization and status editing.',
        'Permission model: a read-only matrix of what each role can do.',
        'Instructor requests: pending teaching applications from every tenant, with Approve and Reject actions.',
      ],
    },
    { kind: 'h2', text: 'Change someone’s permissions' },
    {
      kind: 'steps',
      items: [
        'Find the person in Access management, or open Admin, Users for the full searchable list.',
        'Choose Edit to open the account dialog.',
        'Change the role, organization or status, then save.',
        'The change applies immediately, is checked again on the server, and is written to the activity log.',
      ],
    },
    {
      kind: 'p',
      text: 'Promoting someone to instructor unlocks the course builder, grading and student tables. Promoting to organization admin adds tenant-wide people, branding and course management. Platform administrator is reserved for super admins and grants every tenant.',
    },
    { kind: 'h2', text: 'Approve a teaching request' },
    {
      kind: 'p',
      text: 'Requests appear on both Platform control and Admin, Users. Approving promotes the applicant to instructor, updates their membership, sends them a notification and records who approved the request and when. Rejecting keeps them as a student and lets them submit a better request later. A pending request is unique per person, and applicants cannot approve themselves.',
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'orgadmin', title: 'Organization administration' },
    { kind: 'p', text: 'Organization admins manage one tenant boundary. Their dashboard aggregates real data from that organization only; RLS makes cross-tenant reads impossible.' },
    { kind: 'h2', text: 'People and access' },
    {
      kind: 'bullets',
      items: [
        'Create verified accounts with a starting role and organization; the person can reset their password after signing in.',
        'Search, filter by role or status, and page through the user list.',
        'Edit roles, organizations and account status. Suspended accounts cannot use the platform.',
        'Review pending instructor requests in the highlighted card at the top of Users.',
      ],
    },
    { kind: 'h2', text: 'Catalog and enrollment' },
    {
      kind: 'bullets',
      items: [
        'Create categories with a color, then group courses for easier discovery.',
        'Create courses, assign an instructor, and publish when the curriculum is ready.',
        'Manage enrollments: approve, reject, cancel or review progress and completion.',
        'Decide whether new enrollments need approval in the platform settings (require_enrollment_approval).',
      ],
    },
    { kind: 'h2', text: 'Branding and insights' },
    {
      kind: 'bullets',
      items: [
        'Organization name, description, logo, website and primary color are used across the tenant experience.',
        'Analytics show enrollment trends, completion, active learners, popular courses and category mix.',
        'Activity logs record administrative actions for review.',
      ],
    },
    {
      kind: 'callout',
      title: 'Stay inside your boundary',
      tone: 'warning',
      text: 'Organization admins see and change only their own organizations. Attempts to read another tenant through filters, ids or direct API calls return no rows.',
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'teaching', title: 'Teaching and course building' },
    { kind: 'p', text: 'Instructors get a focused workspace for the courses they manage. Teaching access is granted by approval, never by public signup.' },
    { kind: 'h2', text: 'Build a course' },
    {
      kind: 'steps',
      items: [
        'Open Instructor, then Courses, and create a course with a title, summary, difficulty and category.',
        'Add sections to structure the curriculum, then add lessons and reorder them.',
        'Choose a lesson type: video, rich text, PDF, resource link, quiz or assignment.',
        'Upload thumbnails and lesson resources; private media is served through authorized, signed access.',
        'Publish the course when it is ready. Drafts stay invisible to learners.',
      ],
    },
    { kind: 'h2', text: 'Quizzes and assignments' },
    {
      kind: 'bullets',
      items: [
        'Quiz questions support single choice, multiple choice, true or false and short answer, with points and accepted answers.',
        'Answer keys are never sent to students. Attempts are created and graded by server-side functions, with attempt limits, time limits and optional randomization.',
        'Assignments support instructions, due dates, maximum points and a grading rubric.',
        'Students submit text and/or a private file. Instructors grade, leave feedback and return work; grade fields are protected from student changes.',
      ],
    },
    { kind: 'h2', text: 'Monitor learners' },
    {
      kind: 'bullets',
      items: [
        'The students table shows progress, enrollment status and recent activity for your courses.',
        'Course analytics cover enrollment, completion, lesson progress, quiz performance and grading load.',
        'Notifications keep learners informed about deadlines, grades, feedback and completions.',
      ],
    },
    { kind: 'h2', text: 'Becoming an instructor' },
    {
      kind: 'p',
      text: 'Anyone can register and choose Teach, or open Teach on Lumina from the student sidebar later. The account stays a student until an organization or platform admin approves the request. Approved instructors immediately get the instructor dashboard and a notification.',
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'learning', title: 'The learning experience' },
    { kind: 'p', text: 'Students get a clean catalog and a distraction-free player. Everything is scoped to their own enrollments and progress.' },
    { kind: 'h2', text: 'Discover and enroll' },
    {
      kind: 'bullets',
      items: [
        'Browse the catalog with search, category and difficulty filters plus pagination.',
        'Open a course page to see the curriculum, instructor, outcomes and previews.',
        'Enroll in one click; if the organization requires approval, the request is queued for an admin.',
        'Preview lessons are available before enrollment when the instructor marks them.',
      ],
    },
    { kind: 'h2', text: 'Learn and prove it' },
    {
      kind: 'bullets',
      items: [
        'Work through video, text, PDF and resource lessons; progress is saved automatically.',
        'Take quizzes inside the player with a timer, attempt history and instant server-graded results.',
        'Submit assignments with rich text and files, then read instructor feedback and grades.',
        'Complete every published lesson to finish the course and receive a certificate automatically.',
        'Download the certificate PDF or share its public verification link from the Certificates page.',
        'Manage notifications, profile details and password from the student area.',
      ],
    },
    { kind: 'h2', text: 'Verify a certificate' },
    { kind: 'p', text: 'The public /verify page accepts a certificate code and returns only the fields needed to confirm authenticity: student, course, organization, issue date and status. Verification never exposes private account data.' },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'security', title: 'Roles, permissions and security' },
    { kind: 'h2', text: 'What each role can do' },
    {
      kind: 'table',
      headers: ['Capability', 'Owner', 'Org admin', 'Instructor', 'Student'],
      rows: [
        ['All tenants, platform settings, platform roles', 'Yes', '-', '-', '-'],
        ['Organization people, branding, categories, enrollments', 'Yes', 'Yes', '-', '-'],
        ['Course builder, lessons, quizzes, assignments, grading', 'Yes', 'Yes', 'Yes', '-'],
        ['Instructor request approvals', 'Yes', 'Yes', '-', '-'],
        ['Learning, submissions and certificates', 'Yes', 'Yes', 'Yes', 'Yes'],
      ],
      widths: [3.2, 0.9, 1, 1, 0.9],
      fontSize: 8.3,
    },
    { kind: 'h2', text: 'How access is enforced' },
    {
      kind: 'bullets',
      items: [
        'Postgres Row Level Security is enabled on every table. Policies call security-definer predicates with an empty search_path, so checks cannot be bypassed or recursively altered.',
        'Public signup always creates a student. A trigger blocks user-scoped changes to role, status, email, default organization and verification.',
        'The service-role key lives only in server-side code. It is never imported by a client component and never sent to the browser.',
        'Quiz questions, options and answer keys are manager-only; students receive sanitized payloads and grading happens in the database.',
        'Course media and submissions are private buckets with no direct policies; downloads are signed by authorized routes after an ownership check.',
        'Every administrative mutation is authorized twice: in the server action and again in Postgres.',
        'Activity logs record privileged actions for review.',
      ],
    },
    {
      kind: 'callout',
      title: 'Teacher access is a request, not a role',
      tone: 'success',
      text: 'The instructor_requests table accepts only a pending request from an active student for their own organization. There are no user update or delete policies, so nobody can approve themselves. Only trusted server code, after an admin scope check, can grant the role.',
    },
    { kind: 'h2', text: 'Multi-tenant model' },
    {
      kind: 'p',
      text: 'Each organization is a tenant. Profiles carry a primary role for routing, while organization_members is the authoritative per-tenant membership. Super admins have an explicit policy branch that spans tenants; everyone else is limited to organizations they belong to.',
    },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'operations', title: 'Operations, testing and deployment' },
    { kind: 'h2', text: 'Everyday commands' },
    {
      kind: 'table',
      headers: ['Command', 'Purpose'],
      rows: [
        ['npm run dev', 'Start Next.js on port 3000'],
        ['npm run build / npm start', 'Production build and server'],
        ['npm run lint / npm run typecheck', 'Static quality gates'],
        ['npm test', 'Vitest unit and integration tests'],
        ['npm run test:e2e', 'Playwright journeys (starts the dev server when needed)'],
        ['npm run verify:rls', 'Live tenant, role and storage isolation checks'],
        ['npm run db:reset', 'Recreate the local database from migrations'],
        ['npm run db:seed', 'Create demo data, storage compatibility and accounts'],
        ['npm run db:types', 'Regenerate Supabase TypeScript types'],
        ['npm run admin:create -- ...', 'Create or promote the platform owner'],
        ['npm run docs:pdf', 'Regenerate this guide'],
      ],
      widths: [2.2, 4.1],
      fontSize: 8.5,
    },
    { kind: 'h2', text: 'Verification' },
    {
      kind: 'p',
      text: 'Run npm run db:reset and npm run db:seed before the live checks. The RLS script signs in as real demo accounts and proves anonymous blocking, tenant isolation, quiz secrecy, privilege-escalation protection, instructor-request isolation and storage rules. E2E uses http://127.0.0.1:3000; the Next dev origin allow-list includes 127.0.0.1 and localhost so client components hydrate in tests.',
    },
    { kind: 'h2', text: 'Branded authentication email' },
    {
      kind: 'p',
      text: 'Supabase Auth sends signup and password-reset messages; the hosting provider does not. Configure custom SMTP with a verified sending domain and paste the templates in supabase/templates into Authentication, Emails, Templates. The templates use token_hash links, which the app verifies at /auth/callback, so confirmation works even when the message is opened on another device.',
    },
    {
      kind: 'bullets',
      items: [
        'Set NEXT_PUBLIC_APP_URL to the deployed domain and mirror it in the Auth Site URL and redirect allow-list; add /auth/callback explicitly.',
        'Send as a domain address such as no-reply@your-domain.com and publish SPF, DKIM and DMARC records so mail is not marked as spam.',
        'Keep Confirm email enabled for public deployments. AUTO_CONFIRM_SIGNUPS=true skips the email for demos but does not verify address ownership.',
        'After confirmation the person returns to /login with a confirmed notice, or straight to the dashboard when the browser already holds a session.',
      ],
    },
    { kind: 'h2', text: 'Deployment checklist' },
    {
      kind: 'steps',
      items: [
        'Create a Supabase project and link it with supabase link.',
        'Push the migrations with supabase db push. Never edit production tables by hand.',
        'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_APP_URL in the hosting provider.',
        'Set the Auth site URL and redirect allow-list to your real domain, configure custom SMTP and apply the branded templates.',
        'Run the owner bootstrap once, then sign in and confirm Platform control loads.',
        'Build and start the app, then smoke-test: register, confirmation, teacher request, approval, enrollment, lesson progress, quiz, assignment, certificate and public verification.',
      ],
    },
    { kind: 'h2', text: 'Troubleshooting' },
    {
      kind: 'table',
      headers: ['Symptom', 'Fix'],
      rows: [
        ['Registration says signups are disabled', 'Enable allow_signups in platform settings.'],
        ['Confirmation email never arrives', 'Local: open Mailpit. Hosted: verify custom SMTP, the sender domain and the Auth email log.'],
        ['Uploads fail after a fresh start', 'Run npm run db:seed or npm run db:compat to apply the storage compatibility index.'],
        ['A page renders but buttons do nothing in tests', 'Next 16 blocks cross-origin dev resources; keep 127.0.0.1 and localhost in allowedDevOrigins.'],
        ['Port 3000 is already in use', 'Stop the other process or run Playwright with PLAYWRIGHT_PORT.'],
        ['Demo data is inconsistent', 'Run npm run db:reset then npm run db:seed.'],
        ['A super admin cannot be created', 'Use npm run admin:create; direct profile updates are trigger-protected.'],
      ],
      widths: [2.4, 4],
      fontSize: 8.4,
    },
    { kind: 'callout', title: 'Operational basics', text: 'Take regular Supabase backups, keep the service-role key out of client bundles and logs, rotate owner credentials, and review the activity log and pending instructor requests weekly.' },

    { kind: 'pagebreak' },

    { kind: 'h1', id: 'reference', title: 'Quick reference' },
    { kind: 'h2', text: 'Demo accounts' },
    {
      kind: 'p',
      text: 'All demo accounts use the seed password Passw0rd! unless SEED_PASSWORD is set differently in .env.local.',
    },
    {
      kind: 'table',
      headers: ['Email', 'Role / purpose', 'Name'],
      rows: DEMO_ACCOUNTS,
      widths: [2.5, 3.1, 1.6],
      fontSize: 8.2,
    },
    { kind: 'h2', text: 'Key routes' },
    {
      kind: 'table',
      headers: ['Route', 'Audience'],
      rows: [
        ['/', 'Public landing page'],
        ['/courses, /courses/[slug]', 'Public catalog and course details'],
        ['/login, /register, /verify', 'Authentication, teacher request signup, certificate verification'],
        ['/admin', 'Admin dashboard'],
        ['/admin/platform', 'Platform owner insights and access management'],
        ['/admin/users, /admin/courses, /admin/organizations', 'People, catalog and tenant management'],
        ['/instructor, /instructor/courses/[id]', 'Teaching dashboard and course builder'],
        ['/student, /student/my-courses, /student/assignments', 'Learning dashboard, courses and assessments'],
        ['/student/become-instructor', 'Request teaching access and track its status'],
        ['/learn/[slug]/[lessonId]', 'Lesson player, quizzes and submissions'],
      ],
      widths: [2.9, 3.4],
      fontSize: 8.4,
    },
    { kind: 'h2', text: 'Where to look next' },
    {
      kind: 'bullets',
      items: [
        'README.md: setup, architecture summary, scripts and deployment checklist.',
        'DEPLOYMENT.md: hosted Supabase, Vercel, owner recovery, SMTP, DNS and confirmation links.',
        'PROJECT_ARCHITECTURE.md: stack decisions, directory layout, authorization layers and data flow.',
        'DATABASE_SCHEMA.md: tables, functions, RLS policy map, storage and migrations.',
        'IMPLEMENTATION_PLAN.md: delivered phases and recorded verification results.',
      ],
    },
    {
      kind: 'callout',
      title: 'A safe default',
      text: 'When in doubt, grant the smallest role that does the job and let the instructor-request workflow handle teaching access. Organization admins can run a tenant without platform-wide access, and platform ownership should stay with a small, reviewed group.',
      tone: 'success',
    },
  ];
}

function drawCover(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
  const page = doc.getPages()[0];
  if (!page) return;
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: 0, width, height, color: navy });
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.16, 0.15, 0.42), opacity: 0.24 });
  page.drawEllipse({
    x: width - 60,
    y: height - 80,
    xScale: 210,
    yScale: 140,
    color: accent,
    opacity: 0.28,
  });
  page.drawEllipse({ x: 70, y: 90, xScale: 160, yScale: 100, color: accent, opacity: 0.18 });
  page.drawRectangle({ x: 0, y: height - 6, width, height: 6, color: gold });

  page.drawText('LUMINA', { x: 54, y: height - 82, size: 11, font: bold, color: gold });
  page.drawText('LMS', { x: 112, y: height - 82, size: 11, font: bold, color: rgb(0.7, 0.72, 0.85) });

  page.drawText('Platform &', { x: 54, y: height - 210, size: 44, font: bold, color: white });
  page.drawText('User Guide', { x: 54, y: height - 262, size: 44, font: bold, color: white });
  page.drawLine({ start: { x: 54, y: height - 286 }, end: { x: 154, y: height - 286 }, color: gold, thickness: 2.5 });

  const subtitle = [
    'Set up, run and grow a multi-tenant',
    'learning platform with confidence.',
  ];
  subtitle.forEach((line, index) => {
    page.drawText(line, { x: 54, y: height - 330 - index * 24, size: 14, font: regular, color: rgb(0.79, 0.81, 0.9) });
  });

const meta: [string, string][] = [
  ['Edition', 'Version 1.0'],
  ['Audience', 'Platform owners, admins, instructors'],
  ['Stack', 'Next.js 16, Supabase, Postgres RLS'],
];

meta.forEach(([label, value], index) => {
  const y = 252 - index * 46;

  page.drawText(label.toUpperCase(), {
    x: 54,
    y,
    size: 7.5,
    font: bold,
    color: rgb(0.55, 0.58, 0.72),
  });

  page.drawText(value, {
    x: 54,
    y: y - 17,
    size: 10.5,
    font: regular,
    color: white,
  });
});

  page.drawLine({ start: { x: 54, y: 118 }, end: { x: width - 54, y: 118 }, color: rgb(0.3, 0.32, 0.48), thickness: 0.7 });
  page.drawText('Lumina LMS', { x: 54, y: 96, size: 9, font: bold, color: rgb(0.72, 0.74, 0.86) });
  page.drawText('November 2026', {
    x: width - 54 - regular.widthOfTextAtSize('November 2026', 9),
    y: 96,
    size: 9,
    font: regular,
    color: rgb(0.72, 0.74, 0.86),
  });
}

function drawContents(
  doc: PDFDocument,
  sections: Section[],
  regular: PDFFont,
  bold: PDFFont,
  italic: PDFFont,
) {
  const page = doc.getPages()[1];
  if (!page) return;

  page.drawText('CONTENTS', { x: MARGIN.left, y: PAGE.height - MARGIN.top - 8, size: 8, font: bold, color: accent });
  page.drawText('What is inside', { x: MARGIN.left, y: PAGE.height - MARGIN.top - 48, size: 26, font: bold, color: ink });
  page.drawText('A practical tour of every role, from the first sign-in to platform-wide operations.', {
    x: MARGIN.left,
    y: PAGE.height - MARGIN.top - 72,
    size: 10.5,
    font: regular,
    color: muted,
  });
  page.drawLine({
    start: { x: MARGIN.left, y: PAGE.height - MARGIN.top - 92 },
    end: { x: MARGIN.left + CONTENT_WIDTH, y: PAGE.height - MARGIN.top - 92 },
    color: border,
    thickness: 0.8,
  });

  let y = PAGE.height - MARGIN.top - 132;
  sections.forEach((section, index) => {
    const number = String(index + 1).padStart(2, '0');
    page.drawText(number, { x: MARGIN.left, y, size: 10, font: bold, color: accent });
    page.drawText(section.title, { x: MARGIN.left + 34, y, size: 11, font: bold, color: ink });

    const titleWidth = bold.widthOfTextAtSize(section.title, 11);
    const lineStart = MARGIN.left + 34 + titleWidth + 10;
    const lineEnd = MARGIN.left + CONTENT_WIDTH - 24;
    if (lineEnd > lineStart) {
      page.drawLine({ start: { x: lineStart, y: y + 3 }, end: { x: lineEnd, y: y + 3 }, color: rgb(0.85, 0.86, 0.9), thickness: 0.6 });
    }
    const pageLabel = String(section.page);
    page.drawText(pageLabel, {
      x: MARGIN.left + CONTENT_WIDTH - regular.widthOfTextAtSize(pageLabel, 10),
      y,
      size: 10,
      font: regular,
      color: muted,
    });
    y -= 34;
  });

  const noteY = 150;
  page.drawRectangle({ x: MARGIN.left, y: noteY - 74, width: CONTENT_WIDTH, height: 88, color: surface });
  page.drawText('HOW TO USE THIS GUIDE', { x: MARGIN.left + 16, y: noteY + 4, size: 7.5, font: bold, color: accent });
  const note = [
    'Start with the platform owner section to secure the installation, then share the',
    'organization, teaching and learning sections with the people who need them. The',
    'quick reference at the end lists every demo account, route and command.',
  ];
  note.forEach((line, index) => {
    page.drawText(line, { x: MARGIN.left + 16, y: noteY - 18 - index * 14, size: 9.4, font: regular, color: ink });
  });
  page.drawText('Generated from the codebase; keep it in step with product changes.', {
    x: MARGIN.left + 16,
    y: noteY - 64,
    size: 8,
    font: italic,
    color: muted,
  });
}

function drawFooters(doc: PDFDocument, regular: PDFFont) {
  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((page, index) => {
    if (index === 0) return;
    page.drawLine({
      start: { x: MARGIN.left, y: 48 },
      end: { x: PAGE.width - MARGIN.right, y: 48 },
      color: border,
      thickness: 0.6,
    });
    page.drawText('Lumina LMS  /  Platform & User Guide', { x: MARGIN.left, y: 34, size: 7.6, font: regular, color: muted });
    const label = `${index + 1} / ${total}`;
    page.drawText(label, {
      x: PAGE.width - MARGIN.right - regular.widthOfTextAtSize(label, 7.6),
      y: 34,
      size: 7.6,
      font: regular,
      color: muted,
    });
  });
}

async function main() {
  const blocks = content();

  // Pass 1: measure pagination and record where each section starts.
  const measure = await Layout.create(false);
  measure.render(blocks);
  const sections = measure.sections;

  // Pass 2: draw the document with a real table of contents.
  const draw = await Layout.create(true);
  drawCover(draw.doc, draw.regular, draw.bold);
  drawContents(draw.doc, sections, draw.regular, draw.bold, draw.italic);
  draw.render(blocks);
  drawFooters(draw.doc, draw.regular);

  draw.doc.setTitle('Lumina LMS - Platform & User Guide');
  draw.doc.setAuthor('Lumina LMS');
  draw.doc.setSubject('Setup, administration, teaching and learning guide');
  draw.doc.setKeywords(['LMS', 'Supabase', 'Next.js', 'multi-tenant', 'guide']);
  draw.doc.setCreator('Lumina LMS');

  const bytes = await draw.doc.save();
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, bytes);

  console.log(`Guide written to ${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`  Pages: ${draw.doc.getPageCount()}`);
  console.log(`  Size: ${(bytes.byteLength / 1024).toFixed(0)} KB`);
  sections.forEach((section, index) => {
    console.log(`  ${String(index + 1).padStart(2, '0')}. ${section.title} - page ${section.page}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
