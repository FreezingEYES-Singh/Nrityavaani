import Link from "next/link";
import { Clock, Play, Volume2 } from "lucide-react";
import type { LessonSummary } from "@/lib/lesson/manifest";

/** mm:ss on the clip's clock, for the row's meta. */
function fmt(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * One part of a dance: "Part 1: Namaskaram".
 *
 * `part` is the lesson's place in its dance's sequence, counted by the list
 * rather than stored. The whole row links to the player. There is nothing else
 * to do with a part here: learners use this page, so it neither uploads nor
 * deletes lessons.
 */
export default function PartRow({ lesson, part }: { lesson: LessonSummary; part: number }) {
  const href = `/learn/${lesson.dance}/${lesson.slug}`;

  return (
    <article className="group relative flex items-center gap-4 border-b border-foreground/12 py-5 sm:gap-6">
      <div className="min-w-0 flex-1">
        <h3 className="serif text-[1.4rem] leading-tight sm:text-[1.6rem]">
          {/* Stretched over the whole row, so anywhere on it opens the part. */}
          <Link
            href={href}
            className="transition-colors group-hover:text-primary after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary/60"
          >
            <span className="text-primary">Part {part}:</span> {lesson.title}
          </Link>
        </h3>
        {lesson.subtitle && (
          <p className="serif mt-1 text-[1rem] italic leading-snug text-foreground/55">
            {lesson.subtitle}
          </p>
        )}
        <p className="mono mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-foreground/45">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> {fmt(lesson.duration)}
          </span>
          <span>
            {lesson.steps} step{lesson.steps === 1 ? "" : "s"}
          </span>
          {lesson.hasVoice && (
            <span className="flex items-center gap-1.5">
              <Volume2 className="h-3 w-3 text-primary" /> Narrated
            </span>
          )}
        </p>
      </div>

      <span
        aria-hidden
        className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-foreground/20 text-foreground/60 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-black sm:grid"
      >
        <Play className="ml-0.5 h-4 w-4" />
      </span>
    </article>
  );
}
