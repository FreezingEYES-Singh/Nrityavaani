"use client";

import { useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import MudraHand3D, { type MudraHandHandle } from "@/components/three/MudraHand3D";
import { MUDRAS } from "@/components/three/mudraRig";

/**
 * The homepage's 3D hand: it forms each mudra in turn, names the one it is
 * holding, and forms any of them on request.
 *
 * Everything that needs three.js and the pose table is in this module, which
 * `HandsShowcase` loads only once the section is near the screen. The text sits
 * over the hand's own square rather than below it, so nothing moves when this
 * replaces the placeholder.
 */
export default function HandsStage() {
  const [active, setActive] = useState(0);
  // The hand runs on its own clock; the names reach it through a handle rather
  // than by re-rendering it with a prop.
  const hand = useRef<MudraHandHandle | null>(null);
  const mudra = MUDRAS[active];

  return (
    <>
      <MudraHand3D onPoseChange={setActive} handleRef={hand} className="absolute inset-0" />

      <div className="pointer-events-none absolute top-0 left-0">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-primary font-medium">Now forming</p>
        <p className="serif mt-1.5 text-[1.6rem] leading-tight text-foreground">{mudra.name}</p>
        <p className="serif text-[1rem] italic text-foreground/70 dark:text-foreground/55">{mudra.meaning}</p>
      </div>

      <p className="mono pointer-events-none absolute top-1 right-0 hidden items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-foreground/60 dark:text-foreground/40 sm:flex">
        <MousePointer2 className="h-3.5 w-3.5" />
        Move to turn
      </p>

      <div className="absolute right-0 bottom-0 left-0 flex flex-wrap gap-x-4 gap-y-2">
        {MUDRAS.map((m, i) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => hand.current?.goTo(i)}
            aria-pressed={i === active}
            title={`Form ${m.name} — ${m.meaning}`}
            className={`mono rounded-sm text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              i === active
                ? "text-primary font-semibold"
                : "text-foreground/60 dark:text-foreground/40 hover:text-foreground"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>
    </>
  );
}
