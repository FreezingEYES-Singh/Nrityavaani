import PartRow from "@/components/learn/PartRow";
import type { Dance } from "@/lib/constants/dances";
import type { LessonSummary } from "@/lib/lesson/manifest";

/**
 * A dance's lessons in order, as its parts.
 *
 * This site delivers lessons; it does not make them, and learners use it, so
 * the list only opens parts — it neither uploads nor deletes them. A lesson is
 * authored in the separate studio app and published into `public/lessons`,
 * where the list finds it (`/api/lessons/import` still accepts a studio ZIP,
 * but nothing here links to it).
 */
export default function DanceParts({
  dance,
  lessons,
  className = "",
}: {
  dance: Pick<Dance, "slug" | "name">;
  /** This dance's lessons, already in part order. */
  lessons: LessonSummary[];
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="serif text-[1.8rem] leading-tight">Parts</h2>

      {lessons.length === 0 ? (
        <div className="mt-5 rounded-sm border border-dashed border-foreground/20 px-6 py-14 text-center">
          <p className="serif text-[1.15rem] text-foreground/70">
            No parts for {dance.name} yet.
          </p>
          <p className="serif mt-2 text-foreground/45">New parts appear here as they are published.</p>
        </div>
      ) : (
        <ol className="mt-5 border-t border-foreground/12">
          {lessons.map((lesson, i) => (
            <li key={lesson.slug}>
              <PartRow lesson={lesson} part={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
