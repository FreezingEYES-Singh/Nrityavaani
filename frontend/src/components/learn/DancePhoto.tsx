import Image from "next/image";
import type { Dance } from "@/lib/constants/dances";

/**
 * Where each photograph sits in the 4:5 frame, as a CSS `object-position`.
 *
 * Set by eye, photo by photo, so the crop keeps the dancer rather than the
 * stage. Most are full-length portraits a little taller than the frame, so the
 * question is which end to give up: the empty floor under Bharatanatyam and
 * Kuchipudi, the banner text over Kathak, the dark stage above the Odissi pair,
 * the hem of the Manipuri costume rather than the turban. Kathakali is the odd
 * one out, a wide group shot, anchored on its three right-hand figures.
 *
 * Tuned for this frame only — a landscape frame crops the other way and wants
 * other anchors, which is why these live beside the frame and not on `Dance`.
 */
const CROP: Record<string, string> = {
  bharatanatyam: "50% 65%",
  kathak: "50% 100%",
  kathakali: "100% 50%",
  kuchipudi: "50% 70%",
  odissi: "50% 100%",
  manipuri: "50% 45%",
  mohiniyattam: "50% 40%",
};

/**
 * A dance's photograph in a portrait frame, credited underneath.
 *
 * The photographs are freely licensed and their licences ask for the credit,
 * so it is on unless `credit` is turned off — which only a list thumbnail does,
 * one tap from the dance's own page, where the same photo carries it.
 */
export default function DancePhoto({
  dance,
  sizes,
  credit = true,
  className = "",
}: {
  dance: Dance;
  /** The `next/image` sizes hint: how wide the frame is drawn at each breakpoint. */
  sizes: string;
  credit?: boolean;
  className?: string;
}) {
  const frame = (
    <span
      className={`relative block aspect-[4/5] overflow-hidden rounded-sm border border-foreground/12 bg-black ${
        credit ? "" : className
      }`}
    >
      <Image
        src={dance.image}
        alt={`${dance.name} in performance`}
        fill
        sizes={sizes}
        className="object-cover"
        style={{ objectPosition: CROP[dance.slug] ?? "50% 50%" }}
      />
    </span>
  );
  if (!credit) return frame;

  const { author, license, licenseUrl, page } = dance.attribution;
  const link = "underline-offset-2 transition-colors hover:text-primary hover:underline";
  return (
    <figure className={className}>
      {frame}
      <figcaption className="mono mt-2 text-[9px] uppercase tracking-[0.14em] text-foreground/40">
        Photo{" "}
        <a href={page} target="_blank" rel="noreferrer" className={link}>
          {author}
        </a>{" "}
        ·{" "}
        <a href={licenseUrl} target="_blank" rel="noreferrer" className={link}>
          {license}
        </a>
      </figcaption>
    </figure>
  );
}
