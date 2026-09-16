/**
 * One posed skeleton, to and from a flat array of numbers.
 *
 * **Rotations are stored as deltas on the rest pose, not raw local rotations.**
 * That is the decision worth explaining, because the obvious alternative — just
 * save `bone.quaternion` — breaks the moment someone touches the Woman/Man
 * toggle.
 *
 * A bone's raw local rotation bakes in whatever the modeller happened to do:
 * where the rest pose put the arm, which axis runs along the bone. The two
 * figures in `figures.glb` do not share a rest pose, so the same raw numbers
 * mean two different poses on them, and a clip saved from one plays back
 * subtly deformed on the other. The delta from rest cancels all of it — the
 * same vector means the same pose on both figures, and would mean it on a
 * third rig neither has seen.
 *
 * It is also the convention the rest of this codebase already uses: `applyPose`
 * takes "degrees of delta on the rest pose", and `retarget` returns every bone
 * to rest before it solves.
 */

import * as THREE from "three";
import { boneMap, rest } from "@/components/three/retarget";
import { JOINTS, JOINT_COUNT } from "./skeleton";

/** Numbers per joint: one quaternion. */
export const PER_JOINT = 4;

/** Length of one pose vector. */
export const DIMS = JOINT_COUNT * PER_JOINT;

// Scratch, reused across every joint of every frame. A 2550-frame take touches
// 130,000 joints; allocating per joint would put the garbage collector on the
// critical path of every export.
const _q = new THREE.Quaternion();
const _inv = new THREE.Quaternion();

/**
 * Reads the mesh's current pose into `out`.
 *
 * A joint the rig does not have is written as the identity rotation rather than
 * left as whatever was in the buffer — a stale value there would play back as a
 * real, confidently-held pose.
 */
export function encodePose(
  mesh: THREE.SkinnedMesh,
  out: Float32Array = new Float32Array(DIMS),
): Float32Array {
  const bones = boneMap(mesh);
  const restQ = rest(mesh);

  for (let j = 0; j < JOINT_COUNT; j++) {
    const at = j * PER_JOINT;
    const bone = bones.get(JOINTS[j].key);

    if (!bone) {
      out[at] = 0; out[at + 1] = 0; out[at + 2] = 0; out[at + 3] = 1;
      continue;
    }

    // delta = rest⁻¹ · local
    const r = restQ.get(bone);
    if (r) {
      _inv.copy(r).invert();
      _q.copy(_inv).multiply(bone.quaternion);
    } else {
      _q.copy(bone.quaternion);
    }

    out[at] = _q.x; out[at + 1] = _q.y; out[at + 2] = _q.z; out[at + 3] = _q.w;
  }

  return out;
}

export interface DecodeOptions {
  /**
   * Blend toward the decoded pose, 0-1. Below 1 the bone keeps some of where it
   * already was, which is how a saved clip is eased in over a few frames rather
   * than snapping the figure into its first pose.
   */
  amount?: number;
}

/** Writes a pose vector onto the mesh. */
export function decodePose(
  v: ArrayLike<number>,
  mesh: THREE.SkinnedMesh,
  { amount = 1 }: DecodeOptions = {},
) {
  const bones = boneMap(mesh);
  const restQ = rest(mesh);

  for (let j = 0; j < JOINT_COUNT; j++) {
    const bone = bones.get(JOINTS[j].key);
    if (!bone) continue;

    const at = j * PER_JOINT;
    _q.set(v[at], v[at + 1], v[at + 2], v[at + 3]);
    // Guard against a zero quaternion, which normalises to NaN and would take
    // the whole limb below it with it.
    if (_q.lengthSq() < 1e-12) _q.identity();
    else _q.normalize();

    // local = rest · delta
    const r = restQ.get(bone);
    if (r) _q.premultiply(r);

    if (amount >= 1) bone.quaternion.copy(_q);
    else bone.quaternion.slerp(_q, amount);
  }

  mesh.skeleton.bones[0].updateMatrixWorld(true);
}

/**
 * Angle between the rotations two vectors encode, per joint, in degrees.
 *
 * The readable way to compare poses. A network or a diff would use squared
 * distance, but 0.03 means nothing to a person where "the elbow is 4 degrees
 * out" means everything.
 */
export function poseError(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const out: number[] = new Array(JOINT_COUNT);

  for (let j = 0; j < JOINT_COUNT; j++) {
    const at = j * PER_JOINT;
    qa.set(a[at], a[at + 1], a[at + 2], a[at + 3]).normalize();
    qb.set(b[at], b[at + 1], b[at + 2], b[at + 3]).normalize();
    // |dot| rather than dot: q and -q are the same rotation, and without the
    // absolute value half of all identical pairs would read as 180° apart.
    const d = Math.min(1, Math.abs(qa.dot(qb)));
    out[j] = THREE.MathUtils.radToDeg(2 * Math.acos(d));
  }

  return out;
}
