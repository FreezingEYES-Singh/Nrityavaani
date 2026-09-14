/**
 * The figure's controllable joints, as one ordered list.
 *
 * This is the *action space*: the complete set of things a controller — hand
 * written, learned, or eventually a reinforcement-learning policy — is allowed
 * to move. Everything downstream is defined against it, so two properties
 * matter more than anything else here.
 *
 * **The order is the file format.** `poseCodec` lays a pose out as a flat
 * vector by walking this list, and a dataset written today has to still decode
 * next month. Appending is safe; inserting, removing or reordering is not, and
 * silently invalidates every `.nvmotion` ever written. `LAYOUT` exists to make
 * that break loud instead of quiet.
 *
 * **The IK bones are not here.** `KneeIK`, `LegIK`, `ElbowIK` and `HandIK` came
 * through the Blender export as ordinary bones, but they carry no skin weight
 * and drive nothing — they are controls, not anatomy. Handing them to a policy
 * would give it 24 degrees of freedom that move nothing and reward nothing.
 *
 * The chain assumed here is the repaired one. `repairLegs` re-parents each foot
 * onto its shin; before it runs the feet hang off `LegIK` and rotating a hip
 * leaves them behind in space.
 */

import { limitFor } from "@/components/three/figureConstraints";

export type Axis = "x" | "y" | "z";
export type Group = "spine" | "arm" | "hand" | "leg";
export type Side = "L" | "R";

export interface Joint {
  /** `boneKey` form — the export's suffixes stripped, e.g. `UpperArm.L_18` becomes `UpperArmL`. */
  key: string;
  /** The name without its side, which is how joint limits are keyed. */
  stem: string;
  side: Side | null;
  group: Group;
  /**
   * Axes that genuinely articulate.
   *
   * Metadata, not enforcement: the codec stores a full rotation per joint
   * regardless, because a network learns a smooth 6D rotation far better than
   * it learns a constrained Euler triple. This is here for stage 5, where a
   * physics joint has to be built as a hinge or a ball, and for anyone reading
   * the list to understand what the body can actually do.
   */
  dof: Axis[];
  /** Degrees, per axis. */
  limit: Partial<Record<Axis, [number, number]>>;
}

/**
 * Bump when the joint list changes shape.
 *
 * Written into every dataset header and checked on load, so an old file meets
 * a clear refusal rather than decoding into a subtly wrong body.
 */
export const LAYOUT = 1;

/**
 * Limits for the joints `figureConstraints` has no entry for.
 *
 * That table was written for posing hands and arms into mudras, so it covers
 * the upper body and stops at the pelvis. A full-body controller needs the rest,
 * and needs it to be anatomy rather than a guess: a knee that can hyperextend
 * is how a learned pose prior discovers that walking backwards through the shin
 * is cheaper than balancing.
 *
 * Degrees. Ranges are deliberately a little wider than a comfortable person,
 * because a dancer in araimandi lives near the end of several of them.
 */
const EXTRA: Record<string, Partial<Record<Axis, [number, number]>>> = {
  // The root. Free in yaw — a dancer turns through a full circle — and limited
  // in the other two only to keep a pose prior from inverting the whole body.
  Pelvis: { x: [-40, 40], y: [-180, 180], z: [-40, 40] },
  Belly: { x: [-30, 45], y: [-35, 35], z: [-30, 30] },
  Chest: { x: [-25, 35], y: [-35, 35], z: [-25, 25] },
  // Thigh. The deep flexion is what sitting cross-legged costs.
  Hip: { x: [-125, 30], y: [-45, 45], z: [-50, 35] },
  // Knee: a hinge, and one that must not pass through straight.
  Shin: { x: [0, 150] },
  Foot: { x: [-50, 25], y: [-20, 20], z: [-25, 25] },
  Toes: { x: [-30, 60] },
};

const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"] as const;
const SIDES: Side[] = ["L", "R"];

function joint(stem: string, side: Side | null, group: Group, dof: Axis[]): Joint {
  return {
    key: side ? `${stem}${side}` : stem,
    stem,
    side,
    group,
    dof,
    // The upper body's limits stay owned by `figureConstraints`, which is what
    // the mudra poser already clamps against. Duplicating them here would let
    // the two drift, and a pose legal to one and illegal to the other is a bug
    // that only shows up as a hand slowly leaving a mudra.
    limit: limitFor(stem) ?? EXTRA[stem] ?? {},
  };
}

function build(): Joint[] {
  const out: Joint[] = [];
  const xyz: Axis[] = ["x", "y", "z"];

  // --- Spine, bottom to top ------------------------------------------------
  for (const stem of ["Pelvis", "Belly", "Chest", "Neck", "Head"]) {
    out.push(joint(stem, null, "spine", xyz));
  }

  // --- Arms ----------------------------------------------------------------
  for (const side of SIDES) {
    out.push(joint("Collar", side, "arm", xyz));
    out.push(joint("UpperArm", side, "arm", xyz));
    // The elbow bends on one axis and twists on a second. It has no third.
    out.push(joint("Forearm", side, "arm", ["x", "y"]));
    out.push(joint("Palm", side, "arm", xyz));
  }

  // --- Fingers -------------------------------------------------------------
  //
  // Thirty joints, and the reason this whole exercise is harder than a
  // locomotion controller. Nearly every published humanoid has stub hands,
  // because fingers do not affect balance — but a mudra *is* the fingers, so
  // they are first-class here.
  for (const side of SIDES) {
    for (const finger of FINGERS) {
      for (let i = 1; i <= 3; i++) {
        // Knuckles spread as well as curl; the joints past them only curl.
        // The thumb's base is the exception, and carries the opposition that
        // every thumb-contact mudra is built on.
        const spreads = i === 1;
        out.push(joint(`${finger}${i}`, side, "hand", spreads ? xyz : ["x"]));
      }
    }
  }

  // --- Legs ----------------------------------------------------------------
  for (const side of SIDES) {
    out.push(joint("Hip", side, "leg", xyz));
    out.push(joint("Shin", side, "leg", ["x"]));
    out.push(joint("Foot", side, "leg", ["x", "z"]));
    out.push(joint("Toes", side, "leg", ["x"]));
  }

  return out;
}

/** Every controllable joint, in the order that defines the pose vector. */
export const JOINTS: readonly Joint[] = Object.freeze(build());

/** Where each joint sits in the vector, by `boneKey` name. */
export const INDEX: ReadonlyMap<string, number> = new Map(JOINTS.map((j, i) => [j.key, i]));

export const JOINT_COUNT = JOINTS.length;

/** Joints belonging to one group, for masking a loss or freezing a limb. */
export function groupOf(group: Group): number[] {
  const out: number[] = [];
  JOINTS.forEach((j, i) => {
    if (j.group === group) out.push(i);
  });
  return out;
}
