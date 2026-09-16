import Image from "next/image";
import { Linkedin } from "lucide-react";
import {
  Eyebrow,
  FactStrip,
  Headline,
  Mark,
  Pill,
  Prose,
  Rule,
  Section,
} from "@/components/ui/editorial";

export const metadata = {
  title: "About | NrityaVaani",
  description: "Who built NrityaVaani, how it was made, and where it is going.",
};

const STAGES = [
  { n: "01", title: "Research", desc: "Studied Bharatanatyam mudras, the existing tools, and the gaps in digital learning." },
  { n: "02", title: "Data", desc: "Collected and prepared datasets of mudras for training." },
  { n: "03", title: "Models", desc: "Trained models to identify and classify hand gestures." },
  { n: "04", title: "Interface", desc: "Built an interface for real-time use and feedback." },
  { n: "05", title: "Refinement", desc: "Continuously improved accuracy, usability and performance." },
];

const TEAM = [
  {
    name: "Divyanand Pandey",
    role: "Team lead",
    img: "/divyanand1.jpg.jpeg",
    linkedin: "https://www.linkedin.com/in/divyanand-pandey-5b2b152b9",
  },
  {
    name: "Mayank",
    role: "Team member",
    img: "/mayank.jpg.jpeg",
    linkedin: "https://www.linkedin.com/in/mayank-850255381",
  },
  {
    name: "Pranav Jithesh",
    role: "Team member",
    img: "/pranav.jpg.jpeg",
    linkedin: "https://www.linkedin.com/in/pranav-jithesh-5b7055367",
  },
];

const NEXT = [
  "A mobile app, for wider reach",
  "Better accuracy from stronger models",
  "Support for other classical forms",
  "Guided learning modules",
  "Collaboration with dance institutions",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen px-6 pt-32 pb-8">
      <div className="max-w-6xl mx-auto">
        <Eyebrow tone="primary">about</Eyebrow>
        <Headline as="h1" className="mt-5 max-w-4xl">
          A student project that turned into <Mark>something that works</Mark>.
        </Headline>
        <Prose className="mt-8">
          <p>
            NrityaVaani blends Indian classical dance with computer vision, to help people
            learn, check and keep the hand vocabulary of Bharatanatyam. It is built by three
            students under the name DivyCoders.
          </p>
        </Prose>
        <FactStrip
          className="mt-10"
          items={["DivyCoders", "Bharatanatyam", "Dron Tech Fest 2026", "3rd place"]}
        />
      </div>

      {/* ------------------------------------------------------------ the story */}
      <Section ruled>
        <div className="grid lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] gap-10 lg:gap-16">
          <div>
            <Eyebrow tone="primary">the story</Eyebrow>
            <h2 className="serif text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.1] tracking-tight mt-4">
              It began as a problem nobody had solved for us.
            </h2>
          </div>
          <Prose>
            <p>
              NrityaVaani started early in our college years, while we were looking at how
              technology might answer a real cultural problem. Learning mudras is hard without
              a teacher in the room, and there was no accessible system to help.
            </p>
            <p>
              So we built one from scratch — research first, then datasets, then working out
              how a model could read a human gesture at all.
            </p>
            <p>
              <strong>
                What began as a concept became a working prototype through experiment, failure
                and repetition.
              </strong>{" "}
              We took 3rd prize in our first hackathon, and 3rd again at the Inter-College Dron
              Tech Fest 2026 startup pitch.
            </p>
          </Prose>
        </div>
      </Section>

      {/* ------------------------------------------------------------ approach */}
      <Section ruled>
        <Eyebrow tone="primary">how it was built</Eyebrow>
        <Headline className="mt-5 max-w-3xl">Five stages, in order.</Headline>
        <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10">
          {STAGES.map((stage) => (
            <li key={stage.n}>
              <Rule className="mb-5" />
              <div className="flex items-baseline gap-3">
                <span className="mono text-[10px] text-primary tabular-nums">{stage.n}</span>
                <h3 className="serif text-[1.25rem] leading-none tracking-tight">{stage.title}</h3>
              </div>
              <p className="serif text-[0.96rem] leading-[1.55] text-foreground/65 mt-4">
                {stage.desc}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------------ team */}
      <Section ruled>
        <div className="grid lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-end">
          <div>
            <Eyebrow tone="primary">team divycoders</Eyebrow>
            <Headline className="mt-5">Three students.</Headline>
          </div>
          <Prose>
            <p>
              Between us: the research, the datasets, the model work, the interface and the
              3D. Everything on this site was made by the three of us.
            </p>
          </Prose>
        </div>

        <ul className="mt-14 grid sm:grid-cols-3 gap-x-7 gap-y-10">
          {TEAM.map((person) => (
            <li key={person.name}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-foreground/5 border border-foreground/12">
                <Image
                  src={person.img}
                  alt={person.name}
                  fill
                  sizes="(min-width: 640px) 30vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[1.02rem] font-semibold leading-tight truncate">
                    {person.name}
                  </h3>
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 mt-1.5">
                    {person.role}
                  </p>
                </div>
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${person.name} on LinkedIn`}
                  className="text-foreground/35 hover:text-primary transition-colors shrink-0"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------------ next */}
      <Section ruled>
        <div className="grid lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] gap-10 lg:gap-16">
          <div>
            <Eyebrow tone="primary">what is next</Eyebrow>
            <h2 className="serif text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.1] tracking-tight mt-4">
              Where this goes from here.
            </h2>
          </div>
          <ul>
            {NEXT.map((item, i) => (
              <li
                key={item}
                className="flex items-baseline gap-5 py-4 border-t border-foreground/12"
              >
                <span className="mono text-[10px] text-foreground/30 tabular-nums shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[1.02rem] text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ------------------------------------------------------------ vision */}
      <Section ruled className="pb-24">
        <blockquote className="max-w-3xl">
          <p className="serif text-[clamp(1.5rem,3.2vw,2.2rem)] leading-[1.28] tracking-tight">
            To build a bridge between tradition and technology — making Indian classical dance
            more accessible, more interactive, and better known.
          </p>
          <footer className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45 mt-7">
            DivyCoders
          </footer>
        </blockquote>

        <div className="mt-12 flex flex-wrap gap-3">
          <Pill href="/live" variant="solid">
            Try live detection
          </Pill>
          <Pill href="/research">Read the technical write-up</Pill>
        </div>
      </Section>
    </div>
  );
}
