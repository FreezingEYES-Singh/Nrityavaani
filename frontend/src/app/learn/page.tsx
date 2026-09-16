import type { Metadata } from "next";
import { connection } from "next/server";
import DancePicker from "@/components/learn/DancePicker";
import { Eyebrow, Headline, Prose, Rule } from "@/components/ui/editorial";
import { listLessons } from "@/lib/lesson/store";

export const metadata: Metadata = {
  title: "Learn | NrityaVaani",
  description: "The seven classical dances of India, each taught part by part.",
};

/**
 * The front door of `/learn`: the seven classical dances.
 *
 * Lessons are filed under a dance and taught as its parts, so all this page
 * does is choose the dance. The parts themselves are on that dance's own
 * page, `/learn/<dance>`.
 */
export default async function LearnPage() {
  // Parts are uploaded while the site is running, so they are counted on each
  // request rather than once at build time.
  await connection();
  const parts: Record<string, number> = {};
  for (const lesson of await listLessons()) {
    parts[lesson.dance] = (parts[lesson.dance] ?? 0) + 1;
  }

  return (
    <div className="px-6 pt-32 pb-24">
      <div className="mx-auto max-w-6xl">
        <header>
          <Eyebrow tone="primary">lessons</Eyebrow>
          <Headline as="h1" className="mt-3">
            Learn
          </Headline>
          <Prose className="mt-4">
            <p>
              The seven classical dances of India. Choose one to see what it is, then
              learn it the way it is taught — one part at a time.
            </p>
          </Prose>
        </header>

        <Rule className="mt-10" />

        <div className="mt-10">
          <DancePicker parts={parts} />
        </div>
      </div>
    </div>
  );
}
