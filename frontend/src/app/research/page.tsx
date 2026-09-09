import { ArrowRight } from "lucide-react";
import Link from "next/link";
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

export const metadata = {
  title: "Research | NrityaVaani",
  description:
    "How NrityaVaani turns 21 hand landmarks into finger-by-finger feedback on a Bharatanatyam mudra, entirely in the browser.",
};

/**
 * The technical write-up.
 *
 * Kept as three numbered chapters with a sticky heading each, because that is
 * what the content is — a pipeline in order — and the old version's three
 * identical tilting glass panels flattened that sequence into a card grid.
 */

const CHAPTERS = [
  {
    id: "tracking",
    n: "01",
    title: "Tracking",
    standfirst: "Twenty-one landmarks per hand, read in the browser.",
    body: (
      <>
        <p>
          NrityaVaani trains no vision model of its own. It runs Google&rsquo;s MediaPipe{" "}
          <code className="mono text-[0.9em] text-foreground/85">hand_landmarker</code> task,
          which finds the hand and predicts twenty-one three-dimensional landmarks — the wrist
          plus four joints on each finger, in the standard MediaPipe ordering.
        </p>
        <p>
          The model is compiled to WebAssembly and runs on your own machine, so frames are read
          from the camera, classified and discarded without being uploaded.{" "}
          <strong>Everything downstream of those twenty-one points is ours.</strong>
        </p>
      </>
    ),
  },
  {
    id: "correction",
    n: "02",
    title: "Classification",
    standfirst: "Readable geometry rather than a black box — which is what makes per-finger feedback possible at all.",
    body: (
      <>
        <p>
          A mudra is defined by the relationship between fingers, not by where the hand is. For
          each finger we compute a continuous <em>extension score</em> from the distances between
          its joints, normalised by hand size, so the reading holds whether you are close to the
          camera or far from it.
        </p>
        <p>
          Each mudra is then a written rule over those scores and the distances between
          fingertips. Pataka asks for four extended fingers held close together; Kartarimukha
          asks for the same two fingers separated past a threshold. The highest-scoring rule
          wins, and its score is the confidence shown on screen.
        </p>
        <p>
          <strong>This is deliberately not a neural classifier.</strong> Because every rule is
          legible, the engine can say <em>which</em> finger is wrong and in which direction —
          &ldquo;bend your ring finger more&rdquo; — instead of only returning a label. That is
          the difference between a demo and something you can practise with.
        </p>
      </>
    ),
  },
  {
    id: "analytics",
    n: "03",
    title: "History",
    standfirst: "Your own sessions, kept on your own machine.",
    body: (
      <>
        <p>
          Each practice session records the mudra, how long you held it, and the best confidence
          you reached. Accuracy is the mean of those scores, and a mudra counts as mastered once
          you clear its threshold.
        </p>
        <p>
          That history is written to your browser&rsquo;s local storage. There is no analytics
          pipeline behind it and nothing is sent to a server —{" "}
          <strong>
            which also means clearing your browser data clears your history, and it does not
            follow you to another device.
          </strong>
        </p>
      </>
    ),
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen px-6 pt-32 pb-8">
      <div className="max-w-6xl mx-auto">
        <Eyebrow tone="primary">technical write-up</Eyebrow>
        <Headline as="h1" className="mt-5 max-w-4xl">
          Twenty-one points in, <Mark>a named wrong finger</Mark> out.
        </Headline>
        <Prose className="mt-8">
          <p>
            How NrityaVaani turns hand landmarks into finger-by-finger feedback on a
            Bharatanatyam mudra — entirely in the browser, with no video ever leaving the device.
          </p>
        </Prose>

        <FigureRow className="mt-14">
          <Figure value="21" unit="per hand" caption="landmarks tracked" />
          <Figure value="3" unit="per finger" caption="joint angles read" />
          <Figure value="28" caption="mudras in the rule set" />
          <Figure value="WASM" caption="how the model runs" />
        </FigureRow>
      </div>

      {CHAPTERS.map((chapter) => (
        <Section key={chapter.id} id={chapter.id} ruled className="scroll-mt-28">
          <div className="grid lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-10 lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-baseline gap-4">
                <span className="mono text-[11px] text-primary tabular-nums">{chapter.n}</span>
                <h2 className="serif text-[clamp(1.7rem,3.4vw,2.5rem)] leading-none tracking-tight">
                  {chapter.title}
                </h2>
              </div>
              <p className="serif italic text-[1.05rem] leading-[1.5] text-foreground/55 mt-5 max-w-[38ch]">
                {chapter.standfirst}
              </p>
            </div>
            <Prose>{chapter.body}</Prose>
          </div>
        </Section>
      ))}

      <Section ruled className="pb-24">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 items-end">
          <Headline className="max-w-2xl">
            The quickest way to read this is to <Mark>hold a hand up</Mark>.
          </Headline>
          <div className="flex flex-wrap gap-3">
            <Pill href="/live" variant="solid">
              Try live detection
            </Pill>
            <Pill href="/library">Browse the mudras</Pill>
          </div>
        </div>

        <Rule className="mt-16 mb-8" />
        <div className="grid sm:grid-cols-[minmax(0,1fr)_auto] gap-6 items-baseline">
          <FactStrip items={["MediaPipe Hands", "WebAssembly", "Rule-based classifier", "localStorage"]} />
          <Link
            href="/about"
            className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-primary hover:gap-3 transition-all"
          >
            Who built it
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Section>
    </div>
  );
}
