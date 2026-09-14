"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DancePhoto from "@/components/learn/DancePhoto";
import { Eyebrow, Pill } from "@/components/ui/editorial";
import { DANCES, type Dance } from "@/lib/constants/dances";
import { partCount } from "@/lib/lesson/manifest";

/**
 * The seven dances as a list, with whichever one is under the pointer described
 * beside it.
 *
 * Bharatanatyam heads the list and is the one described until another is
 * hovered or focused. Leaving the list keeps the last one described rather than
 * snapping back, so the pointer can cross over to the description and use its
 * link. Every row is itself a link to that dance's parts.
 *
 * All seven descriptions are rendered, stacked in a single grid cell, and
 * cross-faded. The cell is as tall as the longest of them, so running the
 * pointer down the list never moves the page, and each photograph has already
 * loaded by the time it is wanted. Below `lg` there is no pointer to hover with
 * and no room beside the list, so the description column is dropped and each
 * row carries its own photograph and one-line essence instead.
 */
export default function DancePicker({ parts }: { parts: Record<string, number> }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:gap-16">
      <ol className="self-start border-foreground/12 lg:border-t">
        {DANCES.map((dance, i) => {
          const count = parts[dance.slug] ?? 0;
          return (
            <li key={dance.slug} className="border-b border-foreground/12">
              <Link
                href={`/learn/${dance.slug}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                data-active={i === active || undefined}
                className="group relative flex items-center gap-4 py-4 pr-2 pl-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset active:bg-foreground/[0.04] lg:py-3.5 lg:data-active:bg-foreground/[0.04]"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-0.5 lg:group-data-active:bg-primary"
                />
                <span className="mono w-5 shrink-0 text-[10px] tabular-nums text-foreground/35 lg:group-data-active:text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <DancePhoto
                  dance={dance}
                  sizes="56px"
                  credit={false}
                  className="w-14 shrink-0 lg:hidden"
                />
                <span className="min-w-0 flex-1">
                  <span className="serif block text-[1.3rem] leading-tight transition-colors lg:group-data-active:text-primary">
                    {dance.name}
                  </span>
                  <span className="mono mt-1 block text-[10px] uppercase tracking-[0.16em] text-foreground/45">
                    {dance.region}
                    {count > 0 && ` · ${partCount(count)}`}
                  </span>
                  <span className="serif mt-1.5 block text-[0.92rem] italic leading-snug text-foreground/55 lg:hidden">
                    {dance.essence}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-foreground/30 transition lg:group-data-active:translate-x-0.5 lg:group-data-active:text-primary"
                />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="hidden lg:grid">
        {DANCES.map((dance, i) => (
          <Description
            key={dance.slug}
            dance={dance}
            parts={parts[dance.slug] ?? 0}
            shown={i === active}
          />
        ))}
      </div>
    </div>
  );
}

/** One dance described: its photograph, beside what it is and the way in. */
function Description({ dance, parts, shown }: { dance: Dance; parts: number; shown: boolean }) {
  return (
    <article
      inert={!shown}
      className={`col-start-1 row-start-1 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start gap-8 transition-[opacity,visibility] duration-300 xl:gap-10 ${
        shown ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      <DancePhoto dance={dance} sizes="(min-width: 1280px) 22rem, 18rem" />

      <div>
        <Eyebrow tone="primary">{dance.region}</Eyebrow>
        <h2 className="serif mt-3 text-[2.6rem] leading-none tracking-[-0.015em]">{dance.name}</h2>
        <p className="serif mt-2.5 text-[1.08rem] italic text-foreground/60">{dance.essence}</p>
        <p className="serif mt-5 text-[1.02rem] leading-[1.62] text-foreground/75">
          {dance.description}
        </p>

        <ul className="mt-5 space-y-2 border-t border-foreground/12 pt-5">
          {dance.facts.map((fact) => (
            <li
              key={fact}
              className="serif flex gap-2.5 text-[0.95rem] leading-[1.5] text-foreground/70"
            >
              <span aria-hidden className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-primary" />
              {fact}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Pill href={`/learn/${dance.slug}`} variant="solid">
            Learn {dance.name} <ArrowRight className="h-3.5 w-3.5" />
          </Pill>
          <span className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45">
            {partCount(parts)}
          </span>
        </div>
      </div>
    </article>
  );
}
