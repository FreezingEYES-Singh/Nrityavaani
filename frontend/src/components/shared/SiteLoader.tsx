"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { loadNataraja, onNatarajaProgress } from "@/components/three/natarajaModel";

/**
 * The intro: the mark, then the name out from behind it, over a real meter.
 *
 * The percentage is not decoration. It is a weighted blend of the three things
 * the landing page is actually waiting on — the Nataraja model's bytes, the
 * document reaching `complete`, and the webfonts resolving — and it cannot
 * reach 100 until all three have genuinely finished.
 *
 * It refuses to trap anyone: it dismisses on completion, on failure, and on a
 * hard ceiling regardless. A slow connection should mean an unadorned hero,
 * never a page you cannot get past.
 */

/** Longest the overlay may hold the page, whatever the network is doing. */
const CEILING_MS = 7000;
/** Shortest it may stay, so the intro is never a flash of half an animation. */
const MIN_MS = 1750;

/**
 * What each signal is worth. The model dominates because it is both the
 * largest asset and the one the hero cannot draw without.
 */
const W_MODEL = 0.6;
const W_DOC = 0.25;
const W_FONTS = 0.15;

/**
 * Plays once per page load, not once per mount. This component lives on the
 * landing page, so a client-side navigation back to `/` would otherwise replay
 * the whole intro at someone who has already sat through it. A real reload
 * clears the module, which is the behaviour you want.
 */
let alreadyPlayed = false;

export default function SiteLoader() {
  // It is mounted from the root layout so it can sit above every other layer,
  // but it belongs to the landing page: that is the route whose hero waits on
  // the model, and so the only route where the meter would be measuring
  // anything real. Read on the server too, so the overlay is in the first HTML
  // rather than popping in after hydration.
  const onLanding = usePathname() === "/";

  // Skipping has to be decided before the first paint, or the overlay flashes
  // for a frame on every return to the landing page.
  const [done, setDone] = useState(() => alreadyPlayed);
  const [leaving, setLeaving] = useState(false);
  const [percent, setPercent] = useState(0);

  // The eased value the meter actually draws, kept out of state so the rAF
  // loop can drive it without a re-render per frame.
  const shown = useRef(0);

  // Whether *this* mount is the one playing the intro. Without it, anything
  // that tears down and re-runs the effect on a still-mounted component —
  // StrictMode's deliberate double-invoke, a Fast Refresh during development —
  // would find the module flag already set and bail, leaving an overlay on
  // screen with no progress loop behind it and a meter frozen at zero.
  const claimed = useRef(false);

  useEffect(() => {
    if (!onLanding) return;
    if (alreadyPlayed && !claimed.current) return;
    claimed.current = true;
    alreadyPlayed = true;

    const startedAt = performance.now();
    let raf = 0;
    let closed = false;

    // Real, unfaked signals. Each moves to 1 only when its thing is finished.
    const signal = { model: 0, doc: 0, fonts: 0 };
    // Whether the model download ever reported a content-length. Without one
    // there is no true ratio to read, so its share is estimated against time
    // and capped below full — an estimate that can stall, never one that lies
    // about being finished.
    let measured = false;

    const close = () => {
      if (closed) return;
      closed = true;
      // Hold for the remainder of the minimum, so a warm cache still gets the
      // intro rather than a single frame of it.
      const wait = Math.max(0, MIN_MS - (performance.now() - startedAt));
      window.setTimeout(() => {
        setLeaving(true);
        // Let the exit finish before the overlay leaves the tree, so it does
        // not vanish on the frame the transition starts.
        window.setTimeout(() => setDone(true), 700);
      }, wait);
    };

    const stopWatching = onNatarajaProgress((p) => {
      if (p.total > 0) measured = true;
      signal.model = p.ratio;
    });

    const settle = (key: keyof typeof signal) => () => {
      signal[key] = 1;
    };

    const model = loadNataraja().then(settle("model"), settle("model"));

    const doc = new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        signal.doc = 1;
        resolve();
        return;
      }
      window.addEventListener(
        "load",
        () => {
          signal.doc = 1;
          resolve();
        },
        { once: true },
      );
    });

    const fonts = (document.fonts?.ready ?? Promise.resolve()).then(settle("fonts"), settle("fonts"));

    Promise.all([model, doc, fonts]).then(close, close);
    const ceiling = window.setTimeout(close, CEILING_MS);

    const tick = () => {
      const elapsed = performance.now() - startedAt;

      // An unmeasured download contributes a time-based estimate instead of a
      // dead zero, held under its full share until it truly resolves.
      const modelPart =
        signal.model >= 1 || measured
          ? signal.model
          : Math.min(0.9, elapsed / (CEILING_MS * 0.8));

      const real = modelPart * W_MODEL + signal.doc * W_DOC + signal.fonts * W_FONTS;

      // Paced against the minimum the overlay is up for. On a warm cache every
      // signal lands inside 300ms, and an unpaced meter would snap to 100 and
      // then sit there for a second and a half — which reads as broken. The
      // pace only ever holds the number back, never pushes it past what has
      // actually loaded, so the figure stays true.
      const target = Math.min(real, elapsed / MIN_MS);

      // Ease toward the target and never backwards, so a signal landing all at
      // once reads as the meter filling rather than as a jump.
      shown.current = Math.max(shown.current, shown.current + (target - shown.current) * 0.12);
      const next = Math.min(100, Math.round(shown.current * 100));
      setPercent((prev) => (next > prev ? next : prev));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      stopWatching();
      cancelAnimationFrame(raf);
      window.clearTimeout(ceiling);
    };
  }, [onLanding]);

  if (done || !onLanding) return null;

  // Once the page is leaving there is nothing left to wait for, and a meter
  // frozen at 97 while the overlay fades is the one moment it would be lying.
  const display = leaving ? 100 : percent;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading NrityaVaani, ${display}%`}
      className={`nv-intro fixed inset-0 z-[200] grid place-items-center bg-background transition-opacity duration-[650ms] ease-out ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-9 px-6 transition-transform duration-[700ms] ease-out ${
          leaving ? "scale-[1.04]" : "scale-100"
        }`}
      >
        {/* The lockup. The mark lands first; the name comes out from under it. */}
        <div className="flex items-center" aria-hidden>
          <span className="nv-mark relative z-10 grid place-items-center rounded-[22%] bg-primary text-black font-bold shadow-[0_0_60px_-12px_var(--primary-glow)] w-14 h-14 text-[2rem] sm:w-16 sm:h-16 sm:text-[2.3rem] font-outfit">
            N
          </span>

          {/*
            `grid-template-columns` animating 0fr → 1fr is the one way to run a
            width transition to a content-sized track, which is what lets the
            mark sit dead centre before the name exists and drift left as it
            arrives. The child clips, so the name is genuinely hidden behind
            the mark rather than merely transparent over it.
          */}
          <span className="nv-reveal grid">
            <span className="overflow-hidden min-w-0">
              <span className="nv-slide block pl-3 sm:pl-4">
                <span className="nv-pop block whitespace-nowrap font-outfit font-semibold tracking-tight text-[2rem] sm:text-[2.3rem] leading-none">
                  Nritya<span className="text-primary">Vaani</span>
                </span>
              </span>
            </span>
          </span>
        </div>

        {/* The meter, and the only honest number on the screen. */}
        <div className="nv-meter w-[min(74vw,300px)]">
          <div className="h-px w-full bg-foreground/15 overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${display}%`, transition: "width 200ms linear" }}
            />
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              Loading
            </span>
            <span className="mono text-[10px] tabular-nums tracking-[0.1em] text-foreground/60">
              {display}%
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .nv-mark   { animation: nv-mark 620ms cubic-bezier(.34,1.56,.64,1) both; }
        .nv-reveal { grid-template-columns: 0fr; animation: nv-reveal 700ms cubic-bezier(.16,1,.3,1) 420ms both; }
        .nv-slide  { animation: nv-slide 700ms cubic-bezier(.16,1,.3,1) 420ms both; }
        .nv-pop    { transform-origin: left center; animation: nv-pop 340ms cubic-bezier(.34,1.56,.64,1) 1040ms both; }
        .nv-meter  { animation: nv-fade-up 520ms ease-out 900ms both; }

        @keyframes nv-mark {
          from { opacity: 0; transform: scale(.5) rotate(-14deg); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes nv-reveal {
          from { grid-template-columns: 0fr; }
          to   { grid-template-columns: 1fr; }
        }
        @keyframes nv-slide {
          from { opacity: 0; transform: translateX(-34px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes nv-pop {
          0%   { transform: scale(1); }
          45%  { transform: scale(1.075); }
          100% { transform: scale(1); }
        }
        @keyframes nv-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }

        /* Anyone who has asked for less motion still gets the mark, the name
           and the meter — just handed to them rather than performed. */
        @media (prefers-reduced-motion: reduce) {
          .nv-mark, .nv-slide, .nv-pop, .nv-meter { animation: none; opacity: 1; transform: none; }
          .nv-reveal { animation: none; grid-template-columns: 1fr; }
          .nv-intro, .nv-intro * { transition-duration: 1ms !important; }
        }
      `}</style>
    </div>
  );
}
