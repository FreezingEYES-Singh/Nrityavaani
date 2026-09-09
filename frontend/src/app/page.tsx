import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import MudraHero from "@/components/three/MudraHero";
import MudraIndex from "@/components/three/MudraIndex";
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

// Three.js stays off the server render and off the critical path, the same way
// the hero's hand does. Every section over it is designed to read with nothing
// behind it at all.
const NatarajaStage = dynamic(() => import("@/components/three/NatarajaStage"));

export default function LandingPage() {
  return (
    <div className="relative selection:bg-primary/30 selection:text-primary">
      {/*
        One fixed stage behind the page. It is a drawing behind the hero and a
        built figure by the end of the section under it, so the two anchors have
        to be adjacent — the transition is the scroll between them.
      */}
      <NatarajaStage className="fixed inset-0 z-0 pointer-events-none" />

      <div id="hero" className="relative z-10">
        <MudraHero />
      </div>

      {/* ---------------------------------------------------------------- the lineage */}
      {/*
        No `overflow-hidden` here, however tempting: an ancestor with any
        overflow other than visible turns itself into the scroll container for
        `position: sticky` inside it, and since this section does not scroll,
        the pinned copy simply scrolls away instead. Nothing here overflows
        anyway — the figure behind it is a fixed layer of its own.
      */}
      <section id="lineage" className="relative z-10 border-t border-white/10">
        {/*
          The figure itself is the fixed stage behind this, so the section paints
          only what it needs to keep the copy legible over it: a dark ground that
          is solid on the reading edge and clears to nothing on the other. If
          WebGL is missing or the model never arrives, this is all there is, and
          the section still reads.
        */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080502] via-[#080502]/85 to-[#080502]/25 pointer-events-none" />

        {/*
          Two screens tall, with the copy pinned across both. That length is
          what buys the sequence its middle state: the outline gets a screen of
          its own to be looked at before the figure starts being built, instead
          of flashing past between the hero and the bronze.
        */}
        <div className="relative min-h-[150vh]">
          <div className="sticky top-0 min-h-screen flex items-center px-6 py-28">
            <div className="max-w-6xl mx-auto w-full">
              <div className="max-w-2xl">
                <Eyebrow tone="primary">the lineage</Eyebrow>
                <h2 className="serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3.4rem)] mt-5 text-white">
                The vocabulary is{" "}
                <mark className="bg-primary text-black px-2 py-0.5 box-decoration-clone rounded-[2px]">
                  two thousand years old
                </mark>
                .
              </h2>
                <div className="serif text-[1.02rem] sm:text-[1.09rem] leading-[1.66] text-white/65 max-w-[62ch] space-y-4 mt-8">
                <p>
                  The hasta mudras this engine recognises are set down in the Natya Shastra and
                  codified in the Abhinaya Darpana — a closed vocabulary of hand shapes, each
                  with an assigned range of meanings, learned by repetition under a teacher.
                </p>
                <p>
                  <strong className="font-semibold text-white">
                    Nothing here is trying to replace that teacher.
                  </strong>{" "}
                  A camera can tell you your ring finger is two knuckles out of position at
                  eleven at night, when there is no one else in the room to say so. That is the
                  whole claim.
                </p>
              </div>
                <div className="mt-10">
                  <Pill href="/about" variant="ghost" className="border-white/25 text-white/80">
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
        The second of the two lines the figure changes on: its top border. Above
        it the figure is a sketch, below it it is built. Both boundaries are real
        rules on the page, so the change lands on an edge the reader can see —
        which is what stops a state change reading as a rendering fault.
      */}
      <div id="what" className="relative z-10 border-t border-foreground/12">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/45 pointer-events-none" />
        {/* Not `ruled`: the wrapper above draws that line, and it is the
            boundary the figure changes on. */}
        <Section className="relative">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-10 lg:gap-16">
          <div>
            <Eyebrow tone="primary">what this is</Eyebrow>
            <Headline className="mt-5">
              A camera, twenty-one landmarks, and <Mark>nothing leaving the device</Mark>.
            </Headline>
          </div>
          <Prose>
            <p>
              NrityaVaani reads a Bharatanatyam hand gesture from a live camera and tells you
              which finger is wrong and which way to move it. The tracking is Google MediaPipe
              running in your browser tab; the classification is a set of geometric rules over
              the twenty-one points it returns.
            </p>
            <p>
              Both halves matter. A model that only returns a label can tell a student they
              are wrong but not how, which is the part a teacher provides.{" "}
              <strong>Because the rules are geometry rather than a black box</strong>, the
              engine can name the joint at fault — and because inference is on-device, no
              frame of video is ever uploaded.
            </p>
          </Prose>
        </div>

        <FigureRow className="mt-16 md:mt-20">
          <Figure value="28" caption="mudras documented" />
          <Figure value="21" unit="per hand" caption="tracked landmarks" />
          <Figure value="0" unit="frames" caption="uploaded to a server" />
          <Figure value="On-device" caption="where inference runs" />
        </FigureRow>
        </Section>
      </div>

      <div className="relative z-10 bg-background">
        <MudraIndex />
      </div>

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
              title: "Track",
              body: "MediaPipe Hands returns twenty-one 3D landmarks per frame — four joints per finger plus the wrist — straight from the camera, inside the tab.",
              href: "/research#tracking",
              link: "The tracking model",
            },
            {
              n: "02",
              title: "Measure",
              body: "Each mudra is a set of conditions over those points: which fingers must read extended, which must be bent, which fingertips must touch, and how far apart the rest may drift.",
              href: "/research#correction",
              link: "The rule set",
            },
            {
              n: "03",
              title: "Correct",
              body: "A failing condition names the joint that failed it, so the feedback is 'your ring finger is straight and should be folded' rather than a confidence score.",
              href: "/research#analytics",
              link: "How feedback is derived",
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
              Recognition and the full library are free and always will be — they run on your
              own machine, so they cost nothing to serve. The paid tiers buy stored history,
              deeper per-finger analysis and, for academies, multi-student tracking.
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
                "Real-time mudra recognition",
                "All 28 library entries",
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
                "Per-finger corrective feedback",
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
                "Custom mudra sets",
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
            Open the camera and hold a <Mark>Pataka</Mark>.
          </Headline>
          <div className="flex flex-wrap gap-3">
            <Pill href="/live" variant="solid">
              Start live detection
            </Pill>
            <Pill href="/library">Browse the library</Pill>
          </div>
        </div>
        <FactStrip
          className="mt-14"
          items={["Bharatanatyam", "Asamyukta Hasta", "MediaPipe Hands", "On-device inference"]}
        />
      </Section>
    </div>
  );
}
