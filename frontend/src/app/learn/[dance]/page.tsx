import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import DanceParts from "@/components/learn/DanceParts";
import DancePhoto from "@/components/learn/DancePhoto";
import IdentifyMudra from "@/components/learn/IdentifyMudra";
import { Eyebrow, Headline, Prose } from "@/components/ui/editorial";
import { DANCES } from "@/lib/constants/dances";
import { danceOf } from "@/lib/lesson/manifest";
import { listLessons, readLesson } from "@/lib/lesson/store";

type Props = { params: Promise<{ dance: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dance: slug } = await params;
  const dance = DANCES.find((d) => d.slug === slug);
  return dance ? { title: `${dance.name} | NrityaVaani`, description: dance.description } : {};
}

/**
 * One dance: what it is, and its lessons in order as "Part 1", "Part 2"…
 *
 * Also where the addresses lessons had before they were filed under a dance —
 * `/learn/<lesson>` — land, and are sent on to the lesson's place in its dance.
 */
export default async function DancePage({ params }: Props) {
  // Parts are uploaded while the site is running; read them on each request.
  await connection();
  const { dance: slug } = await params;

  const dance = DANCES.find((d) => d.slug === slug);
  if (!dance) {
    const lesson = await readLesson(slug);
    if (lesson) redirect(`/learn/${danceOf(lesson)}/${lesson.slug}`);
    notFound();
  }

  const lessons = (await listLessons()).filter((l) => l.dance === dance.slug);

  return (
    <div className="px-6 pt-32 pb-24">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/learn"
          className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-foreground/50 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All dances
        </Link>

        <div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-20">
          <div className="min-w-0">
            <header>
              <Eyebrow tone="primary">{dance.region}</Eyebrow>
              <Headline as="h1" className="mt-3">
                {dance.name}
              </Headline>
              <p className="serif mt-2 text-[1.15rem] italic text-foreground/60">
                {dance.essence}
              </p>
              <Prose className="mt-5">
                <p>{dance.description}</p>
              </Prose>
            </header>

            {/* Live detection reads Bharatanatyam's hastas, so only its page offers it. */}
            {dance.slug === "bharatanatyam" && <IdentifyMudra className="mt-8" />}

            <DanceParts
              dance={{ slug: dance.slug, name: dance.name }}
              lessons={lessons}
              className="mt-14"
            />
          </div>

          <aside>
            <DancePhoto
              dance={dance}
              sizes="(min-width: 1024px) 20rem, 24rem"
              className="max-w-sm lg:max-w-none"
            />
            <dl className="mt-8 border-t border-foreground/12">
              {dance.sections.map((section) => (
                <div key={section.title} className="border-b border-foreground/12 py-3.5">
                  <dt className="mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    {section.title}
                  </dt>
                  <dd className="serif mt-1 text-[0.98rem] leading-[1.5] text-foreground/75">
                    {section.body}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
