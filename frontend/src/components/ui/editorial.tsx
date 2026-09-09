import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The page furniture, in one place.
 *
 * The rules these encode, so they do not have to be re-argued per section:
 *
 * - **Labels are monospace, prose is serif, data is monospace.** A fixed advance
 *   is what makes a row of figures scan as a row rather than as words.
 * - **One emphasis per headline.** The highlight is a solid block, not a colour
 *   change, so it survives both themes and reads at a glance.
 * - **Numbers carry units.** "28" is a decoration; "28 mudras documented" is a
 *   fact, and the unit is what makes it checkable.
 * - **No card unless the content is genuinely a card.** The old page wrapped
 *   every paragraph in a glass panel with a tilt handler, which is why nothing
 *   on it had a hierarchy.
 */

/** Small monospace section marker. The technical slug above a headline. */
export function Eyebrow({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "primary";
  className?: string;
}) {
  return (
    <p
      className={`mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] ${
        tone === "primary" ? "text-primary" : "text-foreground/45"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * The inverted highlight. Sits on the phrase the sentence turns on — never on
 * more than one phrase, and never on the whole line.
 */
export function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-primary text-black px-2 py-0.5 box-decoration-clone rounded-[2px]">
      {children}
    </mark>
  );
}

/** Section headline. Serif, large, tight — the only thing on the page allowed to be big. */
export function Headline({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      className={`serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3.4rem)] ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Body copy at a readable measure. Serif, because it is prose and not UI. */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`serif text-[1.02rem] sm:text-[1.09rem] leading-[1.66] text-foreground/72 max-w-[62ch] space-y-4 [&_strong]:font-semibold [&_strong]:text-foreground ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * One measured quantity: the figure, its unit, and what was measured.
 *
 * The unit is set small and raised beside the number rather than folded into
 * it, so the eye can compare the numbers down a row without re-reading them.
 */
export function Figure({
  value,
  unit,
  caption,
}: {
  value: string;
  unit?: string;
  caption: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="mono text-[1.75rem] sm:text-[2.1rem] leading-none tracking-tight text-foreground">
          {value}
        </span>
        {unit && <span className="mono text-[10px] text-foreground/45">{unit}</span>}
      </div>
      <p className="mono mt-2.5 text-[10px] uppercase tracking-[0.16em] text-foreground/45">
        {caption}
      </p>
    </div>
  );
}

/** A row of figures under a hairline, as the references set them. */
export function FigureRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-9 border-t border-foreground/12 pt-8 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The dot-separated credential line — who this is for, which programme, which
 * problem. Facts only; it is the line that says the project is real.
 */
export function FactStrip({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <p
      className={`mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-foreground/45 ${className}`}
    >
      {items.map((item, i) => (
        <span key={item}>
          {i > 0 && <span className="text-primary/60 px-2">·</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

/** Hairline. The main structural device on both reference sites. */
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-foreground/12 ${className}`} />;
}

/** Pill button. `solid` for the one action a section wants, `ghost` for the rest. */
export function Pill({
  href,
  children,
  variant = "ghost",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const base =
    "mono inline-flex items-center gap-2 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const look =
    variant === "solid"
      ? "bg-primary text-black hover:bg-primary/85"
      : "border border-foreground/25 text-foreground/80 hover:border-primary/60 hover:text-primary";
  return (
    <Link href={href} className={`${base} ${look} ${className}`}>
      {children}
    </Link>
  );
}

/**
 * Section shell. Carries the vertical rhythm and the optional hairline above,
 * so sections cannot drift apart by a few pixels each time one is edited.
 */
export function Section({
  children,
  id,
  ruled = false,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  ruled?: boolean;
  className?: string;
}) {
  return (
    <section id={id} className={`relative px-6 py-20 md:py-28 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {ruled && <Rule className="mb-16 md:mb-20" />}
        {children}
      </div>
    </section>
  );
}
