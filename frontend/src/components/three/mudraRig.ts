import * as THREE from "three";
import posesJson from "@/lib/constants/mudraPoses.json";

/**
 * The mudra library, as joint angles and the landmark geometry they produce.
 *
 * Each mudra is 21 points in the same order MediaPipe emits, so the hero and
 * the live classifier describe a hand the same way. Both the angles and the
 * coordinates are baked by `scripts/build-mudra-poses.mjs` straight out of
 * `hand.glb`, which is what lets the glowing overlay land on the mesh: they
 * carry the model's own knuckle anchors and bone lengths rather than an
 * idealised hand's.
 *
 * Edit poses in the generator, not here, and re-run it:
 *   npm run build:poses
 * It re-checks every pose against the rules in `lib/mediapipe/classification.ts`
 * and refuses to write a pose its own classifier would not recognise.
 */

/** MediaPipe landmark connections, including the closed palm arch. */
export const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

/** Landmark index of each fingertip, which gets a brighter glow. */
export const TIPS = [4, 8, 12, 16, 20];

/**
 * Display size of the hand, wrist to middle fingertip. The baked file is
 * normalised to a reach of 1; the scene wants something it can frame, and the
 * camera distance and vertical offset in MudraHand3D are set against this.
 */
const REACH = 2.12;

/** One digit's joint angles, in degrees. See the generator for the conventions. */
export type DigitAngles = {
  abduct: number;
  lift: number;
  roll: number;
  flex: number[];
};

const DIGITS = ["thumb", "index", "middle", "ring", "pinky"] as const;
type Digit = (typeof DIGITS)[number];

export type JointAngles = Record<Digit, DigitAngles>;

/** One mudra's 21 landmarks. Treat as read-only: every frame borrows them. */
export type Landmarks = readonly THREE.Vector3[];

export type Mudra = {
  slug: string;
  name: string;
  meaning: string;
  note: string;
  joints: JointAngles;
  landmarks: Landmarks;
};

const anchors = posesJson.hand.anchors as Record<Digit | "wrist" | "thumbCmc", number[]>;
const segments = posesJson.hand.segments as Record<Digit, number[]>;

/**
 * Landmark each digit's joints occupy, base to tip.
 *
 * The thumb starts at landmark 1, its carpal joint, and so covers four points
 * from three segments — metacarpal, proximal, distal. That extra joint is what
 * lets it swing across the palm to meet the fingers; anchored at its knuckle
 * instead, it cannot reach them at all.
 */
const CHAIN_AT: Record<Digit, number[]> = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};

/** Where each digit's chain begins. The thumb's is its carpal joint. */
const ANCHOR_OF: Record<Digit, string> = {
  thumb: "thumbCmc",
  index: "index",
  middle: "middle",
  ring: "ring",
  pinky: "pinky",
};

const DEG = Math.PI / 180;
const _u = new THREE.Vector3();
const _n = new THREE.Vector3();
const _side = new THREE.Vector3();
const _d = new THREE.Vector3();

/**
 * Walks one digit out from its anchor, mirroring the generator's own solver.
 *
 * Kept here rather than only in the build step because a morph interpolates
 * *angles*, then has to turn them back into points every frame: bending the
 * joints through their arc is what makes the hand move like a hand instead of
 * sliding its fingertips along straight lines.
 */
function solveDigit(digit: Digit, a: DigitAngles, out: THREE.Vector3[]) {
  const abduct = a.abduct * DEG;
  const lift = a.lift * DEG;
  _u.set(Math.sin(abduct) * Math.cos(lift), Math.cos(abduct) * Math.cos(lift), Math.sin(lift));

  // The plane the joints hinge in: out of the palm for fingers, rolled round
  // the digit's own axis for the thumb, which is why a thumb folds across the
  // palm rather than forward off it.
  _n.set(0, 0, 1).addScaledVector(_u, -_u.z);
  if (_n.lengthSq() < 1e-12) _n.set(1, 0, 0);
  _n.normalize();
  _side.crossVectors(_u, _n);
  const roll = a.roll * DEG;
  _n.multiplyScalar(Math.cos(roll)).addScaledVector(_side, Math.sin(roll));

  const segs = segments[digit];
  const at = CHAIN_AT[digit];
  const base = anchors[ANCHOR_OF[digit] as keyof typeof anchors];
  let theta = 0;
  let px = base[0];
  let py = base[1];
  let pz = base[2];
  out[at[0]].set(px * REACH, py * REACH, pz * REACH);

  for (let i = 0; i < segs.length; i++) {
    theta += (a.flex[i] ?? a.flex[a.flex.length - 1]) * DEG;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    _d.copy(_u).multiplyScalar(c).addScaledVector(_n, s);
    px += _d.x * segs[i];
    py += _d.y * segs[i];
    pz += _d.z * segs[i];
    out[at[i + 1]].set(px * REACH, py * REACH, pz * REACH);
  }
}

/** Turns a set of joint angles into the 21 landmarks they describe. */
export function jointsToLandmarks(j: JointAngles, out: THREE.Vector3[]) {
  const w = anchors.wrist;
  out[0].set(w[0] * REACH, w[1] * REACH, w[2] * REACH);
  // The thumb writes landmark 1 itself now, from its own carpal anchor.
  for (const digit of DIGITS) solveDigit(digit, j[digit], out);
}

const readDigit = (d: DigitAngles): DigitAngles => ({
  abduct: d.abduct,
  lift: d.lift ?? 0,
  roll: d.roll ?? 0,
  flex: [...d.flex],
});

export const MUDRAS: Mudra[] = posesJson.mudras.map((m) => ({
  slug: m.slug,
  name: m.name,
  meaning: m.meaning,
  note: m.note,
  joints: Object.fromEntries(
    DIGITS.map((d) => [d, readDigit((m.joints as Record<string, DigitAngles>)[d])]),
  ) as JointAngles,
  landmarks: m.landmarks.map(([x, y, z]) => new THREE.Vector3(x * REACH, y * REACH, z * REACH)),
}));

/** A blank set of angles for the morph to write into. */
export function makeJointScratch(): JointAngles {
  return Object.fromEntries(DIGITS.map((d) => [d, readDigit(MUDRAS[0].joints[d])])) as JointAngles;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Blends two mudras into `out`, joint angle by joint angle.
 *
 * Interpolating the angles rather than the landmark positions is what keeps the
 * movement anatomical: every joint travels through its own arc, so a finger
 * unfurls and closes the way it hinges. Blending the points instead would drag
 * each fingertip along a straight line, cutting the corner through the palm.
 */
export function mixJoints(a: JointAngles, b: JointAngles, t: number, out: JointAngles) {
  for (const digit of DIGITS) {
    const x = a[digit];
    const y = b[digit];
    const o = out[digit];
    o.abduct = lerp(x.abduct, y.abduct, t);
    o.lift = lerp(x.lift, y.lift, t);
    o.roll = lerp(x.roll, y.roll, t);
    for (let i = 0; i < o.flex.length; i++) o.flex[i] = lerp(x.flex[i], y.flex[i], t);
  }
}
