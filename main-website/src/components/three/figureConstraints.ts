import * as THREE from "three";

/**
 * The rules that stop a pose putting a limb inside the body.
 *
 * Two independent guards, because they catch different mistakes:
 *
 * 1. **Joint limits** stop a bone reaching an angle no joint has — an elbow
 *    bending backwards, a wrist folding double. These are cheap and catch bad
 *    *input*.
 * 2. **Body collision** stops a limb that is individually plausible from ending
 *    up somewhere solid. Every joint in "hands inside the belly" is within
 *    range; it is the combination that is wrong, so no amount of per-joint
 *    clamping finds it.
 *
 * The body is modelled as a stack of elliptical capsules along the spine. An
 * ellipse rather than a circle because the torso measures about 0.33 across and
 * 0.28 front-to-back (read off the mesh, not guessed) — a circle fitted to that
 * is either too fat at the sides, letting the arms float, or too thin at the
 * front, letting the hands sink in.
 */

/**
 * Half-extents as a fraction of total figure height, measured off the mesh.
 *
 * `centreZ` matters more than it looks. The torso is not centred on the spine
 * bone — the chest measures +0.107 in front of it and −0.175 behind, so its
 * surface centre sits about 0.017 of height further back. A symmetric capsule
 * fitted to the total depth therefore pushes the *front* surface roughly 0.03
 * too far forward, which is enough to swallow two hands held at the sternum and
 * report a correct namaste as a collision.
 */
type Girth = { halfWidth: number; halfDepth: number; centreZ: number };

/**
 * The spine, bottom to top. Each entry is the segment running from that bone to
 * the next, with the girth of the body around it.
 *
 * Numbers come from binning the mesh vertices by height and taking the extent
 * about the spine: half-width held near 0.166 of a 2.0-tall figure through the
 * whole trunk (0.083 of height), while depth ran 0.28 at the chest and a little
 * less at the waist. The neck and head are narrower on both axes.
 */
const BONES = ["Pelvis", "Belly", "Chest", "Neck", "Head"];

/**
 * Girth per figure. They are measurably different — the female torso runs
 * about 0.055–0.065 of height deep against the male's 0.066–0.070, and sits
 * further back off the spine — so one shared table makes the female model too
 * fat and eases her arms out of a pose the male holds fine.
 */
const SPINE: Record<"male" | "female", Girth[]> = {
  male: [
    { halfWidth: 0.084, halfDepth: 0.066, centreZ: -0.014 },
    { halfWidth: 0.085, halfDepth: 0.070, centreZ: -0.011 },
    { halfWidth: 0.083, halfDepth: 0.070, centreZ: -0.017 },
    { halfWidth: 0.052, halfDepth: 0.056, centreZ: -0.010 },
    { halfWidth: 0.058, halfDepth: 0.064, centreZ: -0.005 },
  ],
  female: [
    { halfWidth: 0.084, halfDepth: 0.063, centreZ: -0.024 },
    { halfWidth: 0.083, halfDepth: 0.055, centreZ: -0.016 },
    { halfWidth: 0.082, halfDepth: 0.062, centreZ: -0.026 },
    { halfWidth: 0.050, halfDepth: 0.052, centreZ: -0.014 },
    { halfWidth: 0.055, halfDepth: 0.060, centreZ: -0.008 },
  ],
};

export type BodyKind = keyof typeof SPINE;

/** The spine as world-space segments, with the girth around each. */
function spineOf(mesh: THREE.SkinnedMesh, kind: BodyKind) {
  const bones = boneMap(mesh);
  const girths = SPINE[kind];
  const out: { a: THREE.Vector3; b: THREE.Vector3; girth: Girth }[] = [];
  for (let i = 0; i < BONES.length - 1; i++) {
    const lo = bones.get(BONES[i]);
    const hi = bones.get(BONES[i + 1]);
    if (!lo || !hi) continue;
    out.push({
      a: worldOf(lo, new THREE.Vector3()),
      b: worldOf(hi, new THREE.Vector3()),
      girth: girths[i],
    });
  }
  return out;
}

/**
 * The points tested against the body.
 *
 * Fingertips and the wrist, plus a point partway down the forearm — the forearm
 * matters because a hand can clear the chest while the arm it is on passes
 * straight through the ribs, which looks worse than the hand ever would.
 *
 * The forearm is sampled at its midpoint rather than at its bone origin,
 * because that origin is the elbow, and the elbow is *meant* to sit against the
 * ribs. Probing it flagged a correct namaste as a collision and quietly walked
 * the arms back out of the pose.
 */
const PROBES: { from: string; to?: string; t?: number }[] = [
  { from: "Palm" },
  { from: "Middle2" },
  { from: "Index3" },
  { from: "Thumb3" },
  { from: "Pinky3" },
  { from: "Forearm", to: "Palm", t: 0.55 },
];

/**
 * How far outside the surface a limb must stay, as a fraction of height.
 *
 * Small, because namaste genuinely rests the hands against the sternum — a
 * generous margin here is indistinguishable from a body that is too fat.
 */
const CLEARANCE = 0.006;

export type Violation = { probe: string; side: "L" | "R"; depth: number };

/**
 * Reduces a bone name to the key poses and overrides are written against.
 *
 * The export suffixes every bone with its node index (`Forearm.L_18`) and
 * GLTFLoader then deletes the reserved characters, `.` among them, so what
 * reaches three is `ForearmL_18`. Normalising both sides is what stops a lookup
 * silently missing.
 */
export const boneKey = (name: string) => name.replace(/_\d+$/, "").replace(/[.\s]/g, "");
const key = boneKey;

function boneMap(mesh: THREE.SkinnedMesh) {
  const map = new Map<string, THREE.Bone>();
  for (const b of mesh.skeleton.bones) map.set(key(b.name), b);
  return map;
}

const worldOf = (b: THREE.Bone, out: THREE.Vector3) => out.setFromMatrixPosition(b.matrixWorld);

/**
 * How far inside the body `point` is, as a fraction of the local radius.
 *
 * Zero or less is clear. One would be dead on the spine. The value is
 * normalised rather than a distance so the two axes of the ellipse can be
 * compared on one scale.
 */
function penetration(
  point: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
  girth: Girth,
  height: number,
) {
  const axis = new THREE.Vector3().subVectors(b, a);
  const len2 = axis.lengthSq();
  const d = new THREE.Vector3().subVectors(point, a);
  // Clamped, so a point beyond either end is measured against that end and the
  // stack behaves as a capsule rather than an infinite cylinder.
  const t = len2 > 0 ? THREE.MathUtils.clamp(d.dot(axis) / len2, 0, 1) : 0;
  const closest = new THREE.Vector3().copy(axis).multiplyScalar(t).add(a);
  const off = new THREE.Vector3().subVectors(point, closest);

  const hw = (girth.halfWidth + CLEARANCE) * height;
  const hd = (girth.halfDepth + CLEARANCE) * height;
  // Normalised radius on the ellipse, about a centre set back from the spine:
  // < 1 is inside the surface.
  const radial = Math.hypot(off.x / hw, (off.z - girth.centreZ * height) / hd);
  return 1 - radial;
}

/**
 * Every probe point currently inside the body, worst first.
 *
 * `height` is the figure's total height in the same units as the bone world
 * positions, since every girth above is expressed as a fraction of it.
 */
export function findViolations(
  mesh: THREE.SkinnedMesh,
  height: number,
  kind: BodyKind,
): Violation[] {
  const bones = boneMap(mesh);
  mesh.skeleton.bones[0].updateMatrixWorld(true);
  const spine = spineOf(mesh, kind);

  const out: Violation[] = [];
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  for (const side of ["L", "R"] as const) {
    for (const probe of PROBES) {
      const from = bones.get(`${probe.from}${side}`);
      if (!from) continue;
      worldOf(from, p);
      if (probe.to) {
        const to = bones.get(`${probe.to}${side}`);
        if (to) p.lerp(worldOf(to, q), probe.t ?? 0.5);
      }
      let worst = -Infinity;
      for (const seg of spine) worst = Math.max(worst, penetration(p, seg.a, seg.b, seg.girth, height));
      if (worst > 0) out.push({ probe: probe.from, side, depth: worst });
    }
  }
  return out.sort((x, y) => y.depth - x.depth);
}

// ---------------------------------------------------------------------------

export type Pose = Record<string, { x?: number; y?: number; z?: number }>;

const DEG = Math.PI / 180;

/**
 * Anatomical range of each joint, in degrees of delta on the rest pose.
 *
 * These are rig-space, not textbook anatomy: the bone axes here do not line up
 * with the sagittal and coronal planes, so a published "elbow flexes 0–150°"
 * cannot be dropped in. They are set wide enough to admit every pose the
 * library needs and tight enough to reject the physically absurd, and their job
 * is to catch bad input before it reaches the collision pass.
 */
const LIMITS: Record<string, { x?: [number, number]; y?: [number, number]; z?: [number, number] }> = {
  Collar: { x: [-25, 25], y: [-25, 25], z: [-30, 30] },
  UpperArm: { x: [-95, 120], y: [-100, 100], z: [-95, 110] },
  // The elbow only folds one way. Negative x here is the direction that carries
  // the forearm up behind the torso, which is what "arms hanging down" turned
  // out to be the first time this pose was written by hand.
  Forearm: { x: [0, 155], y: [-90, 90], z: [-130, 40] },
  Palm: { x: [-80, 80], y: [-85, 85], z: [-75, 75] },
  Neck: { x: [-40, 30], y: [-60, 60], z: [-30, 30] },
  Head: { x: [-30, 25], y: [-70, 70], z: [-25, 25] },
};

/** Finger joints all share one range; none of them bends backwards far. */
const FINGER_LIMIT: [number, number] = [-15, 100];
const isFinger = (stem: string) => /^(Index|Middle|Ring|Pinky|Thumb)\d$/.test(stem);

export type Clamped = { bone: string; axis: "x" | "y" | "z"; asked: number; used: number };

/**
 * The joint limits for one bone stem, or `undefined` if it has none.
 *
 * Exported so `lib/motion/skeleton.ts` can build the controller's action
 * space against the same numbers the mudra poser clamps to, rather than
 * keeping a second copy that is free to drift out of agreement with this one.
 */
export function limitFor(stem: string) {
  if (isFinger(stem)) return { x: FINGER_LIMIT, y: FINGER_LIMIT, z: FINGER_LIMIT };
  return LIMITS[stem];
}

/**
 * Applies `pose` to `mesh`, clamped to the joint limits and scaled by `amount`.
 *
 * `amount` exists so the collision pass can walk a pose back toward rest
 * without needing a second, differently-written copy of it. It is applied per
 * side, since a hand through the ribs on one side says nothing about the other.
 */
export function applyPose(
  mesh: THREE.SkinnedMesh,
  pose: Pose,
  amount: { L: number; R: number } = { L: 1, R: 1 },
) {
  const bones = boneMap(mesh);
  const clamped: Clamped[] = [];
  const missing: string[] = [];

  // Rest first, so a second call is not a delta on the previous one.
  for (const bone of mesh.skeleton.bones) bone.quaternion.copy(restOf(mesh, bone));

  for (const [name, angles] of Object.entries(pose)) {
    const stem = name.replace(/\.[LR]$/, "").replace(/[.\s]/g, "");
    // Spine bones carry no side. They must not be scaled by an arm's back-off —
    // a hand through the ribs is no reason to un-bow the head.
    const sided = /\.[LR]$/.test(name);
    const side: "L" | "R" = name.endsWith("R") ? "R" : "L";
    const bone = bones.get(key(name));
    if (!bone) {
      missing.push(name);
      continue;
    }
    const limit = limitFor(stem);
    const scale = sided ? amount[side] : 1;
    const mirror = sided && side === "R" ? -1 : 1;

    for (const axis of ["y", "x", "z"] as const) {
      const asked = angles[axis];
      if (!asked) continue;
      const range = limit?.[axis];
      const used = range ? THREE.MathUtils.clamp(asked, range[0], range[1]) : asked;
      if (range && used !== asked) clamped.push({ bone: name, axis, asked, used });
      // Mirroring applies to the two axes that flip across the body; a sign on
      // the fold would unfold one arm while folding the other.
      const signed = used * (axis === "x" ? 1 : mirror) * scale * DEG;
      if (axis === "x") bone.rotateX(signed);
      else if (axis === "y") bone.rotateY(signed);
      else bone.rotateZ(signed);
    }
  }

  mesh.skeleton.bones[0].updateMatrixWorld(true);
  return { clamped, missing };
}

/** Rest quaternions, captured the first time a skeleton is seen. */
const REST = new WeakMap<THREE.Skeleton, Map<THREE.Bone, THREE.Quaternion>>();

function restOf(mesh: THREE.SkinnedMesh, bone: THREE.Bone) {
  let table = REST.get(mesh.skeleton);
  if (!table) {
    table = new Map();
    for (const b of mesh.skeleton.bones) table.set(b, b.quaternion.clone());
    REST.set(mesh.skeleton, table);
  }
  let q = table.get(bone);
  if (!q) {
    q = bone.quaternion.clone();
    table.set(bone, q);
  }
  return q;
}

/**
 * Applies `pose`, then backs each arm off until nothing is inside the body.
 *
 * The back-off is a binary search on how much of the pose to apply, per side.
 * It is deliberately blunt: a proper fix would re-solve the offending chain to
 * the nearest legal configuration, but that needs an IK solver and a notion of
 * which joint should give. Easing the whole arm back always terminates, never
 * invents a posture nobody asked for, and degrades toward the rest pose — which
 * is the right direction to fail in.
 *
 * Returns what it had to give up, so a caller can say so rather than silently
 * showing a different pose from the one requested.
 */
export function applyPoseSafely(
  mesh: THREE.SkinnedMesh,
  pose: Pose,
  height: number,
  kind: BodyKind,
  steps = 7,
) {
  const { clamped, missing } = applyPose(mesh, pose);
  const initial = findViolations(mesh, height, kind);
  let violations = initial;
  if (!violations.length) {
    return { clamped, missing, initial, violations, amount: { L: 1, R: 1 } };
  }

  const amount = { L: 1, R: 1 };
  for (const side of ["L", "R"] as const) {
    if (!violations.some((v) => v.side === side)) continue;
    let lo = 0; // rest is always safe
    let hi = 1;
    for (let i = 0; i < steps; i++) {
      const mid = (lo + hi) / 2;
      applyPose(mesh, pose, { ...amount, [side]: mid });
      if (findViolations(mesh, height, kind).some((v) => v.side === side)) hi = mid;
      else lo = mid;
    }
    amount[side] = lo;
    applyPose(mesh, pose, amount);
  }

  violations = findViolations(mesh, height, kind);
  return { clamped, missing, initial, violations, amount };
}

/**
 * The body volume as a wireframe, for looking at the rule rather than trusting
 * it. Returns an object the caller owns and must dispose.
 */
export function debugBody(
  mesh: THREE.SkinnedMesh,
  height: number,
  kind: BodyKind,
  /**
   * The object the returned group will be parented to. Bone positions are in
   * world space, so without converting into this object's space the geometry
   * picks up its transform a second time — parented to the turntable, the
   * wireframe swung away from the figure it was meant to be drawn on.
   */
  space?: THREE.Object3D,
) {
  mesh.skeleton.bones[0].updateMatrixWorld(true);
  space?.updateWorldMatrix(true, false);
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xff9933, wireframe: true, transparent: true, opacity: 0.35 });
  const toSpace = (v: THREE.Vector3) => (space ? space.worldToLocal(v) : v);

  for (const { a: aw, b: bw, girth } of spineOf(mesh, kind)) {
    const a = toSpace(aw.clone());
    const b = toSpace(bw.clone());
    const { halfWidth, halfDepth, centreZ } = girth;
    const geo = new THREE.CylinderGeometry(1, 1, a.distanceTo(b), 14, 1, true);
    const seg = new THREE.Mesh(geo, mat);
    seg.scale.set((halfWidth + CLEARANCE) * height, 1, (halfDepth + CLEARANCE) * height);
    seg.position.copy(a).add(b).multiplyScalar(0.5);
    seg.position.z += centreZ * height;
    seg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(b, a).normalize(),
    );
    group.add(seg);
  }

  group.userData.dispose = () => {
    group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    mat.dispose();
  };
  return group;
}
