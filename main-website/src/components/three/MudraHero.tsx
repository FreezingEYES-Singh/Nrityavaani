"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Hand, MousePointer2 } from "lucide-react";
import { MUDRAS } from "./mudraRig";
// Type only, so the dynamic import above still keeps three.js off the
// server render and off the critical path.
import type { MudraHandHandle } from "./MudraHand3D";

// Keep three.js out of the server render and off the critical path.
const MudraHand3D = dynamic(() => import("./MudraHand3D"), {
  ssr: false,
  loading: () => null,
});

export default function MudraHero() {
  const [active, setActive] = useState(0);
  const mudra = MUDRAS[active];
  // The hand builds its scene once and runs on its own clock, so the ticker
  // reaches it through a handle rather than by re-rendering it with a prop.
  const hand = useRef<MudraHandHandle | null>(null);

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden px-6 pt-28 pb-20 md:pt-24">
      {/* WebGL layer. Sits behind the copy on mobile, beside it on desktop. */}
      <div className="absolute inset-0 lg:left-[38%] pointer-events-none">
        <MudraHand3D
          onPoseChange={setActive}
          handleRef={hand}
          className="w-full h-full opacity-35 sm:opacity-55 lg:opacity-100"
        />
      </div>

      {/*
        Scrim. Below lg the hand sits directly behind the copy, so the gradient
        never fully clears; from lg it only shades the left column and lets the
        hand read at full strength on the right.
      */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background via-background/85 to-background/65 lg:via-background/40 lg:to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-[minmax(0,1fr)_38%] gap-12 items-center">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-8 backdrop-blur-md"
          >
            <Hand className="w-3 h-3" />
            <span>21 landmarks &middot; on your device</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06 }}
            className="text-[13vw] sm:text-6xl md:text-7xl xl:text-8xl font-black mb-8 leading-[0.88] tracking-tighter"
          >
            Learn every
            <br />
            <span className="text-primary text-shadow-glow">mudra</span> by
            <br />
            <span className="text-accent-gold italic serif">doing it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14 }}
            className="text-foreground/70 text-lg md:text-xl max-w-xl mb-10 leading-relaxed"
          >
            Hold a Bharatanatyam hand gesture in front of your camera and get
            corrective feedback finger by finger &mdash; in real time, without a
            single frame of video leaving your device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6"
          >
            <Link
              href="/live"
              className="premium-button flex items-center justify-center gap-3 group py-4 px-9 text-base"
            >
              <span>Start Live Detection</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link
              href="/library"
              className="secondary-button justify-center py-4 px-9 text-base"
            >
              Browse 28 mudras
            </Link>
          </motion.div>
        </div>

        {/* Live caption for whatever the hand is currently forming. */}
        <div className="hidden lg:flex justify-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={mudra.slug}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-6 w-[19rem] pointer-events-auto"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-primary">
                  Now forming
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-1">{mudra.name}</h2>
              <p className="text-accent-gold italic serif text-lg mb-4">{mudra.meaning}</p>
              <p className="text-foreground/70 text-sm leading-relaxed mb-5">{mudra.note}</p>
              <Link
                href={`/library/${mudra.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
              >
                Open in library
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pose ticker + drag hint */}
      <div className="absolute bottom-8 left-0 right-0 px-6 z-10">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {MUDRAS.map((m, i) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => hand.current?.goTo(i)}
                aria-current={i === active ? "true" : undefined}
                title={`Form ${m.name} — ${m.meaning}`}
                className={`text-[11px] font-bold tracking-[0.16em] uppercase transition-colors duration-500 cursor-pointer rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  i === active ? "text-primary" : "text-foreground/35"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <span className="hidden md:flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-foreground/40 shrink-0">
            <MousePointer2 className="w-3.5 h-3.5" />
            Move to rotate
          </span>
        </div>
      </div>
    </section>
  );
}
