"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DANCES } from "@/lib/constants/dances";

/**
 * A stacked deck of the classical dances, for the right side of the hero.
 *
 * The deck cycles itself: the top card slides down out of view and the next
 * card rises to the top, in an endless conveyor. That is the "shuffle" — no
 * mouse involved, so the hero moves on its own the moment it loads.
 *
 * Hovering the top card flips it to its back, which carries the facts, and
 * pauses the shuffle until the mouse leaves. Only the top card is interactive:
 * a card half-buried in the stack has nothing to flip toward the reader.
 *
 * The whole thing is a single spring on each card's stack position, so the
 * shuffle is the cards *moving* to their new ranks rather than a crossfade —
 * which is what makes it read as a deck being dealt rather than a slideshow.
 */

/** How many cards are visible in the stack at once. */
const VISIBLE = 4;
/** Vertical offset between ranks, in px. */
const RANK_GAP = 26;
/** How long a card holds the top before the deck advances. */
const HOLD_MS = 3000;

export default function DanceDeck() {
  // `order` is a rotation of dance indices; `order[0]` is the card on top.
  const [order, setOrder] = useState<number[]>(() => DANCES.map((_, i) => i));
  // The dance index of the card currently turned over (null = none).
  const [flipped, setFlipped] = useState<number | null>(null);

  const paused = flipped !== null;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    // From lg the deck shares the first screen with the copy, so it takes the height the
    // hero's padding leaves (8rem) at its 22:38 shape. 35rem is the floor: any narrower
    // and the five sections on the back of a card no longer fit.
    <div className="relative w-64 sm:w-72 lg:w-auto lg:aspect-[22/38] h-[30rem] sm:h-[33rem] lg:h-[clamp(35rem,100svh_-_8rem,38rem)] mx-auto lg:mr-0">
      {order.map((danceIdx, pos) => {
        const dance = DANCES[danceIdx];
        const top = pos === 0;
        const turned = top && flipped === danceIdx;

        return (
          <motion.div
            key={dance.slug}
            className={`absolute inset-x-0 top-0 [perspective:1200px] ${
              top ? "" : "pointer-events-none"
            }`}
            initial={false}
            animate={{
              y: pos * RANK_GAP,
              scale: 1 - Math.min(pos, VISIBLE - 1) * 0.06,
              rotate: pos % 2 ? 2.5 : -2.5,
              opacity: pos < VISIBLE ? 1 : 0,
              zIndex: 20 - pos,
            }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
          >
            <motion.div
              className="relative w-full [transform-style:preserve-3d] cursor-pointer"
              animate={{ rotateY: turned ? 180 : 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              onHoverStart={() => top && setFlipped(danceIdx)}
              onHoverEnd={() => setFlipped((f) => (f === danceIdx ? null : f))}
            >
              {/* Front — the photograph, with the name beneath it like a card. */}
              <div className="relative [backface-visibility:hidden] rounded-sm border border-foreground/20 bg-background overflow-hidden">
                <div className="relative aspect-[3/4] bg-black">
                  <Image
                    src={dance.image}
                    alt={`A ${dance.name} dancer`}
                    fill
                    sizes="(min-width: 1024px) 22rem, 16rem"
                    className="object-cover"
                  />
                </div>
                <div className="px-4 py-3.5 border-t border-foreground/12">
                  <p className="text-[0.95rem] font-semibold leading-tight">{dance.name}</p>
                  <p className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/45 mt-1">
                    {dance.region}
                  </p>
                </div>
              </div>

              {/* Back — the sections. */}
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-sm border border-primary/30 bg-[#120e09] p-5 lg:p-6 flex flex-col">
                <p className="mono text-[9px] uppercase tracking-[0.2em] text-primary">
                  {dance.region}
                </p>
                <h3 className="text-lg lg:text-xl font-semibold leading-tight mt-1.5">{dance.name}</h3>
                <p className="serif italic text-[0.82rem] lg:text-[0.92rem] text-foreground/60 mt-1">
                  {dance.essence}
                </p>

                <div className="mt-4 lg:mt-5 pt-4 border-t border-foreground/10 flex-1 flex flex-col justify-between gap-y-3">
                  {dance.sections.map((section, i) => {
                    // Show the first three everywhere; the fourth from `sm` up;
                    // all five on desktop, where the taller card has room for it.
                    const visible =
                      i < 3 ? "block" : i === 3 ? "hidden sm:block" : "hidden lg:block";
                    return (
                      <div key={section.title} className={visible}>
                        <p className="mono text-[8.5px] lg:text-[9px] uppercase tracking-[0.18em] text-primary/80">
                          {section.title}
                        </p>
                        <p className="text-[0.74rem] lg:text-[0.8rem] leading-snug text-foreground/75 mt-1">
                          {section.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}

      <p className="absolute -bottom-7 inset-x-0 text-center mono text-[9px] uppercase tracking-[0.2em] text-foreground/35">
        hover to flip
      </p>
    </div>
  );
}
