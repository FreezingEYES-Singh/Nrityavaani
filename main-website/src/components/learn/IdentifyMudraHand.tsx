"use client";

import MudraHand3D from "@/components/three/MudraHand3D";
import { MUDRAS, type Mudra } from "@/components/three/mudraRig";

/**
 * The 3D hand behind "Identify a mudra", reporting each mudra it forms by name
 * rather than by index.
 *
 * A module of its own because this is where three.js comes in: `IdentifyMudra`
 * loads it on first hover, and naming the mudra here keeps the pose table on
 * the lazy side of that split as well.
 */
export default function IdentifyMudraHand({ onMudra }: { onMudra: (mudra: Mudra) => void }) {
  return <MudraHand3D onPoseChange={(i) => onMudra(MUDRAS[i])} className="h-full w-full" />;
}
