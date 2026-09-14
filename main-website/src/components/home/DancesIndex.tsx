import Image from "next/image";
import { DANCES } from "@/lib/constants/dances";
import { Eyebrow, Headline, Mark, Prose } from "@/components/ui/editorial";

/**
 * The seven classical dances, shown whole.
 *
 * This replaces the mudra wheel / mudra index as the site's front door. It is a
 * straight survey — one photograph per dance, the state it comes from, and a
 * one-line essence — because the homepage's job is now to say what NrityaVaani
 * teaches, not to sell one dance's hand shapes.
 *
 * Bharatanatyam leads as a wide feature card: it is the root the engine's hasta
 * vocabulary comes from, and it is the dance the detection actually understands
 * today. The other six are uniform portrait cards. Nothing here links to a
 * dance page yet — those routes are the next build, so the cards are figures,
 * not anchors, until they have somewhere to go.
 *
 * The photographs are freely licensed (mostly CC BY-SA); their credits will be
 * added back in a dedicated section elsewhere.
 */

export default function DancesIndex() {
  const [featured, ...rest] = DANCES;

  return (
    <section id="dances" className="relative z-10 bg-background">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-10 lg:gap-16 items-end mb-14 md:mb-18">
          <div>
            <Eyebrow tone="primary">the forms</Eyebrow>
            <Headline className="mt-5">
              The classical forms. <Mark>One place to learn them.</Mark>
            </Headline>
          </div>
          <Prose>
            <p>
              The classical dances of India share a single root — the Natya Shastra — and a
              single idea: meaning carried by the hands, the eyes and the body.{" "}
              <strong>These are the forms.</strong>
            </p>
          </Prose>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-7">
          <li className="sm:col-span-2 lg:col-span-2">
            <DanceFeature dance={featured} index={0} />
          </li>
          {rest.map((dance, i) => (
            <li key={dance.slug}>
              <DanceCard dance={dance} index={i + 1} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DanceFeature({ dance, index }: { dance: (typeof DANCES)[number]; index: number }) {
  return (
    <figure className="group">
      <div className="relative aspect-[16/10] lg:aspect-[16/9] overflow-hidden rounded-sm bg-black border border-foreground/12">
        <Image
          src={dance.image}
          alt={`A ${dance.name} dancer in performance`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <figcaption className="mt-5 grid sm:grid-cols-[auto_minmax(0,1fr)] gap-x-4">
        <span className="mono text-[10px] text-foreground/35 tabular-nums pt-1">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-[1.35rem] font-semibold leading-tight tracking-tight">
              {dance.name}
            </h3>
            <span className="mono text-[10px] uppercase tracking-[0.16em] text-primary">
              {dance.region}
            </span>
          </div>
          <p className="serif italic text-[1.05rem] text-foreground/60 mt-1.5">{dance.essence}</p>
          <p className="serif text-[1.02rem] leading-[1.6] text-foreground/70 mt-3 max-w-[58ch]">
            {dance.description}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

function DanceCard({ dance, index }: { dance: (typeof DANCES)[number]; index: number }) {
  return (
    <figure className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-black border border-foreground/12">
        <Image
          src={dance.image}
          alt={`A ${dance.name} dancer in performance`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <figcaption className="mt-4 flex items-baseline gap-3">
        <span className="mono text-[10px] text-foreground/35 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <p className="text-[0.95rem] font-semibold leading-tight">{dance.name}</p>
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 mt-1">
            {dance.region}
          </p>
          <p className="serif italic text-[0.9rem] text-foreground/55 leading-tight mt-1.5">
            {dance.essence}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
