import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type Landmarks } from "./mudraRig";

/**
 * The rigged hand model, driven by the baked mudra landmarks.
 *
 * The model ships a real skeleton — 23 joints with skin weights — and its bone
 * chains line up one-to-one with MediaPipe's 21-landmark layout, four joints
 * per finger. So rather than deforming vertices by hand we take a mudra's
 * landmarks and aim each bone along the direction its landmark pair implies.
 *
 * Aiming by *direction* rather than at absolute positions matters: the model
 * keeps its own bone lengths and proportions and only adopts the pose. The
 * glowing joints drawn on top then read their positions back out of the posed
 * skeleton, so the overlay and the mesh cannot drift apart.
 *
 * Model axes: Z = wrist->fingertip, X = thumb->pinky, Y = palm normal.
 */

/** Stands in for the wrist, landmark 0. */
const WRIST_BONE = "L_Hand_00";

/** Bone names per digit, base to tip, in MediaPipe order. */
const CHAINS: string[][] = [
  ["L_Hand_Thumb_1_019", "L_Hand_Thumb_2_020", "L_Hand_Thumb_3_021"],
  ["L_Hand_Index_1_03", "joint5_04", "joint6_05", "joint7_06"],
  ["L_Hand_Middle_1_07", "joint9_08", "joint10_09", "joint11_010"],
  ["L_Hand_Ring_1_011", "joint13_012", "joint14_013", "joint15_014"],
  ["L_Hand_Pinky_1_015", "joint17_016", "joint18_017", "joint19_018"],
];

/**
 * Landmark index of each chain's joints, matching CHAINS.
 *
 * Every chain ends on a tip marker — a stub bone carrying just the handful of
 * vertices in the fingertip cap, which is how you tell it apart from a mid
 * joint that drags a whole phalanx of flesh behind it. The thumb has three
 * bones to the fingers' four because it is genuinely one joint shorter:
 * knuckle, interphalangeal, tip. What it lacks is at the other end — the
 * carpal joint, which the model skips by hanging the thumb off the palm.
 */
const CHAIN_LANDMARKS: number[][] = [
  [2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];

export type RiggedHand = {
  root: THREE.Object3D;
  /** Poses the skeleton, then writes the resulting joint positions into `out`. */
  pose: (landmarks: Landmarks, out: THREE.Vector3[]) => void;
  setOpacity: (v: number) => void;
  setTheme?: (isLight: boolean) => void;
  dispose: () => void;
};

/**
 * `fit` is any mudra's landmarks, used once to size and place the model so it
 * occupies the same space the baked coordinates describe.
 */
export async function loadRiggedHand(url: string, fit: Landmarks): Promise<RiggedHand> {
  const gltf = await new GLTFLoader().loadAsync(url);

  let skinned: THREE.SkinnedMesh | null = null;
  gltf.scene.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned = o as THREE.SkinnedMesh;
  });
  if (!skinned) throw new Error("no SkinnedMesh in hand model");
  const mesh = skinned as THREE.SkinnedMesh;

  const bones = new Map<string, THREE.Bone>();
  gltf.scene.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.set(o.name, o as THREE.Bone);
  });

  const chains = CHAINS.map((names) =>
    names.map((n) => {
      const b = bones.get(n);
      if (!b) throw new Error(`missing bone ${n}`);
      return b;
    }),
  );

  const wrist = bones.get(WRIST_BONE);
  if (!wrist) throw new Error(`missing bone ${WRIST_BONE}`);

  /** The thumb's knuckle bone, landmark 2. */
  const thumbBase = chains[0][0];

  // Translucent so the landmark overlay stays visible through the hand. A
  // standard material is used rather than a custom shader because it supports
  // skinning natively; the rim glow comes from the scene's own point lights.
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#c96a2a"),
    emissive: new THREE.Color("#ff7a1a"),
    // Kept low: emissive ignores the lights and fills the surface evenly, which
    // is exactly what makes a translucent object read as solid.
    emissiveIntensity: 0.16,
    roughness: 0.42,
    metalness: 0.12,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    // Front faces only. The hand is a closed mesh, so DoubleSide draws its far
    // wall behind the near one and the two alphas compound — 0.26 twice over
    // reads near 0.45, which is why it looked solid. We never see its back.
    side: THREE.FrontSide,
  });
  // Swapped out, so the GLTF's own material and its textures are ours to free.
  const original = mesh.material as THREE.Material | THREE.Material[];
  mesh.material = material;
  mesh.frustumCulled = false;

  // Orient the model into rig space: its fingers run along +Z, ours along +Y.
  const root = new THREE.Group();
  const oriented = new THREE.Group();
  oriented.rotation.x = -Math.PI / 2;
  oriented.add(gltf.scene);
  root.add(oriented);

  // Fit the model to the frame the baked landmarks describe: the same
  // wrist-to-fingertip reach, with the wrist landing on the same point. The two
  // then occupy one space, so the bare skeleton drawn before the model arrives
  // doesn't jump when it lands, and a single offset in the caller centres both.
  const restWrist = new THREE.Vector3();
  const restTip = new THREE.Vector3();
  const measureRest = () => {
    root.updateMatrixWorld(true);
    restWrist.setFromMatrixPosition(wrist.matrixWorld);
    restTip.setFromMatrixPosition(chains[2][3].matrixWorld);
  };
  measureRest();
  oriented.scale.setScalar(
    fit[0].distanceTo(fit[12]) / (restWrist.distanceTo(restTip) || 1),
  );
  // Re-measure: the wrist has moved under the new scale.
  measureRest();
  oriented.position.add(fit[0]).sub(restWrist);

  /**
   * A stand-in carpal joint for the thumb.
   *
   * The thumb has to swing from its base to reach the fingers, and the model
   * gives it no carpal bone to swing on. Moving the knuckle bone instead would
   * be wrong twice over: a joint rotates, it does not travel, and dragging the
   * bone away from its parent stretches the web of the hand with it. So an
   * empty is planted at the carpal joint and the whole thumb hangs off it.
   * Rotating that pivot carries the metacarpal round on a fixed radius — the
   * model's own — and no bone changes length.
   *
   * `attach` rather than `add`: it reparents without disturbing the pose.
   */
  const thumbPivot = new THREE.Object3D();
  {
    const parent = thumbBase.parent ?? oriented;
    root.updateMatrixWorld(true);
    thumbPivot.position.copy(fit[1]).applyMatrix4(root.matrixWorld);
    parent.worldToLocal(thumbPivot.position);
    parent.add(thumbPivot);
    thumbPivot.updateMatrixWorld(true);
    thumbPivot.attach(thumbBase);
  }

  const boneWorld = new THREE.Vector3();
  const childWorld = new THREE.Vector3();
  const from = new THREE.Vector3();
  const swing = new THREE.Quaternion();
  const parentQ = new THREE.Quaternion();
  const boneQ = new THREE.Quaternion();

  /**
   * Rotates `bone` so the segment running to `child` points along `dir`
   * (a unit vector in world space).
   */
  const aim = (bone: THREE.Object3D, child: THREE.Object3D, dir: THREE.Vector3) => {
    boneWorld.setFromMatrixPosition(bone.matrixWorld);
    childWorld.setFromMatrixPosition(child.matrixWorld);
    from.subVectors(childWorld, boneWorld);
    if (from.lengthSq() < 1e-12) return;
    from.normalize();

    swing.setFromUnitVectors(from, dir);
    bone.getWorldQuaternion(boneQ);
    boneQ.premultiply(swing);

    if (bone.parent) {
      bone.parent.getWorldQuaternion(parentQ);
      bone.quaternion.copy(parentQ.invert().multiply(boneQ));
    } else {
      bone.quaternion.copy(boneQ);
    }
    bone.updateMatrixWorld(true);
  };

  const dir = new THREE.Vector3();
  const inv = new THREE.Matrix4();

  const pose = (joints: Landmarks, out: THREE.Vector3[]) => {
    // Ancestors as well as descendants: the group holding the hand is rotated
    // afresh every frame, and aiming reads bone transforms in world space, so
    // a stale parent would skew every bone by that frame's sway.
    root.updateWorldMatrix(true, true);

    // Swing the whole thumb about its carpal joint first, so the chain below
    // starts from the right place. This is what gives the thumb the reach to
    // meet the fingers in Kartarimukha and Mayura; pinned at the knuckle it
    // falls short of them at every angle.
    dir.subVectors(joints[2], joints[1]);
    if (dir.lengthSq() > 1e-12) {
      dir.transformDirection(root.matrixWorld);
      aim(thumbPivot, thumbBase, dir);
    }

    for (let c = 0; c < chains.length; c++) {
      const chain = chains[c];
      const lm = CHAIN_LANDMARKS[c];
      // Aim each bone down the chain; each aim invalidates the ones below it,
      // so they are updated in order from the base outward.
      for (let i = 0; i < chain.length - 1; i++) {
        dir.subVectors(joints[lm[i + 1]], joints[lm[i]]);
        if (dir.lengthSq() < 1e-12) continue;
        // The landmarks are in root space, but the bones report themselves in
        // world space. Carry the target direction across (transformDirection
        // also normalizes) so both sides of the swing share one frame.
        dir.transformDirection(root.matrixWorld);
        aim(chain[i], chain[i + 1], dir);
      }
    }

    // Read the posed skeleton back out so the overlay matches the mesh exactly.
    inv.copy(root.matrixWorld).invert();
    out[0].setFromMatrixPosition(wrist.matrixWorld).applyMatrix4(inv);
    for (let c = 0; c < chains.length; c++) {
      const chain = chains[c];
      const lm = CHAIN_LANDMARKS[c];
      for (let i = 0; i < chain.length; i++) {
        out[lm[i]].setFromMatrixPosition(chain[i].matrixWorld).applyMatrix4(inv);
      }
    }
    // The carpal joint reads off its pivot, like every other landmark reads off
    // a bone, so the overlay still cannot drift away from the mesh.
    out[1].setFromMatrixPosition(thumbPivot.matrixWorld).applyMatrix4(inv);
  };

  return {
    root,
    pose,
    setOpacity: (v: number) => {
      material.opacity = v;
    },
    setTheme: (isLight: boolean) => {
      material.color.set(isLight ? 0xb45309 : 0xc96a2a);
      material.emissive.set(isLight ? 0x9a3412 : 0xff7a1a);
      material.emissiveIntensity = isLight ? 0.08 : 0.16;
      material.opacity = isLight ? 0.36 : 0.26;
    },
    dispose: () => {
      mesh.geometry.dispose();
      material.dispose();
      for (const m of Array.isArray(original) ? original : [original]) {
        for (const value of Object.values(m)) {
          if ((value as THREE.Texture)?.isTexture) (value as THREE.Texture).dispose();
        }
        m.dispose();
      }
    },
  };
}
