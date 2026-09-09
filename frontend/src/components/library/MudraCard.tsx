import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * One mudra in the library index.
 *
 * Two things it deliberately does not do, both inherited from the version it
 * replaces. It does not crop the photograph to a square — these are 3:4
 * portraits of a hand, and a square crop takes the fingertips off the top,
 * which is the part being taught. And it does not sit at 50% opacity waiting
 * to be hovered: a reference photograph you have to hover to see is not a
 * reference. Hover changes the border and nothing else.
 */

type Mudra = {
  slug: string;
  name: string;
  category: string;
  meaning: string;
  difficulty: string;
  meaningLong: string;
  image: string;
};

const DIFFICULTY: Record<string, string> = {
  Beginner: "text-emerald-400",
  Intermediate: "text-primary",
  Advanced: "text-rose-400",
};

export default function MudraCard({ mudra }: { mudra: Mudra }) {
  return (
    <article className="group flex flex-col h-full">
      <Link href={`/library/${mudra.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-black border border-foreground/12 transition-colors duration-300 group-hover:border-primary/50">
          <Image
            src={mudra.image}
            alt={`The ${mudra.name} mudra`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
          />
        </div>
      </Link>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <Link href={`/library/${mudra.slug}`} className="min-w-0">
          <h3 className="text-[1.05rem] font-semibold leading-tight transition-colors group-hover:text-primary truncate">
            {mudra.name}
          </h3>
          <p className="serif italic text-[0.92rem] text-foreground/55 leading-tight mt-0.5 truncate">
            {mudra.meaning}
          </p>
        </Link>
        <span
          className={cn(
            "mono text-[9px] uppercase tracking-[0.14em] shrink-0",
            DIFFICULTY[mudra.difficulty] ?? "text-foreground/45",
          )}
        >
          {mudra.difficulty}
        </span>
      </div>

      <p className="serif text-[0.92rem] leading-[1.55] text-foreground/60 mt-3 line-clamp-2">
        {mudra.meaningLong}
      </p>

      <div className="mt-auto pt-5 flex items-center gap-4">
        <Link
          href={`/practice/${mudra.slug}`}
          className="mono text-[10px] uppercase tracking-[0.16em] text-primary hover:underline underline-offset-4"
        >
          Practise
        </Link>
        <Link
          href={`/library/${mudra.slug}`}
          className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 hover:text-foreground transition-colors"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
