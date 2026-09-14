"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MUDRAS } from "@/lib/constants/mudras";
import { cn } from "@/lib/utils";
import { Eyebrow, Pill, Rule } from "@/components/ui/editorial";

const DIFFICULTY: Record<string, string> = {
  Beginner: "text-emerald-400",
  Intermediate: "text-primary",
  Advanced: "text-rose-400",
};

export default function MudraDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const mudra = MUDRAS.find((m) => m.slug === slug);

  if (!mudra) {
    return (
      <div className="min-h-screen px-6 pt-40 pb-32">
        <div className="max-w-6xl mx-auto max-w-md">
          <Eyebrow>not found</Eyebrow>
          <h1 className="serif text-[2rem] leading-tight mt-4">
            No mudra with that name.
          </h1>
          <p className="serif text-[1rem] leading-[1.6] text-foreground/60 mt-3">
            The library holds {MUDRAS.length} entries, and{" "}
            <span className="text-foreground">“{slug}”</span> is not one of them.
          </p>
          <div className="mt-8">
            <Pill href="/library" variant="solid">
              Back to the library
            </Pill>
          </div>
        </div>
      </div>
    );
  }

  // The source data packs several facts into one string apiece. Splitting them
  // here rather than printing the sentence is what lets the steps be numbered
  // and the usages be listed — the shape of the content, made visible.
  const steps = mudra.instructions
    .split(". ")
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
  const usages = mudra.significance
    .split(/,\s*/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);

  return (
    <div className="min-h-screen px-6 pt-32 pb-28">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/library"
          className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/45 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Library
        </Link>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-12 lg:gap-16">
          {/*
            The photograph, uncropped and undimmed. On a page whose whole job is
            to show one hand shape, the reference image is the content, not a
            decorative panel behind a gradient.
          */}
          <div className="relative aspect-[4/5] rounded-sm overflow-hidden bg-black border border-foreground/12">
            <Image
              src={mudra.image}
              alt={`The ${mudra.name} mudra`}
              fill
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="object-contain"
              priority
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Eyebrow>{mudra.category}</Eyebrow>
              <span
                className={cn(
                  "mono text-[10px] uppercase tracking-[0.18em]",
                  DIFFICULTY[mudra.difficulty] ?? "text-foreground/45",
                )}
              >
                {mudra.difficulty}
              </span>
            </div>

            <h1 className="serif font-normal tracking-[-0.015em] leading-[1.05] text-[clamp(2.2rem,5vw,3.6rem)] mt-5">
              {mudra.name}
            </h1>
            <p className="serif italic text-[1.3rem] text-primary mt-2">{mudra.meaning}</p>

            <p className="serif text-[1.09rem] leading-[1.62] text-foreground/70 mt-7 max-w-[58ch]">
              {mudra.meaningLong}
            </p>

            <Rule className="my-10" />

            <section>
              <Eyebrow tone="primary">how it is held</Eyebrow>
              <ol className="mt-6 space-y-4">
                {steps.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="mono text-[10px] text-foreground/35 tabular-nums pt-1.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="serif text-[1.02rem] leading-[1.6] text-foreground/75">{step}.</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-10 border-l-2 border-rose-400/40 pl-5">
              <Eyebrow className="text-rose-400/80">where it goes wrong</Eyebrow>
              <p className="serif text-[1.02rem] leading-[1.6] text-foreground/70 mt-3">
                {mudra.commonMistakes}
              </p>
            </section>

            <div className="mt-11 flex flex-wrap gap-3">
              <Pill href={`/practice/${mudra.slug}`} variant="solid">
                Practise this mudra
              </Pill>
              <Pill href="/live">Open live detection</Pill>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ viniyoga */}
        <section className="mt-24 md:mt-32">
          <Rule className="mb-14" />
          <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-10 lg:gap-16">
            <div>
              <Eyebrow tone="primary">viniyoga</Eyebrow>
              <h2 className="serif font-normal tracking-[-0.015em] leading-[1.1] text-[clamp(1.6rem,3.4vw,2.4rem)] mt-4">
                What {mudra.name} is used to depict.
              </h2>
            </div>
            <div>
              <p className="serif text-[1.02rem] leading-[1.62] text-foreground/60 max-w-[58ch]">
                The standard usages assigned to this hand in the Abhinaya Darpana. One gesture
                carries many meanings; context and the rest of the body decide which.
              </p>
              <ul className="mt-8 grid sm:grid-cols-2 gap-x-8">
                {usages.map((usage, i) => (
                  <li
                    key={usage}
                    className="flex items-baseline gap-4 py-3.5 border-t border-foreground/12"
                  >
                    <span className="mono text-[10px] text-foreground/30 tabular-nums shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[1rem] text-foreground/80">{usage}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
