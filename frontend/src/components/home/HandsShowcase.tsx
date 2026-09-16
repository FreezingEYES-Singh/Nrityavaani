"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Hand } from "lucide-react";

function Waiting() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <Hand className="h-7 w-7 text-primary/40 motion-safe:animate-pulse" />
    </div>
  );
}

// three.js, the pose table and hand.glb, fetched only when the section is near.
const HandsStage = dynamic(() => import("@/components/home/HandsStage"), {
  ssr: false,
  loading: Waiting,
});

/**
 * The square the homepage's 3D hand lives in.
 *
 * The hand is well down the page, so its scene is not built — or even
 * downloaded — until the square comes within half a screen of view. Until
 * then, and while it loads, the square holds its size with a placeholder, so
 * the page does not shift when the hand arrives.
 */
export default function HandsShowcase({ className = "" }: { className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={frame} className={`relative aspect-square w-full ${className}`}>
      {near ? <HandsStage /> : <Waiting />}
    </div>
  );
}
