import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import DanceDeck from "@/components/home/DanceDeck";
import DancesIndex from "@/components/home/DancesIndex";
import HandsShowcase from "@/components/home/HandsShowcase";
import {
  Eyebrow,
  FactStrip,
  Figure,
  FigureRow,
  Headline,
  Mark,
  Pill,
  Prose,
  Rule,
  Section,
} from "@/components/ui/editorial";

/*
 * Nataraja — the Lord of Dance — stands behind the hero and resolves as you
 * scroll: a flat 2D silhouette, then a hairline drawing, then the fully lit
 * bronze figure. It is the one motif shared by all seven forms, so it belongs
 * dead centre, where every dance meets. `ssr: false` is not allowed here
 * (Server Component), so the dynamic import stays plain — the stage renders an
 * empty host until it mounts and only then spins up WebGL.
 */
const NatarajaStage = dynamic(() => import("@/components/three/NatarajaStage"));

export default function LandingPage() {
  return (
    <div className="relative selection:bg-primary/30 selection:text-primary">
      {/* One fixed stage behind the page; the figure is the trophy in the
          centre and resolves 2D → outline → 3D across the next two anchors. */}
      <NatarajaStage className="fixed inset-0 z-0 pointer-events-none" />

      {/* ---------------------------------------------------------------- hero */}
      {/* The lg padding (8rem in all) is what DanceDeck subtracts from the viewport to size itself. */}
      <section className="relative z-10 min-h-[100svh] flex items-center overflow-hidden px-6 pt-28 pb-24 md:pt-24 lg:pt-22 lg:pb-10">
        {/* A soft scrim on the reading edge only; the centre stays clear for the figure. */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background via-background/70 to-transparent lg:via-background/45" />

        {/* max-w-6xl, like the navbar and every Section, so the copy starts under the logo. */}
        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-14 lg:gap-10 items-center">
            {/* Left — the copy. No list of names here; the deck says all of it. */}
            <div className="max-w-xl">
              <Eyebrow tone="primary" className="mb-8">
                classical dance · pose detection
              </Eyebrow>

              <h1 className="serif font-normal tracking-[-0.015em] leading-[1.05] text-[clamp(2.3rem,6vw,4.4rem)] text-foreground">
                Learn India&rsquo;s classical dances, <Mark>pose by pose</Mark>.
              </h1>

              <Prose className="mt-8">
                <p>
                  Watch a master, mirror the pose on camera, and let on-device tracking tell you
                  exactly what to fix — finger by finger, joint by joint, with nothing leaving
                  your device.
                </p>
              </Prose>

              <div className="mt-10 flex flex-wrap gap-3">
                <Pill href="/live" variant="solid" className="px-8 py-4 text-xs">
                  Try pose detection
                </Pill>
                <Pill href="/learn" className="px-8 py-4 text-xs">
                  Start learning
                </Pill>
              </div>

              <FactStrip
                className="mt-12"
                items={["Classical dance", "Pose detection", "On-device inference", "India"]}
              />
            </div>

            {/* Right — the deck of the forms. */}
            <DanceDeck />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- the hands */}
      <Section id="hands" className="relative z-10 bg-background border-t border-foreground/12">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
          <div>
            <Eyebrow tone="primary">the hands</Eyebrow>
            <Headline className="mt-5">
              A language of the hands, <Mark>formed in three dimensions</Mark>.
            </Headline>
            <Prose className="mt-8">
              <p>
                Bharatanatyam tells its stories through hasta mudras — a flag, a peacock, a
                blooming lotus. The hand here forms eight of them in turn: pick a name to see it
                again, or move your pointer to turn the hand.
              </p>
              <p>
                <strong>All twenty-eight are in the library</strong>, each with its meaning and how
                it is held. When you are ready, hold one up to your camera and live detection
                names the gesture it sees.
              </p>
            </Prose>
            <div className="mt-10 flex flex-wrap gap-3">
              <Pill href="/library" variant="solid">
                Hand pose library
              </Pill>
              <Pill href="/live">Live hand gesture detection</Pill>
            </div>
          </div>

          <HandsShowcase className="max-w-[34rem] mx-auto lg:mx-0 lg:justify-self-end" />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- the lineage */}
      {/*
        No `overflow-hidden` here: an ancestor with overflow other than visible
        becomes the scroll container for `position: sticky`, and then the pinned
        copy would scroll away instead of holding. The figure behind is fixed
        and centred; this section only keeps the copy legible over the outline.
      */}
      <section id="lineage" className="relative z-10 border-t border-foreground/12">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />

        <div className="relative min-h-[130vh]">
          <div className="sticky top-0 min-h-screen flex items-center px-6 py-28">
            <div className="max-w-6xl mx-auto w-full">
              <div className="max-w-2xl">
                <Eyebrow tone="primary">the lineage</Eyebrow>
                <h2 className="serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3.4rem)] mt-5 text-foreground">
                  A tradition <Mark>two thousand years old</Mark>, learned by repetition.
                </h2>
                <div className="serif text-[1.02rem] sm:text-[1.09rem] leading-[1.66] text-foreground/70 max-w-[62ch] space-y-4 mt-8">
                  <p>
                    Every classical form traces back to the Natya Shastra — a single text that
                    set down how the hands, the eyes and the body carry meaning. What changes
                    from one state to the next is only the accent: how the knee bends, how the
                    beat lands, how the face is painted.
                  </p>
                  <p>
                    <strong className="font-semibold text-foreground">
                      Nothing here is trying to replace the teacher.
                    </strong>{" "}
                    A camera can tell you your elbow is a hand&rsquo;s-breadth out of place at
                    eleven at night, when there is no one else in the room to say so. That is
                    the whole claim.
                  </p>
                </div>
                <div className="mt-10">
                  <Pill href="/about" variant="ghost">
                    About the project
                  </Pill>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- what it is */}
      {/*
        The second boundary the figure changes on: above it the figure is a
        drawing, below it the figure is built. The scrim is solid on the reading
        edge and clears toward the centre, so the bronze stays visible.
      */}
      <div id="what" className="relative z-10 border-t border-foreground/12">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent pointer-events-none" />
        <Section className="relative">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-10 lg:gap-16">
            <div>
              <Eyebrow tone="primary">what this is</Eyebrow>
              <Headline className="mt-5">
                A camera, a master to follow, and <Mark>nothing leaving the device</Mark>.
              </Headline>
            </div>
            <Prose>
              <p>
                NrityaVaani pairs two things that have always belonged together: the classical
                forms of India, and the discipline of matching a teacher. The tracking is Google
                MediaPipe running in your browser tab; the correction is a set of geometric rules
                over the points it returns.
              </p>
              <p>
                Both halves matter. A model that only returns a label can tell a student they are
                wrong but not how. <strong>Because the rules are geometry rather than a black
                box</strong>, the engine can name the joint or finger at fault — and because
                inference is on-device, no frame of video is ever uploaded.
              </p>
            </Prose>
          </div>

          <FigureRow className="mt-16 md:mt-20">
            <Figure value="28" caption="hasta mudras documented" />
            <Figure value="21" unit="per hand" caption="tracked landmarks" />
            <Figure value="0" unit="frames" caption="uploaded to a server" />
            <Figure value="On-device" caption="where inference runs" />
          </FigureRow>
        </Section>
      </div>

      {/* ---------------------------------------------------------------- the forms */}
      <DancesIndex />

      {/* ---------------------------------------------------------------- how it works */}
      <Section ruled className="z-10 bg-background">
        <Eyebrow tone="primary">how it works</Eyebrow>
        <Headline className="mt-5 max-w-3xl">
          Three steps, and you can <Mark>inspect every one</Mark>.
        </Headline>

        <ol className="mt-14 md:mt-16 grid md:grid-cols-3 gap-x-8 gap-y-12">
          {[
            {
              n: "01",
              title: "Watch",
              body: "Choose a dance and watch a master break a pose or a phrase into its parts — where the weight sits, what the hands say, what the eyes do.",
              href: "/learn",
              link: "The lessons",
            },
            {
              n: "02",
              title: "Mirror",
              body: "Open your camera and match the pose. MediaPipe tracks your hands and body inside the tab, so nothing is sent anywhere.",
              href: "/live",
              link: "Live detection",
            },
            {
              n: "03",
              title: "Correct",
              body: "A failed pose names the joint or finger that failed it, so the feedback is 'raise your elbow' rather than a confidence score.",
              href: "/research#correction",
              link: "How correction is derived",
            },
          ].map((step) => (
            <li key={step.n}>
              <Rule className="mb-6" />
              <div className="flex items-baseline gap-4">
                <span className="mono text-[11px] text-primary tabular-nums">{step.n}</span>
                <h3 className="serif text-[1.5rem] leading-none tracking-tight">{step.title}</h3>
              </div>
              <p className="serif text-[1.02rem] leading-[1.62] text-foreground/70 mt-5">
                {step.body}
              </p>
              <Link
                href={step.href}
                className="mono mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-primary hover:gap-3 transition-all"
              >
                {step.link}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------------------------------------------------------- pricing */}
      <Section id="pricing" ruled className="z-10 bg-background">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-end">
          <div>
            <Eyebrow tone="primary">plans</Eyebrow>
            <Headline className="mt-5">
              Free to practise. <Mark>Paid to be coached</Mark>.
            </Headline>
          </div>
          <Prose>
            <p>
              Recognition and the full library are free and always will be — they run on your own
              machine, so they cost nothing to serve. The paid tiers buy stored history, deeper
              per-joint analysis and, for academies, multi-student tracking.
            </p>
          </Prose>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-px bg-foreground/12 border border-foreground/12 rounded-sm overflow-hidden">
          {[
            {
              name: "Sadhaka",
              price: "0",
              planId: "sadhaka",
              note: "For learning the vocabulary.",
              features: [
                "Real-time pose & mudra recognition",
                "The full pose and mudra library",
                "5 minutes of practice a day",
                "Community support",
              ],
              cta: "Start free",
              featured: false,
            },
            {
              name: "Yoddha",
              price: "1,499",
              planId: "yoddha",
              note: "For daily practice with a record of it.",
              features: [
                "Unlimited practice time",
                "Per-joint corrective feedback",
                "Session history and progress",
                "Custom practice goals",
                "Priority support",
              ],
              cta: "Choose Yoddha",
              featured: true,
            },
            {
              name: "Guru",
              price: "6,999",
              planId: "guru",
              note: "For an academy running classes.",
              features: [
                "Everything in Yoddha",
                "Multi-student dashboard",
                "Per-student progress tracking",
                "Custom pose sets",
                "Integration support",
              ],
              cta: "Talk to us",
              featured: false,
            },
          ].map((plan) => (
            <div
              key={plan.planId}
              className={`p-8 lg:p-10 flex flex-col ${
                plan.featured ? "bg-primary/[0.06]" : "bg-background"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/70">
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="mono text-[9px] uppercase tracking-[0.16em] text-primary">
                    most chosen
                  </span>
                )}
              </div>

              <div className="mt-7 flex items-baseline gap-1">
                <span className="mono text-[1.15rem] text-foreground/50">₹</span>
                <span className="mono text-[2.4rem] leading-none tracking-tight">{plan.price}</span>
                <span className="mono text-[10px] text-foreground/45 ml-1">/month</span>
              </div>
              <p className="serif italic text-[0.95rem] text-foreground/55 mt-3">{plan.note}</p>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-[0.92rem] text-foreground/70">
                    <Check className="w-3.5 h-3.5 mt-1 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout?plan=${plan.planId}&price=${plan.price.replace(",", "")}`}
                className={`mono mt-9 inline-flex items-center justify-center rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  plan.featured
                    ? "bg-primary text-black hover:bg-primary/85"
                    : "border border-foreground/25 text-foreground/80 hover:border-primary/60 hover:text-primary"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- close */}
      <Section ruled className="z-10 bg-background pb-28 md:pb-36">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-16 items-end">
          <Headline className="max-w-2xl">
            Pick a form, open the camera, and <Mark>match your first pose</Mark>.
          </Headline>
          <div className="flex flex-wrap gap-3">
            <Pill href="/learn" variant="solid">
              Start learning
            </Pill>
            <Pill href="/live">Open live detection</Pill>
          </div>
        </div>
        <FactStrip
          className="mt-14"
          items={["Classical dance", "Pose detection", "On-device inference", "India"]}
        />
      </Section>
    </div>
  );
}
