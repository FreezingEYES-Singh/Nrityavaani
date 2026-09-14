"use client";

import { useMemo, useState } from "react";
import { MUDRAS } from "@/lib/constants/mudras";
import MudraCard from "@/components/library/MudraCard";
import { Search } from "lucide-react";
import { Eyebrow, Headline, Mark, Prose, Rule } from "@/components/ui/editorial";

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(MUDRAS.map((m) => m.category)))],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MUDRAS.filter((m) => {
      const matchesQuery =
        !q || m.name.toLowerCase().includes(q) || m.meaning.toLowerCase().includes(q);
      return (
        matchesQuery &&
        (difficulty === "All" || m.difficulty === difficulty) &&
        (category === "All" || m.category === category)
      );
    });
  }, [query, difficulty, category]);

  const reset = () => {
    setQuery("");
    setDifficulty("All");
    setCategory("All");
  };

  return (
    <div className="px-6 pt-32 pb-28 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-10 lg:gap-16 items-end">
          <div>
            <Eyebrow tone="primary">the library</Eyebrow>
            <Headline as="h1" className="mt-5">
              Twenty-eight <Mark>asamyukta hasta</Mark>.
            </Headline>
          </div>
          <Prose>
            <p>
              The single-hand gestures of Bharatanatyam, as set down in the Abhinaya Darpana.
              Each entry carries what the gesture depicts, how the hand is held, and the
              mistake most often made holding it.
            </p>
          </Prose>
        </div>

        {/* ---------------------------------------------------------- filters */}
        <div className="mt-14 border-y border-foreground/12 py-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or meaning"
              className="mono w-full bg-transparent border-0 border-b border-transparent focus:border-primary/60 pl-7 py-2 text-[12px] tracking-wide placeholder:text-foreground/35 focus:outline-none transition-colors"
            />
          </label>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Filters
              label="type"
              options={categories}
              value={category}
              onChange={setCategory}
              display={(c) => (c === "All" ? "all" : c)}
            />
            <Filters
              label="level"
              options={DIFFICULTIES}
              value={difficulty}
              onChange={setDifficulty}
              display={(d) => d.toLowerCase()}
            />
          </div>
        </div>

        {/*
          The count is live and stated plainly. A filtered grid that silently
          shrinks leaves the reader guessing whether a mudra is missing or
          simply filtered out.
        */}
        <p className="mono mt-5 text-[10px] uppercase tracking-[0.18em] text-foreground/45">
          {filtered.length} of {MUDRAS.length} shown
        </p>

        {filtered.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-7">
            {filtered.map((mudra) => (
              <MudraCard key={mudra.id} mudra={mudra} />
            ))}
          </div>
        ) : (
          <div className="mt-20 max-w-md">
            <Rule className="mb-8" />
            <h2 className="serif text-[1.6rem] leading-tight">Nothing matches that.</h2>
            <p className="serif text-[1rem] leading-[1.6] text-foreground/60 mt-3">
              No mudra in the library matches{" "}
              {query ? <span className="text-foreground">“{query}”</span> : "those filters"}.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mono mt-7 inline-flex rounded-full border border-foreground/25 px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-foreground/80 hover:border-primary/60 hover:text-primary transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A filter row. Set as text rather than as pills or a select: with four or five
 * short options the whole set fits on one line, and showing every option at
 * once is faster to scan than a control that hides them behind a click.
 */
function Filters({
  label,
  options,
  value,
  onChange,
  display,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  display: (v: string) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              value === option
                ? "text-primary"
                : "text-foreground/45 hover:text-foreground/80"
            }`}
          >
            {display(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
