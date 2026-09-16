/**
 * Takes the shake out of the figure, without making it late.
 *
 * The shake is not really the tracker's fault, and it is not fixed by
 * smoothing the landmarks harder. A pose landmark that wobbles by a millimetre
 * is doing well; the trouble is what retargeting does with that millimetre.
 * Aiming a bone converts a *position* error into an *angle* error, divided by
 * the bone's length — so a short bone amplifies it, which is why fingers shake
 * worst — and near full extension the conversion blows up, because the
 * direction between two nearly-coincident points is nearly undefined. Smoothing
 * positions cannot see any of that. The rotation is where the noise ends up, so
 * the rotation is where it has to be filtered.
 *
 * The filter is Casiez et al.'s **One Euro**, which exists because the obvious
 * alternatives both fail in ways anyone can see:
 *
 *   - A fixed low-pass smooth enough to hold a still hand steady drags visibly
 *     behind a fast one. The dancer's hand arrives, the puppet's follows a
 *     beat later, and in a form built on hitting positions on the beat that is
 *     worse than the shake.
 *   - A filter loose enough to keep up with a fast hand does nothing for a
 *     still one, which is precisely when a viewer notices jitter.
 *
 * One Euro escapes the trade by making the cutoff depend on speed: heavy
 * smoothing when a joint is nearly still, almost none when it is moving fast.
 * A held mudra locks solid; a strike lands on time. Two parameters, and they
 * mean something — `minCutoff` sets how still a held pose looks, `beta` sets
 * how quickly the filter gets out of the way once things move.
 */

import * as THREE from "three";
import { JOINT_COUNT } from "./skeleton";

export interface SmoothOptions {
  /**
   * Cutoff in Hz at zero speed. Lower is steadier and lazier.
   *
   * 1.2 holds a still hand visibly steady while staying short of the point
   * where slow, deliberate movement starts to feel syrupy.
   */
  minCutoff?: number;
  /**
   * How fast the filter opens up as the joint speeds up.
   *
   * The one to reach for. Too low and fast movement lags; too high and the
   * shake comes back during movement, where it is admittedly less visible.
   */
  beta?: number;
  /** Cutoff for the speed estimate itself, which is noisy in its own right. */
  dCutoff?: number;
}

const DEFAULTS: Required<SmoothOptions> = { minCutoff: 1.2, beta: 0.06, dCutoff: 1 };

/** Smoothing factor for a first-order low-pass at `cutoff`, given a timestep. */
function alphaFor(cutoff: number, dt: number) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

/**
 * One filter per joint, holding the state between frames.
 *
 * Deliberately stateful and deliberately owned by the caller: a filter that
 * silently carried state across a seek would blend the pose at 0:12 into the
 * pose at 1:40 and take a second to recover. `feed` watches the timestamps and
 * resets itself when they stop being continuous.
 */
export class PoseSmoother {
  private opts: Required<SmoothOptions>;
  /** Last filtered rotation per joint. */
  private prev: THREE.Quaternion[] = [];
  /** Last filtered angular speed per joint, rad/s. */
  private speed: Float32Array = new Float32Array(JOINT_COUNT);
  private lastT = Number.NaN;
  private primed = false;

  constructor(opts: SmoothOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    for (let i = 0; i < JOINT_COUNT; i++) this.prev.push(new THREE.Quaternion());
  }

  set(opts: SmoothOptions) {
    this.opts = { ...this.opts, ...opts };
  }

  /** Forgets everything. Call on a seek, a new take, or a rig swap. */
  reset() {
    this.primed = false;
    this.lastT = Number.NaN;
    this.speed.fill(0);
  }

  /**
   * Filters one joint's rotation in place.
   *
   * `index` must be the joint's position in `JOINTS`, since that is what picks
   * out its filter state.
   */
  private one(index: number, q: THREE.Quaternion, dt: number) {
    const prev = this.prev[index];

    // Shortest path. A quaternion and its negation are the same rotation, but
    // slerping between them takes the long way round the sphere — the joint
    // spins most of a full turn to arrive where it already was.
    if (prev.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);

    const angle = 2 * Math.acos(Math.min(1, Math.abs(prev.dot(q))));
    const raw = angle / dt;

    const aD = alphaFor(this.opts.dCutoff, dt);
    const s = this.speed[index] + aD * (raw - this.speed[index]);
    this.speed[index] = s;

    const cutoff = this.opts.minCutoff + this.opts.beta * s;
    const a = alphaFor(cutoff, dt);

    prev.slerp(q, a);
    q.copy(prev);
  }

  /**
   * Filters a whole pose, read from and written back to `read`/`write`.
   *
   * Kept as a callback pair rather than taking an array so this can sit
   * directly on the rig's bones without a copy in between.
   */
  feed(
    t: number,
    count: number,
    read: (i: number, into: THREE.Quaternion) => boolean,
    write: (i: number, q: THREE.Quaternion) => void,
  ) {
    let dt = t - this.lastT;
    // A backwards or distant jump is a seek, not a frame. Re-priming is the
    // honest response: there is no motion between those two poses to estimate.
    if (!this.primed || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) {
      this.primed = true;
      this.lastT = t;
      this.speed.fill(0);
      for (let i = 0; i < count; i++) if (read(i, this.prev[i])) write(i, this.prev[i]);
      return;
    }
    this.lastT = t;
    // Guard the divide: two frames sharing a timestamp would give infinite speed.
    dt = Math.max(dt, 1e-4);

    const q = _scratch;
    for (let i = 0; i < count; i++) {
      if (!read(i, q)) continue;
      this.one(i, q, dt);
      write(i, q);
    }
  }
}

const _scratch = new THREE.Quaternion();
