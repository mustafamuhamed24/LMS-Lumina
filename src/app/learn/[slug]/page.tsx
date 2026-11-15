import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { requireStudent } from '@/lib/auth/session';
import { getLearnData } from '@/features/student/queries';

export const metadata = { title: 'Learning' };

export default async function LearnCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireStudent();
  const data = await getLearnData(user, slug);
  if (!data) notFound();
  if (data.locked) redirect(`/courses/${slug}`);
  redirect(`/learn/${slug}/${data.currentLesson.id}`);
}
