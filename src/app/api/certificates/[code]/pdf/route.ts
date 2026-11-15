import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { verifyCertificate } from '@/features/student/queries';
import { absoluteUrl, formatDate } from '@/lib/utils';

export const runtime = 'nodejs';

function wrapText(text: string, maxWidth: number, font: { widthOfTextAtSize: (text: string, size: number) => number }, size: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await verifyCertificate(decodeURIComponent(code));
  if (!certificate) {
    return new Response('Certificate not found', { status: 404 });
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const ink = rgb(0.12, 0.14, 0.2);
  const muted = rgb(0.42, 0.45, 0.52);
  const accent = rgb(0.35, 0.31, 0.85);
  const gold = rgb(0.72, 0.54, 0.18);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.99, 0.985) });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: gold, borderWidth: 1.5 });
  page.drawRectangle({ x: 36, y: 36, width: width - 72, height: height - 72, borderColor: rgb(0.85, 0.86, 0.9), borderWidth: 0.5 });
  page.drawCircle({ x: width / 2, y: height - 92, size: 22, color: rgb(0.98, 0.95, 0.86) });
  page.drawText('LUMINA', { x: width / 2 - bold.widthOfTextAtSize('LUMINA', 12) / 2, y: height - 96, size: 12, font: bold, color: gold });

  const title = 'CERTIFICATE OF COMPLETION';
  page.drawText(title, {
    x: (width - regular.widthOfTextAtSize(title, 10)) / 2,
    y: height - 135,
    size: 10,
    font: regular,
    color: muted,
  });

  const intro = 'This certifies that';
  page.drawText(intro, {
    x: (width - italic.widthOfTextAtSize(intro, 12)) / 2,
    y: height - 180,
    size: 12,
    font: italic,
    color: muted,
  });

  const nameSize = certificate.student_name.length > 34 ? 24 : 32;
  page.drawText(certificate.student_name, {
    x: Math.max(40, (width - bold.widthOfTextAtSize(certificate.student_name, nameSize)) / 2),
    y: height - 225,
    size: nameSize,
    font: bold,
    color: ink,
  });

  const completed = 'has successfully completed';
  page.drawText(completed, {
    x: (width - regular.widthOfTextAtSize(completed, 11)) / 2,
    y: height - 260,
    size: 11,
    font: regular,
    color: muted,
  });

  const courseLines = wrapText(certificate.course_title, width - 180, bold, 18);
  courseLines.slice(0, 2).forEach((line, index) => {
    page.drawText(line, {
      x: (width - bold.widthOfTextAtSize(line, 18)) / 2,
      y: height - 295 - index * 24,
      size: 18,
      font: bold,
      color: accent,
    });
  });

  const orgLine = `Issued by ${certificate.org_name}`;
  page.drawText(orgLine, {
    x: (width - regular.widthOfTextAtSize(orgLine, 10)) / 2,
    y: height - 355,
    size: 10,
    font: regular,
    color: muted,
  });

  page.drawLine({ start: { x: 120, y: 150 }, end: { x: 330, y: 150 }, color: rgb(0.78, 0.79, 0.83), thickness: 0.7 });
  page.drawText(certificate.instructor_name, { x: 120, y: 132, size: 10, font: bold, color: ink });
  page.drawText('Instructor', { x: 120, y: 118, size: 8, font: regular, color: muted });

  page.drawLine({ start: { x: width - 330, y: 150 }, end: { x: width - 120, y: 150 }, color: rgb(0.78, 0.79, 0.83), thickness: 0.7 });
  const issued = formatDate(certificate.issued_at, 'd MMMM yyyy');
  page.drawText(issued, { x: width - 330, y: 132, size: 10, font: bold, color: ink });
  page.drawText('Date issued', { x: width - 330, y: 118, size: 8, font: regular, color: muted });

  const credential = `Credential ${certificate.code}`;
  page.drawText(credential, {
    x: (width - regular.widthOfTextAtSize(credential, 8)) / 2,
    y: 76,
    size: 8,
    font: regular,
    color: muted,
  });
  const verify = `Verify at ${absoluteUrl(`/verify?code=${encodeURIComponent(certificate.code)}`)}`;
  page.drawText(verify, {
    x: (width - regular.widthOfTextAtSize(verify, 7.5)) / 2,
    y: 63,
    size: 7.5,
    font: regular,
    color: muted,
  });

  const bytes = await doc.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lumina-${certificate.code.replace(/[^A-Za-z0-9_-]/g, '')}.pdf"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
