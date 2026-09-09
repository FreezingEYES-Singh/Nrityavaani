import Image from "next/image";
import Link from "next/link";
import { MUDRAS } from "@/lib/constants/mudras";
import { Eyebrow, Headline, Mark, Pill, Prose, Rule } from "@/components/ui/editorial";

/**
 * A handful of mudras, shown whole.
 *
 * This replaces a scroll-driven cylinder that carried all 28 at once. The
 * cylinder had one unfixable problem: to fit 28 cards on a wheel every card had
 * to be turned away from the reader, so the photographs — the one thing on the
 * page a dancer actually needs to see — were foreshortened, cropped by the
 * viewport and dimmed to 14% at the edges. A hand gesture shown at an angle is
 * not shown.
 *
 * Six, flat and full-bleed, with the rest one click away. The set is chosen to
 * span the range rather than to be the first six in the file: a flat palm, a
 * bent-finger variant, a deep curl, a two-finger extension, a fan and a fist,
 * so the grid reads as a survey instead of a sample.
 */
const FEATURED = ["pataka", "tripataka", "mayura", "kartarimukha", "alapadma", "mushti"];

export default function MudraIndex() {
  const shown = FEATURED.map((slug) => {
    const mudra = MUDRAS.find((m) => m.slug === slug);
    // Do not quietly drop a miss. Filtering these out is what rendered five
    // cards where six were asked for, with nothing to say why: the culprit was
    // "shikara" — the image *filename* — against a mudra whose slug is
    // "shikhara". A wrong name should stop the build, not shrink the grid.
    if (!mudra) throw new Error(`MudraIndex: no mudra has the slug "${slug}"`);
    return mudra;
  });

  return (
    <section className="relative px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <Rule className="mb-16 md:mb-20" />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-10 lg:gap-16 items-end mb-14 md:mb-18">
          <div>
            <Eyebrow tone="primary">the library</Eyebrow>
            <Headline className="mt-5">
              Twenty-eight gestures, <Mark>each one documented</Mark>.
            </Headline>
          </div>
          <Prose>
            <p>
              Every entry carries its meaning, what it is used to depict, how the hand is
              held, and the mistake people usually make holding it. Six are below;{" "}
              <strong>the other twenty-two are in the library</strong>.
            </p>
          </Prose>
        </div>

        <ol className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 md:gap-x-7 md:gap-y-12">
          {shown.map((mudra, i) => (
            <li key={mudra.slug}>
              <Link href={`/library/${mudra.slug}`} className="group block">
                {/*
                  3:4 and object-contain, not object-cover. These are reference
                  photographs of a hand against black — cropping one to fill a
                  box is as likely to cut off the fingertips as anything else,
                  and the fingertips are the mudra.
                */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-black border border-foreground/12 transition-colors duration-300 group-hover:border-primary/50">
                  <Image
                    src={mudra.image}
                    alt={`The ${mudra.name} mudra`}
                    fill
                    sizes="(min-width: 768px) 30vw, 45vw"
                    className="object-contain"
                  />
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="mono text-[10px] text-foreground/35 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-semibold leading-tight transition-colors group-hover:text-primary">
                      {mudra.name}
                    </p>
                    <p className="serif italic text-[0.9rem] text-foreground/50 leading-tight mt-0.5">
                      {mudra.meaning}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-wrap items-center gap-3">
          <Pill href="/library" variant="solid">
            Open the full library
          </Pill>
          <Pill href="/live">Try one on camera</Pill>
        </div>
      </div>
    </section>
  );
}
