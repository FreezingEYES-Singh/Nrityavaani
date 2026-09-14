import * as THREE from "three";
import { boneKey } from "./figureConstraints";

/**
 * Drives the rigged figure from MediaPipe landmarks, one video frame at a time.
 *
 * This deliberately does *not* go through `applyPose`. That path takes Euler
 * deltas in degrees, mirrors y and z on the right-hand side, and clamps to
 * hand-authored joint limits — all of which is right for a pose someone typed
 * out, and all of which is in the way here. Motion capture arrives as
 * directions in space, not as angles in a bone's local frame, and converting
 * one to the other only to have it converted back loses the thing that makes
 * the capture trustworthy: that the arm points where the dancer's arm pointed.
 *
 * The method is direction retargeting, applied parent-first:
 *
 *   1. Read where the bone's own axis currently points, in world space.
 *   2. Rotate that onto the direction the landmarks ask for.
 *   3. Express the result in the parent's space and store it.
 *
 * Because step 1 reads the *live* world matrix rather than a stored rest value,
 * the chain composes: by the time the forearm is solved the upper arm has
 * already moved, so the forearm's own solve starts from where the elbow
 * actually is. That is also why `BONE_ORDER` below is not merely tidy — solving
 * a child before its parent silently discards the child's work.
 *
 * Nothing here assumes which way the model faces or which axis runs along a
 * bone. Every rotation is computed as a delta between two measured directions,
 * so the rig's conventions cancel out. The one place that could not be done —
 * the pelvis, which needs an absolute orientation rather than a direction — is
 * handled as a delta from the *rest* basis to the target basis, which cancels
 * the convention the same way.
 */

/** MediaPipe pose landmark indices, named. */
export const P = {
  NOSE: 0,
  L_EAR: 7,
  R_EAR: 8,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_FOOT: 31,
  R_FOOT: 32,
} as const;

/** MediaPipe hand landmark indices, named. */
export const H = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * MediaPipe's frame into three's.
 *
 * MediaPipe reports x to the right of the image, y *down* the image, and z
 * growing away from the camera. three has y up and, for a camera on +z looking
 * back at the origin, z growing toward the viewer. Negating y and z converts
 * between them and keeps the frame right-handed, so a figure built from these
 * vectors faces the camera the same way the dancer does — no mirroring, and
 * MediaPipe's "left" stays the dancer's left, which is what the rig's `.L`
 * bones mean too.
 */
function v3(l: Landmark, out = new THREE.Vector3()) {
  return out.set(l.x, -l.y, -l.z);
}

const mid = (a: THREE.Vector3, b: THREE.Vector3) =>
  new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

/**
 * An orthonormal basis from a body's across-vector and up-vector.
 *
 * `across` is squared against `up` rather than trusted: the line between the
 * shoulders is never exactly perpendicular to the line up the spine, and a
 * basis built from two non-perpendicular measured vectors shears the figure.
 */
function basis(across: THREE.Vector3, up: THREE.Vector3) {
  const y = up.clone().normalize();
  const z = new THREE.Vector3().crossVectors(across, y).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z);
}

/**
 * The bones this drives, parents strictly before children.
 *
 * `from`/`to` name the two pose landmarks whose difference gives the direction
 * the bone should point. Fingers are not listed — they come off the hand
 * landmarks, which arrive separately and only when a hand was actually found.
 */
const BODY: { bone: string; from: number; to: number }[] = [
  { bone: "UpperArm.L", from: P.L_SHOULDER, to: P.L_ELBOW },
  { bone: "Forearm.L", from: P.L_ELBOW, to: P.L_WRIST },
  { bone: "UpperArm.R", from: P.R_SHOULDER, to: P.R_ELBOW },
  { bone: "Forearm.R", from: P.R_ELBOW, to: P.R_WRIST },
  { bone: "Hip.L", from: P.L_HIP, to: P.L_KNEE },
  { bone: "Shin.L", from: P.L_KNEE, to: P.L_ANKLE },
  { bone: "Foot.L", from: P.L_ANKLE, to: P.L_FOOT },
  { bone: "Hip.R", from: P.R_HIP, to: P.R_KNEE },
  { bone: "Shin.R", from: P.R_KNEE, to: P.R_ANKLE },
  { bone: "Foot.R", from: P.R_ANKLE, to: P.R_FOOT },
];

/** Finger chains: three bones per finger, each spanning two hand landmarks. */
const FINGERS: { stem: string; joints: [number, number, number, number] }[] = [
  { stem: "Thumb", joints: [H.THUMB_CMC, H.THUMB_MCP, H.THUMB_IP, H.THUMB_TIP] },
  { stem: "Index", joints: [H.INDEX_MCP, H.INDEX_PIP, H.INDEX_DIP, H.INDEX_TIP] },
  { stem: "Middle", joints: [H.MIDDLE_MCP, H.MIDDLE_PIP, H.MIDDLE_DIP, H.MIDDLE_TIP] },
  { stem: "Ring", joints: [H.RING_MCP, H.RING_PIP, H.RING_DIP, H.RING_TIP] },
  { stem: "Pinky", joints: [H.PINKY_MCP, H.PINKY_PIP, H.PINKY_DIP, H.PINKY_TIP] },
];

export interface HandFrame {
  /** Hand world landmarks, metres, origin at the hand's centre. */
  world: Landmark[];
  /**
   * The same hand in image space, 0-1 across the frame.
   *
   * Carried because the world landmarks cannot answer where a hand is *on the
   * body* — their origin is the hand's own centre, so two hands touching and
   * two hands a metre apart produce identical numbers. The image-space points
   * are the only place the relationship between the two hands survives.
   */
  screen?: Landmark[];
}

export interface Frame {
  /** Pose world landmarks, metres, origin between the hips. */
  pose: Landmark[] | null;
  /** Screen-space pose landmarks, carrying the visibility scores. */
  poseScreen: Landmark[] | null;
  left: HandFrame | null;
  right: HandFrame | null;
}

/** Per-bone accuracy: how far the posed bone ended up from what was asked. */
export interface Residual {
  bone: string;
  /** Degrees between the bone's axis and the target direction. */
  error: number;
}

export interface Report {
  /** Bones solved this frame. */
  solved: number;
  /**
   * Normalised names of the bones the capture actually drove this frame.
   *
   * The overlay colours by this rather than by whether a bone exists, which is
   * the difference between "the hand is at rest because she is holding it
   * still" and "the hand is at rest because nothing found it".
   */
  driven: Set<string>;
  /** Named bones the rig did not contain. Empty means the mapping is complete. */
  missing: string[];
  residuals: Residual[];
  /** Worst residual in degrees, or 0 when nothing was solved. */
  worst: number;
  /** Mean visibility of the pose landmarks actually used, 0-1. */
  visibility: number;
  /** Landmarks the model reported but was not confident about. */
  weak: string[];
  hands: { left: boolean; right: boolean };
  /** The hands read as touching in the image, and were closed to match. */
  contact: boolean;
}

/**
 * Removes single-frame spikes from a landmark track, leaving real motion alone.
 *
 * This is a different job from smoothing and has to happen first. Averaging
 * treats every sample as equally true, so a frame where the tracker briefly
 * threw a hand across the body does not get removed by it — it gets *spread*,
 * over as many frames as the window is wide. One bad frame becomes five
 * mediocre ones.
 *
 * The test is a Hampel filter: compare each point against the median of the
 * frames around it, and measure "far" in units of how much that neighbourhood
 * is moving anyway (the median absolute deviation). A hand genuinely travelling
 * fast carries its neighbours with it, so the median moves too and nothing is
 * flagged. A hand that leaps somewhere for two frames and comes back does not
 * move the median at all, and stands out immediately. That is exactly the
 * "normal, normal, wrong, wrong, normal" case — the spike is replaced by the
 * median of its neighbours, and the frames either side of it are untouched.
 *
 * `floor` is in the units of the track — metres, for world landmarks — and
 * covers the case where the dancer holds still. The deviation is then zero for
 * every neighbour, so a purely relative threshold would divide the scale away
 * and call any movement at all an outlier.
 */
export function despikeTrack(
  track: (Landmark[] | null)[],
  radius = 2,
  k = 3,
  floor = 0.02,
): (Landmark[] | null)[] {
  if (radius < 1) return track;

  const median = (a: number[]) => {
    const s = [...a].sort((p, q) => p - q);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  return track.map((frame, i) => {
    if (!frame) return null;
    return frame.map((lm, j) => {
      const xs: number[] = [];
      const ys: number[] = [];
      const zs: number[] = [];
      for (let d = -radius; d <= radius; d++) {
        const p = track[i + d]?.[j];
        if (p) {
          xs.push(p.x);
          ys.push(p.y);
          zs.push(p.z);
        }
      }
      // Fewer than three neighbours cannot establish a median worth trusting.
      if (xs.length < 3) return lm;

      const mx = median(xs);
      const my = median(ys);
      const mz = median(zs);
      // Spread measured as distance from the median *point*, not per axis: a
      // point is one thing, and replacing only its wayward x would invent a
      // position the tracker never reported.
      const spread = median(xs.map((_, n) => Math.hypot(xs[n] - mx, ys[n] - my, zs[n] - mz)));
      const off = Math.hypot(lm.x - mx, lm.y - my, lm.z - mz);
      // 1.4826 puts the median absolute deviation on the same scale as a
      // standard deviation, so `k` reads as "how many sigma".
      const limit = Math.max(1.4826 * spread * k, floor);
      if (off > limit) return { x: mx, y: my, z: mz, visibility: lm.visibility };
      return lm;
    });
  });
}

/**
 * Smooths a landmark track in time, without lag.
 *
 * This is the one real advantage of baking the whole take before playing it.
 * Any filter that runs live can only look backwards, so it must trade jitter
 * against delay — smooth harder and the figure drifts behind the dancer. With
 * every frame already in hand the window can be *centred*, which cancels the
 * delay exactly: a fast movement stays on the beat it happened on, and only
 * the frame-to-frame noise goes.
 *
 * The kernel is triangular and `radius` is small on purpose. Bharatanatyam
 * footwork is genuinely fast, and a wide window does not distinguish a jitter
 * from a strike — it would round off the very frames the dance is made of.
 *
 * A missing frame is left missing rather than interpolated across; a dropped
 * detection is information, and inventing a pose to fill it would hide it.
 */
export function smoothTrack(
  track: (Landmark[] | null)[],
  radius: number,
): (Landmark[] | null)[] {
  if (radius < 1) return track;
  return track.map((frame, i) => {
    if (!frame) return null;
    // Symmetric about `i` for the same reason as the stabiliser above: a
    // truncated window is a lopsided one, and lopsided averaging shifts the
    // very first and last movements of a take.
    const reach = Math.min(radius, i, track.length - 1 - i);
    return frame.map((lm, j) => {
      let wx = 0;
      let wy = 0;
      let wz = 0;
      let sum = 0;
      for (let k = -reach; k <= reach; k++) {
        const other = track[i + k];
        const p = other?.[j];
        if (!p) continue;
        const w = reach + 1 - Math.abs(k);
        wx += p.x * w;
        wy += p.y * w;
        wz += p.z * w;
        sum += w;
      }
      if (!sum) return lm;
      // Visibility is carried through unsmoothed: it is a statement about this
      // frame, and averaging it would let a confident neighbour vouch for a
      // frame the model was not sure about.
      return { x: wx / sum, y: wy / sum, z: wz / sum, visibility: lm.visibility };
    });
  });
}

/**
 * Holds a landmark still when the dancer is still, and gets out of the way
 * when she is not.
 *
 * The shimmer on a held pose is not movement — it is the tracker re-guessing
 * the same joint from scratch on every frame and landing a few millimetres
 * apart each time. Plain smoothing cannot separate that from real motion,
 * because it applies the same window to both: wide enough to settle a held
 * arm is wide enough to round the edge off a strike.
 *
 * So the strength is chosen per landmark per frame, from how fast that
 * landmark is actually travelling. Below `noise` it is treated as
 * stationary and replaced with the average of its neighbourhood, which kills
 * the wobble outright. Above `motion` the measured position is kept as-is.
 * Between the two it crossfades, so nothing snaps as a limb starts or stops.
 *
 * Speed is measured as the *median* step across the window rather than the
 * mean, so a single bad frame cannot fake motion and unlock the filter — which
 * would be the exact failure mode of leaving a jitter in place because it was
 * large enough to look like dancing.
 *
 * `noise` and `motion` are in metres per frame, so they depend on the sample
 * rate: the same movement covers half the distance per frame at 24 fps that it
 * does at 12. `perFrameScale` carries that, letting a caller pass thresholds
 * quoted at one rate and have them hold at another.
 */
export function stabiliseTrack(
  track: (Landmark[] | null)[],
  radius = 3,
  noise = 0.004,
  motion = 0.02,
  perFrameScale = 1,
): (Landmark[] | null)[] {
  if (radius < 1) return track;

  const lo = noise * perFrameScale;
  const hi = Math.max(lo * 1.001, motion * perFrameScale);

  const median = (a: number[]) => {
    const s = [...a].sort((p, q) => p - q);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  return track.map((frame, i) => {
    if (!frame) return null;
    return frame.map((lm, j) => {
      // Two windows, because the two jobs want opposite things. Deciding
      // whether the joint is moving wants a tight window, so the filter
      // releases the instant a limb goes; averaging a joint that is *not*
      // moving wants as wide a window as possible, and costs nothing, because
      // by then there is nothing happening to blur.
      const pts: Landmark[] = [];
      for (let d = -radius; d <= radius; d++) {
        const p = track[i + d]?.[j];
        if (p) pts.push(p);
      }
      if (pts.length < 3) return lm;

      const steps: number[] = [];
      for (let n = 1; n < pts.length; n++) {
        steps.push(
          Math.hypot(pts[n].x - pts[n - 1].x, pts[n].y - pts[n - 1].y, pts[n].z - pts[n - 1].z),
        );
      }
      const speed = steps.length ? median(steps) : 0;

      // 0 where the joint is stationary, 1 where it is clearly moving, with a
      // smoothstep between so the handover is not visible.
      const u = THREE.MathUtils.clamp((speed - lo) / (hi - lo), 0, 1);
      const moving = u * u * (3 - 2 * u);
      if (moving > 0.999) return lm;

      let ax = 0;
      let ay = 0;
      let az = 0;
      let n = 0;
      // Kept symmetric about `i`, shrinking near the ends of the take. A
      // centred average over a lopsided window is biased: on a limb travelling
      // steadily, the first frames have only later — further along — samples to
      // average with, which drags the start of the movement forward and clips
      // the distance it appears to cover.
      const wide = Math.min(radius * 2, i, track.length - 1 - i);
      for (let d = -wide; d <= wide; d++) {
        const p = track[i + d]?.[j];
        if (!p) continue;
        ax += p.x;
        ay += p.y;
        az += p.z;
        n++;
      }
      if (!n) return lm;
      ax /= n;
      ay /= n;
      az /= n;

      return {
        x: ax + (lm.x - ax) * moving,
        y: ay + (lm.y - ay) * moving,
        z: az + (lm.z - az) * moving,
        visibility: lm.visibility,
      };
    });
  });
}

/**
 * The body's segments, as pairs of pose landmarks that span a fixed distance.
 *
 * `mirror` names the segment on the other side. A dancer's two forearms are the
 * same length, so where the tracker reports otherwise it has told us, without
 * meaning to, exactly how wrong it is.
 */
const SEGMENTS: { key: string; a: number; b: number; mirror?: string }[] = [
  { key: "shoulders", a: P.L_SHOULDER, b: P.R_SHOULDER },
  { key: "hips", a: P.L_HIP, b: P.R_HIP },
  { key: "sideL", a: P.L_SHOULDER, b: P.L_HIP, mirror: "sideR" },
  { key: "sideR", a: P.R_SHOULDER, b: P.R_HIP, mirror: "sideL" },
  { key: "upperArmL", a: P.L_SHOULDER, b: P.L_ELBOW, mirror: "upperArmR" },
  { key: "upperArmR", a: P.R_SHOULDER, b: P.R_ELBOW, mirror: "upperArmL" },
  { key: "forearmL", a: P.L_ELBOW, b: P.L_WRIST, mirror: "forearmR" },
  { key: "forearmR", a: P.R_ELBOW, b: P.R_WRIST, mirror: "forearmL" },
  { key: "thighL", a: P.L_HIP, b: P.L_KNEE, mirror: "thighR" },
  { key: "thighR", a: P.R_HIP, b: P.R_KNEE, mirror: "thighL" },
  { key: "shinL", a: P.L_KNEE, b: P.L_ANKLE, mirror: "shinR" },
  { key: "shinR", a: P.R_KNEE, b: P.R_ANKLE, mirror: "shinL" },
  { key: "footL", a: P.L_ANKLE, b: P.L_FOOT, mirror: "footR" },
  { key: "footR", a: P.R_ANKLE, b: P.R_FOOT, mirror: "footL" },
];

export type Skeleton = Record<string, number>;

/**
 * The dancer's actual proportions, measured from the whole take.
 *
 * Per segment the median length across every frame, because the median ignores
 * the frames where the tracker lost the limb entirely. Paired segments are then
 * averaged with their mirror: a body is symmetric to within a percent or two,
 * so where the two sides disagree by a quarter of their length the disagreement
 * is measurement error, and splitting it is closer to the truth than either
 * side alone.
 */
export function measureSkeleton(track: (Landmark[] | null)[]): Skeleton {
  const median = (a: number[]) => {
    const s = a.slice().sort((p, q) => p - q);
    return s.length ? s[s.length >> 1] : 0;
  };

  const raw: Skeleton = {};
  for (const { key, a, b } of SEGMENTS) {
    const lengths: number[] = [];
    for (const frame of track) {
      const p = frame?.[a];
      const q = frame?.[b];
      if (!p || !q) continue;
      const d = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      if (d > 1e-4) lengths.push(d);
    }
    raw[key] = median(lengths);
  }

  const out: Skeleton = {};
  for (const { key, mirror } of SEGMENTS) {
    const own = raw[key];
    const other = mirror ? raw[mirror] : 0;
    out[key] = mirror && own > 0 && other > 0 ? (own + other) / 2 : own;
  }
  return out;
}

/**
 * Moves each frame's landmarks onto a body that keeps its proportions.
 *
 * A limb whose length changes from frame to frame cannot be right, and it is
 * what makes a figure swim: the elbow slides along the arm because nothing
 * says the arm has a length. On this footage the left forearm departs from its
 * own median by more than a tenth in over half the frames.
 *
 * The correction is a Gauss-Seidel relaxation of distance constraints, the
 * same idea as position-based dynamics. Each segment is visited in turn, and
 * its two ends are pulled together or pushed apart until it measures what the
 * skeleton says it should. Repeating the sweep lets a correction at the
 * shoulder settle through the elbow to the wrist.
 *
 * Which end gives is decided by `confidence`. A joint the tracker was sure of
 * barely moves; a joint it was guessing at absorbs nearly all of the error. So
 * the fix is spent where the measurement was weakest rather than smeared
 * evenly over a limb that was half right — which is the difference between
 * correcting a bad joint and corrupting a good one.
 *
 * The whole frame is re-centred on the hips afterwards, because these are
 * hip-centred coordinates and the sweep is free to drift the body as a whole.
 */
export function enforceSkeleton(
  track: (Landmark[] | null)[],
  confidence: (number[] | null)[],
  skeleton: Skeleton,
  iterations = 12,
): (Landmark[] | null)[] {
  return track.map((frame, f) => {
    if (!frame) return null;
    const pts = frame.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility }));

    // Inverse mass: how freely a joint may be moved. A confident joint is
    // heavy. The floor keeps a wholly-confident frame from being immovable,
    // which would leave its bones the wrong length with nowhere for the error
    // to go.
    const invMass = pts.map((_, j) => {
      const c = confidence[f]?.[j] ?? pts[j].visibility ?? 1;
      return 1 / Math.max(0.05, Math.min(1, c) ** 2);
    });

    for (let iter = 0; iter < iterations; iter++) {
      for (const { key, a, b } of SEGMENTS) {
        const want = skeleton[key];
        if (!want) continue;
        const pa = pts[a];
        const pb = pts[b];
        if (!pa || !pb) continue;

        let dx = pb.x - pa.x;
        let dy = pb.y - pa.y;
        let dz = pb.z - pa.z;
        const len = Math.hypot(dx, dy, dz);
        if (len < 1e-6) continue;

        const err = (len - want) / len;
        const wa = invMass[a];
        const wb = invMass[b];
        const sum = wa + wb;
        if (!sum) continue;

        dx *= err;
        dy *= err;
        dz *= err;
        pa.x += (dx * wa) / sum;
        pa.y += (dy * wa) / sum;
        pa.z += (dz * wa) / sum;
        pb.x -= (dx * wb) / sum;
        pb.y -= (dy * wb) / sum;
        pb.z -= (dz * wb) / sum;
      }
    }

    const hx = (pts[P.L_HIP].x + pts[P.R_HIP].x) / 2;
    const hy = (pts[P.L_HIP].y + pts[P.R_HIP].y) / 2;
    const hz = (pts[P.L_HIP].z + pts[P.R_HIP].z) / 2;
    for (const p of pts) {
      p.x -= hx;
      p.y -= hy;
      p.z -= hz;
    }
    return pts;
  });
}

/** Bones by normalised name, cached per skeleton. */
const MAPS = new WeakMap<THREE.Skeleton, Map<string, THREE.Bone>>();

export function boneMap(mesh: THREE.SkinnedMesh) {
  let m = MAPS.get(mesh.skeleton);
  if (!m) {
    m = new Map();
    for (const b of mesh.skeleton.bones) m.set(boneKey(b.name), b);
    MAPS.set(mesh.skeleton, m);
  }
  return m;
}

/** Rest local quaternions, captured the first time a skeleton is seen. */
const REST = new WeakMap<THREE.Skeleton, Map<THREE.Bone, THREE.Quaternion>>();

export function rest(mesh: THREE.SkinnedMesh) {
  let t = REST.get(mesh.skeleton);
  if (!t) {
    t = new Map();
    for (const b of mesh.skeleton.bones) t.set(b, b.quaternion.clone());
    REST.set(mesh.skeleton, t);
  }
  return t;
}

/** The rest basis of the pelvis, measured once off the rest pose. */
const REST_BASIS = new WeakMap<THREE.Skeleton, THREE.Quaternion>();

const _wq = new THREE.Quaternion();
const _pq = new THREE.Quaternion();
const _axis = new THREE.Vector3();
const _target = new THREE.Vector3();
const _swing = new THREE.Quaternion();

/**
 * Points one bone's own axis along `dir`, in world space.
 *
 * The bone's axis is read as the direction to its first child rather than
 * assumed to be +Y. The rig's own note says +Y runs along a bone toward its
 * tail, and it does — but a bone with no child (a fingertip, a toe) has no
 * tail to speak of, and reading it off the hierarchy costs nothing and cannot
 * be wrong about the ones that matter.
 */
function aim(bone: THREE.Bone, dir: THREE.Vector3, axisLocal: THREE.Vector3) {
  bone.updateWorldMatrix(true, false);
  bone.getWorldQuaternion(_wq);

  _axis.copy(axisLocal).applyQuaternion(_wq).normalize();
  _target.copy(dir).normalize();
  if (_target.lengthSq() < 1e-8) return;

  _swing.setFromUnitVectors(_axis, _target);
  // World rotation the bone should end up with, then expressed in its parent's
  // space — three stores a bone's quaternion relative to its parent, so a world
  // rotation written straight in would be wrong by the whole chain above it.
  _wq.premultiply(_swing);
  if (bone.parent) {
    bone.parent.getWorldQuaternion(_pq);
    _wq.premultiply(_pq.invert());
  }
  bone.quaternion.copy(_wq);
  bone.updateWorldMatrix(false, false);
}

/**
 * The local axis running along a bone, from its rest pose.
 *
 * Measured as the direction to the first child in the bone's own space. Bones
 * with no child fall back to +Y, which the rig's convention says is right and
 * which only ever applies to leaf bones nothing is solved against anyway.
 */
const AXES = new WeakMap<THREE.Bone, THREE.Vector3>();

function axisOf(bone: THREE.Bone) {
  let a = AXES.get(bone);
  if (!a) {
    const child = bone.children.find((c) => (c as THREE.Bone).isBone) as THREE.Bone | undefined;
    a = child ? child.position.clone().normalize() : new THREE.Vector3(0, 1, 0);
    if (a.lengthSq() < 1e-8) a.set(0, 1, 0);
    AXES.set(bone, a);
  }
  return a;
}

/**
 * Below this, a landmark is called weak in the report.
 *
 * It is a label, not a gate. Limbs used to be skipped when their landmarks
 * fell under it, and a skipped bone stays at rest — which for the legs is
 * standing straight. On this footage the legs are the least visible part of
 * the dancer (a sari over the knees, the ankles at the edge of frame), so the
 * one thing the gate reliably did was snap a bent leg straight for a few
 * frames and back, several times a phrase.
 *
 * A low-confidence estimate is still an estimate of where the leg is. Rest is
 * an estimate of where the leg is not. Following the noisy one is worse per
 * frame and much better per phrase, so every limb is driven now and this only
 * decides what `weak` lists.
 */
const GATE = 0.5;

const NAMES: Record<number, string> = {
  [P.L_SHOULDER]: "L shoulder",
  [P.R_SHOULDER]: "R shoulder",
  [P.L_ELBOW]: "L elbow",
  [P.R_ELBOW]: "R elbow",
  [P.L_WRIST]: "L wrist",
  [P.R_WRIST]: "R wrist",
  [P.L_HIP]: "L hip",
  [P.R_HIP]: "R hip",
  [P.L_KNEE]: "L knee",
  [P.R_KNEE]: "R knee",
  [P.L_ANKLE]: "L ankle",
  [P.R_ANKLE]: "R ankle",
  [P.L_FOOT]: "L foot",
  [P.R_FOOT]: "R foot",
};

/**
 * Poses `mesh` to match `frame`, and reports how well it managed.
 *
 * Every bone is returned to rest first, so a frame is never a delta on the one
 * before it — a dropped detection then reads as the figure standing still
 * rather than as it drifting somewhere it was never asked to go.
 */
/**
 * The rig's own arm, measured once off its rest pose.
 *
 * Cached per skeleton and only read while the bones are still at rest, which is
 * why it is taken at the top of `retarget` rather than where it is used — by
 * the time the arms are being closed they have already moved, and measuring
 * then would record the pose instead of the proportions.
 */
interface ArmSpec {
  upper: number;
  fore: number;
  shoulder: number;
}

const ARMS = new WeakMap<THREE.Skeleton, ArmSpec | null>();

function armSpec(mesh: THREE.SkinnedMesh, bones: Map<string, THREE.Bone>): ArmSpec | null {
  if (ARMS.has(mesh.skeleton)) return ARMS.get(mesh.skeleton) ?? null;

  const uL = bones.get("UpperArmL");
  const uR = bones.get("UpperArmR");
  const fL = bones.get("ForearmL");
  const pL = bones.get("PalmL");
  let spec: ArmSpec | null = null;

  if (uL && uR && fL && pL) {
    const wp = (b: THREE.Bone) => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
    const sL = wp(uL);
    const el = wp(fL);
    spec = {
      upper: sL.distanceTo(el),
      fore: el.distanceTo(wp(pL)),
      shoulder: sL.distanceTo(wp(uR)),
    };
  }

  ARMS.set(mesh.skeleton, spec);
  return spec;
}

const worldPos = (b: THREE.Bone, out: THREE.Vector3) => {
  b.updateWorldMatrix(true, false);
  return out.setFromMatrixPosition(b.matrixWorld);
};

/**
 * Bends one arm so its wrist lands on `target`.
 *
 * The ordinary two-bone construction: the elbow sits on a circle around the
 * shoulder-to-target line, and `pole` picks the point on that circle, so the
 * arm bends the way it was already bending rather than settling into whichever
 * of the two mirror solutions the maths reaches first. Without a pole a closing
 * namaste flips its elbows out sideways halfway through.
 */
function reachTo(
  upper: THREE.Bone,
  fore: THREE.Bone,
  target: THREE.Vector3,
  pole: THREE.Vector3,
  spec: ArmSpec,
) {
  const shoulder = worldPos(upper, new THREE.Vector3());
  const toTarget = new THREE.Vector3().subVectors(target, shoulder);
  let reach = toTarget.length();
  if (reach < 1e-5) return;

  // Clamped inside the arm's real span. A target further off than the arm is
  // long has no solution, and reaching as far as the arm goes along that line
  // is both the nearest answer and what a person does.
  const a = spec.upper;
  const b = spec.fore;
  reach = THREE.MathUtils.clamp(reach, Math.abs(a - b) + 1e-4, a + b - 1e-4);
  toTarget.normalize();

  const along = (reach * reach + a * a - b * b) / (2 * reach);
  const out = Math.sqrt(Math.max(0, a * a - along * along));

  // Bend direction, squared against the shoulder-to-target line so it only
  // says which way the elbow goes, never how far.
  const toPole = new THREE.Vector3().subVectors(pole, shoulder);
  toPole.addScaledVector(toTarget, -toPole.dot(toTarget));
  if (toPole.lengthSq() < 1e-8) {
    toPole.set(toTarget.y, -toTarget.x, 0);
    if (toPole.lengthSq() < 1e-8) toPole.set(0, toTarget.z, -toTarget.y);
  }
  toPole.normalize();

  const elbow = shoulder.clone().addScaledVector(toTarget, along).addScaledVector(toPole, out);
  aim(upper, new THREE.Vector3().subVectors(elbow, shoulder), axisOf(upper));

  // The forearm hangs off the upper arm, so its world position is only true
  // once the shoulder above it has been written and walked back down.
  const elbowNow = worldPos(fore, new THREE.Vector3());
  const wrist = shoulder.clone().addScaledVector(toTarget, reach);
  aim(fore, new THREE.Vector3().subVectors(wrist, elbowNow), axisOf(fore));
}

/**
 * How close the two hands must read in the image before this treats it as a
 * two-handed mudra, as a fraction of shoulder width.
 *
 * Deliberately tight. Two hands can overlap in a picture while being a long way
 * apart in depth, and closing an arm that was never closed is a far worse
 * failure than leaving a small gap — so this only fires when the image says the
 * hands are all but touching. On the sample take a held namaste reads 0.003.
 */
const CONTACT = 0.1;

/** No palm is moved further than this, in metres, however the maths comes out. */
const MAX_PULL = 0.2;

/**
 * Closes the hands when the video shows them touching.
 *
 * This exists because of a measurable disagreement between MediaPipe's two
 * models about the same wrist. Through a namaste the dancer is visibly holding
 * closed, the **pose** model puts her wrists 12.2 cm apart in its world output
 * and 4.3 cm apart in the image; the **hand** model, run on a magnified crop,
 * puts them 0.1 cm apart in the image. The hand model is right — it is looking
 * at a close-up of the hands, where the pose model is placing a wrist from a
 * whole-body view and is coarse there.
 *
 * The rig is driven from the pose model, so it faithfully reproduces the wrong
 * one, and no amount of smoothing or joint-limit work touches it: nothing about
 * a 12 cm gap is noise. For a site teaching hasta mudras that single number
 * ruins every samyuta hasta there is — anjali, pushpaputa, all of them are
 * *defined* by the hands meeting.
 *
 * The fix needs no camera and no new model. The image already says how far
 * apart the hands are relative to her shoulders; scaling that ratio by the
 * figure's own shoulder width gives the gap the rig should show, and the two
 * wrists are then brought symmetrically onto it. Symmetrically on purpose: the
 * pose model has no idea *which* hand it misplaced, so moving one and not the
 * other would invent an asymmetry the dancer never performed.
 */
function closeContact(
  bones: Map<string, THREE.Bone>,
  frame: Frame,
  spec: ArmSpec,
  report: Report,
) {
  const lw = frame.left?.screen;
  const rw = frame.right?.screen;
  const screen = frame.poseScreen;
  if (!lw?.length || !rw?.length || !screen) return;

  const width = Math.hypot(
    screen[P.L_SHOULDER].x - screen[P.R_SHOULDER].x,
    screen[P.L_SHOULDER].y - screen[P.R_SHOULDER].y,
  );
  if (width < 1e-4) return;

  // Landmark 0 of a hand is its wrist, which is the point the pose model is
  // also trying to place — so the two are directly comparable.
  const seen = Math.hypot(lw[H.WRIST].x - rw[H.WRIST].x, lw[H.WRIST].y - rw[H.WRIST].y) / width;
  if (seen > CONTACT) return;

  const palmL = bones.get("PalmL");
  const palmR = bones.get("PalmR");
  const upperL = bones.get("UpperArmL");
  const upperR = bones.get("UpperArmR");
  const foreL = bones.get("ForearmL");
  const foreR = bones.get("ForearmR");
  if (!palmL || !palmR || !upperL || !upperR || !foreL || !foreR) return;

  const pL = worldPos(palmL, new THREE.Vector3());
  const pR = worldPos(palmR, new THREE.Vector3());
  const centre = mid(pL, pR);

  const apart = pL.distanceTo(pR);
  const want = seen * spec.shoulder;
  // Already as close as the image says. Leaving it alone matters: this runs on
  // every frame of a held pose, and re-solving one that is already right only
  // adds a little arithmetic noise to a hand that was still.
  if (apart <= want + 1e-4) return;
  if ((apart - want) / 2 > MAX_PULL) return;

  const axis =
    apart > 1e-6
      ? new THREE.Vector3().subVectors(pL, pR).multiplyScalar(1 / apart)
      : new THREE.Vector3(1, 0, 0);

  const targetL = centre.clone().addScaledVector(axis, want / 2);
  const targetR = centre.clone().addScaledVector(axis, -want / 2);

  // The elbows keep pointing where they already point. The capture got the
  // bend right; only the reach was wrong.
  const poleL = worldPos(foreL, new THREE.Vector3());
  const poleR = worldPos(foreR, new THREE.Vector3());

  reachTo(upperL, foreL, targetL, poleL, spec);
  reachTo(upperR, foreR, targetR, poleR, spec);

  report.contact = true;
}

export function retarget(mesh: THREE.SkinnedMesh, frame: Frame): Report {
  const bones = boneMap(mesh);
  const restQ = rest(mesh);
  for (const b of mesh.skeleton.bones) b.quaternion.copy(restQ.get(b)!);
  mesh.skeleton.bones[0].updateMatrixWorld(true);

  const report: Report = {
    solved: 0,
    driven: new Set(),
    missing: [],
    residuals: [],
    worst: 0,
    visibility: 0,
    weak: [],
    hands: { left: false, right: false },
    contact: false,
  };

  const lm = frame.pose;
  if (!lm || lm.length < 33) return report;

  const vis = (i: number) => frame.poseScreen?.[i]?.visibility ?? 1;

  // Visibility is read off the screen-space landmarks, which is where
  // MediaPipe puts it; the world ones carry the field but leave it undefined.
  let visSum = 0;
  let visCount = 0;
  for (const i of Object.keys(NAMES).map(Number)) {
    const v = vis(i);
    visSum += v;
    visCount++;
    if (v < GATE) report.weak.push(NAMES[i]);
  }
  report.visibility = visCount ? visSum / visCount : 0;

  const p = (i: number) => v3(lm[i]);

  // --- Pelvis: absolute orientation, as a delta from the rest basis ---------
  const hipL = p(P.L_HIP);
  const hipR = p(P.R_HIP);
  const shL = p(P.L_SHOULDER);
  const shR = p(P.R_SHOULDER);
  const hipC = mid(hipL, hipR);
  const shC = mid(shL, shR);

  const pelvis = bones.get("Pelvis");
  if (pelvis) {
    let restB = REST_BASIS.get(mesh.skeleton);
    if (!restB) {
      // The figure's own rest basis, measured off its bones rather than
      // assumed: across from its right hip to its left, up from the pelvis to
      // the chest. Whatever the export's world orientation is, it cancels.
      const bl = bones.get("HipL");
      const br = bones.get("HipR");
      const chest = bones.get("Chest");
      const wp = new THREE.Vector3().setFromMatrixPosition(pelvis.matrixWorld);
      const across =
        bl && br
          ? new THREE.Vector3()
              .setFromMatrixPosition(bl.matrixWorld)
              .sub(new THREE.Vector3().setFromMatrixPosition(br.matrixWorld))
          : new THREE.Vector3(1, 0, 0);
      const up = chest
        ? new THREE.Vector3().setFromMatrixPosition(chest.matrixWorld).sub(wp)
        : new THREE.Vector3(0, 1, 0);
      restB = new THREE.Quaternion().setFromRotationMatrix(basis(across, up));
      REST_BASIS.set(mesh.skeleton, restB);
    }

    const targetB = new THREE.Quaternion().setFromRotationMatrix(
      basis(new THREE.Vector3().subVectors(hipL, hipR), new THREE.Vector3().subVectors(shC, hipC)),
    );
    // delta = target * rest⁻¹, applied to the pelvis's own rest world rotation.
    const delta = targetB.clone().multiply(restB.clone().invert());
    const world = pelvis.getWorldQuaternion(new THREE.Quaternion()).premultiply(delta);
    if (pelvis.parent) {
      world.premultiply(pelvis.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    }
    pelvis.quaternion.copy(world);
    pelvis.updateMatrixWorld(true);
    report.driven.add("Pelvis");
    report.solved++;
  }

  // --- Spine and head ------------------------------------------------------
  // The chest is aimed up the spine; the neck at the nose. Two landmarks is
  // all the upper body offers, so the belly is left at rest rather than given
  // an invented share of the bend.
  const chest = bones.get("Chest");
  if (chest) {
    aim(chest, new THREE.Vector3().subVectors(shC, hipC), axisOf(chest));
    report.driven.add("Chest");
    report.solved++;
  }
  //
  // The neck is aimed between the ears, not at the nose. A nose sits on the
  // front of a face, about 0.19 m forward of the shoulder line on this
  // footage, so aiming the neck bone at it pitches the head forward by 52
  // degrees on a dancer standing straight — which is what made the figure look
  // hunched, head down, back rounded. The ears sit near the head's own axis
  // and cost about 21 degrees on the same frame, most of which is the real
  // forward carriage of the head.
  const neck = bones.get("Neck");
  if (neck) {
    const ears = mid(p(P.L_EAR), p(P.R_EAR));
    aim(neck, new THREE.Vector3().subVectors(ears, shC), axisOf(neck));
    report.driven.add("Neck");
    report.solved++;
  }

  // --- Limbs ---------------------------------------------------------------
  for (const { bone, from, to } of BODY) {
    const b = bones.get(boneKey(bone));
    if (!b) {
      report.missing.push(bone);
      continue;
    }
    aim(b, new THREE.Vector3().subVectors(p(to), p(from)), axisOf(b));
    report.driven.add(boneKey(bone));
    report.solved++;
  }

  // --- Two-handed mudras ---------------------------------------------------
  //
  // After the limbs, because it corrects what they produced, and before the
  // hands, because that step only orients the palm and fingers — it never moves
  // the wrist, so closing the arms first cannot undo it.
  const arms = armSpec(mesh, bones);
  if (arms) closeContact(bones, frame, arms, report);

  // --- Hands ---------------------------------------------------------------
  for (const side of ["L", "R"] as const) {
    const hand = side === "L" ? frame.left : frame.right;
    if (!hand) continue;
    report.hands[side === "L" ? "left" : "right"] = true;
    solveHand(bones, hand.world, side, report);
  }

  mesh.skeleton.bones[0].updateMatrixWorld(true);

  // --- Residuals: what the figure actually ended up doing ------------------
  for (const { bone, from, to } of BODY) {
    const b = bones.get(boneKey(bone));
    if (!b) continue;
    const want = new THREE.Vector3().subVectors(p(to), p(from)).normalize();
    const got = axisOf(b).clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()));
    const error = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(got.dot(want), -1, 1)));
    report.residuals.push({ bone, error });
  }
  report.residuals.sort((a, b) => b.error - a.error);
  report.worst = report.residuals[0]?.error ?? 0;

  return report;
}

/**
 * Poses one hand's palm and fingers from that hand's landmarks.
 *
 * The palm gets a full orientation rather than a direction, because a hand
 * pointing the right way with the wrong roll is a different mudra — the whole
 * distinction between Pataka and its neighbours lives in the palm's plane. The
 * three landmarks at the base of the hand give that plane directly.
 */
function solveHand(
  bones: Map<string, THREE.Bone>,
  w: Landmark[],
  side: "L" | "R",
  report: Report,
) {
  if (!w || w.length < 21) return;

  const palm = bones.get(`Palm${side}`);
  if (palm) {
    const wrist = v3(w[H.WRIST]);
    const idx = v3(w[H.INDEX_MCP]);
    const pky = v3(w[H.PINKY_MCP]);
    const midMcp = v3(w[H.MIDDLE_MCP]);

    // Up the hand, and across it from pinky to index. On the right hand that
    // crossing runs the other way round the wrist, so the sign flips — without
    // it one palm comes out mirrored and every mudra on that side reads wrong.
    const up = new THREE.Vector3().subVectors(midMcp, wrist);
    const across = new THREE.Vector3().subVectors(idx, pky);
    if (side === "R") across.negate();

    // Aim first, then roll: the swing that points the palm up the hand leaves
    // the rotation about that axis free, and it is exactly that freedom the
    // palm plane pins down.
    aim(palm, up, axisOf(palm));
    palm.updateWorldMatrix(true, false);

    const wq = palm.getWorldQuaternion(new THREE.Quaternion());
    const axis = axisOf(palm).clone().applyQuaternion(wq).normalize();
    // Component of the measured across-vector perpendicular to the bone axis,
    // against where the rig's own across-vector currently sits.
    const want = across.clone().projectOnPlane(axis).normalize();
    const have = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(wq)
      .projectOnPlane(axis)
      .normalize();
    if (want.lengthSq() > 1e-6 && have.lengthSq() > 1e-6) {
      const roll = new THREE.Quaternion().setFromUnitVectors(have, want);
      const world = wq.premultiply(roll);
      if (palm.parent) {
        world.premultiply(palm.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
      }
      palm.quaternion.copy(world);
      palm.updateWorldMatrix(false, false);
    }
    report.solved++;
  }

  for (const { stem, joints } of FINGERS) {
    for (let i = 0; i < 3; i++) {
      const name = `${stem}${i + 1}${side}`;
      const bone = bones.get(name);
      if (!bone) {
        report.missing.push(name);
        continue;
      }
      const dir = new THREE.Vector3().subVectors(v3(w[joints[i + 1]]), v3(w[joints[i]]));
      aim(bone, dir, axisOf(bone));
      report.driven.add(name);
      report.solved++;
    }
  }
}
