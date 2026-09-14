"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Hand } from "lucide-react";
import type { Mudra } from "@/components/three/mudraRig";

// three.js, the pose table and hand.glb arrive only when the hand is first
// wanted, so a visit that never hovers the button never downloads any of it.
const IdentifyMudraHand = dynamic(() => import("@/components/learn/IdentifyMudraHand"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <Hand className="h-6 w-6 text-primary/50 motion-safe:animate-pulse" />
    </div>
  ),
});

/** How long the pointer has to rest on the button first, so sweeping past it opens nothing. */
const HOVER_INTENT_MS = 120;

/**
 * "Identify a mudra": a link to live detection that, on hover, shows the 3D
 * hand forming the mudras the detector knows.
 *
 * The hand is a preview, not a menu. It ignores the pointer and closes as soon
 * as the pointer leaves the button, so it never stands between the reader and
 * the parts listed underneath. Touch has no hover; a tap just follows the link.
 *
 * The scene is built on the first hover and then kept. Closing leaves the card
 * at `display: none` once it has faded, which the hand's own
 * IntersectionObserver reads as off screen, so it stops rendering until the
 * next hover — rather than every hover creating a fresh WebGL context.
 */
export default function IdentifyMudra({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [mudra, setMudra] = useState<Mudra | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const hintId = useId();

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setArmed(true);
      setOpen(true);
    }, delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${className}`}>
      <div className="relative">
        <Link
          href="/live"
          aria-describedby={hintId}
          onPointerEnter={(e) => {
            if (e.pointerType !== "touch") show(HOVER_INTENT_MS);
          }}
          onPointerLeave={hide}
          onFocus={(e) => {
            // Keyboard focus only: a click focuses the link too, and is already leaving.
            if (e.currentTarget.matches(":focus-visible")) show(0);
          }}
          onBlur={hide}
          onKeyDown={(e) => {
            if (e.key === "Escape") hide();
          }}
          className="mono inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-black transition-colors duration-200 hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Hand className="h-4 w-4" />
          Identify a mudra
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <div
          aria-hidden
          className={`pointer-events-none absolute top-full left-0 z-40 mt-3 w-[20rem] overflow-hidden rounded-xl border border-foreground/15 bg-background shadow-2xl shadow-black/40 transition duration-200 ease-out transition-discrete motion-reduce:transition-none ${
            open ? "block starting:translate-y-1 starting:opacity-0" : "hidden translate-y-1 opacity-0"
          }`}
        >
          <div className="h-72">{armed && <IdentifyMudraHand onMudra={setMudra} />}</div>
          <div className="min-h-[5.75rem] border-t border-foreground/12 px-5 py-4">
            {mudra && (
              <>
                <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary">Now forming</p>
                <p className="serif mt-1.5 text-[1.4rem] leading-tight">{mudra.name}</p>
                <p className="serif text-[0.95rem] italic leading-snug text-foreground/55">
                  {mudra.meaning}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <p id={hintId} className="serif text-[1rem] italic text-foreground/55">
        Hold a hand gesture up to your camera to see which mudra it is.
      </p>
    </div>
  );
}
