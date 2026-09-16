import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import LessonPlayer from "@/components/learn/LessonPlayer";
import { DANCES } from "@/lib/constants/dances";
import { listLessons } from "@/lib/lesson/store";

type Props = { params: Promise<{ dance: string; lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lesson: slug } = await params;
  const lesson = (await listLessons()).find((l) => l.slug === slug);
  const dance = DANCES.find((d) => d.slug === lesson?.dance);
  return lesson && dance ? { title: `${lesson.title} · ${dance.name} | NrityaVaani` } : {};
}

/**
 * A lesson, as one part of its dance.
 *
 * The player is a client component and loads the lesson itself. What this adds
 * is where the lesson sits — its dance, and which part of it — so the page can
 * say "Part 1" and "back" goes to the right dance. A lesson reached under the
 * wrong dance is sent to its own; one that does not exist is left for the
 * player to report, with its way back.
 */
export default async function LessonPage({ params }: Props) {
  // Parts are uploaded and deleted while the site is running, which renumbers them.
  await connection();
  const { dance: danceSlug, lesson: slug } = await params;

  const lessons = await listLessons();
  const lesson = lessons.find((l) => l.slug === slug);
  if (lesson && lesson.dance !== danceSlug) redirect(`/learn/${lesson.dance}/${lesson.slug}`);

  const dance = DANCES.find((d) => d.slug === danceSlug);
  const part = lesson ? lessons.filter((l) => l.dance === lesson.dance).indexOf(lesson) + 1 : null;

  return (
    <LessonPlayer
      slug={slug}
      dance={dance ? { slug: dance.slug, name: dance.name } : null}
      part={part}
    />
  );
}
