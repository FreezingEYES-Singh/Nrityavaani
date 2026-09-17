import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { applyPoseSafely, boneKey, type Pose } from "./figureConstraints";
import { adornGuru } from "./guruAdornments";

/**
 * The two rigged figures, and the namaste they are put into.
 *
 * The file ships both figures in one scene, standing side by side at x = ∓0.5,
 * each with its own 60-bone skin. Only one is ever on screen, so the pair is
 * split apart on load and the caller asks for the one it wants.
 *
 * Bone convention, read off the rest pose rather than assumed: local +Y runs
 * along a bone toward its tail — `Forearm.L` sits at [0, 0.334, 0] in
 * `UpperArm.L`'s space — and the arms hang straight down, so a bone's +Y is
 * roughly world −Y at rest. Every pose angle below is therefore a *delta* on
 * the rest pose, applied in the bone's own space, which is also what makes the
 * left and right sides able to share one set of numbers: their rest rotations
 * are already mirrored, so the same local delta comes out mirrored in world.
 */

const MODEL = "/models/figures.glb";

export type Sex = "male" | "female";

let pending: Promise<THREE.Group> | null = null;

/** Loads (or returns) the scene holding both figures. Shared — do not pose it. */
export function loadFigures(): Promise<THREE.Group> {
  if (pending) return pending;
  const loader = new GLTFLoader();
  pending = loader.loadAsync(MODEL).then((gltf) => gltf.scene);
  return pending;
}

/**
 * Which skinned mesh is which figure.
 *
 * The two are told apart by where they stand, not by name: the export calls
 * them `Object_7` and `Object_71`, which says nothing, and both share a single
 * material. Sorted by rest x, the first is the female figure — established by
 * rendering them, not by assuming file order.
 */
const ORDER: Record<Sex, number> = { female: 0, male: 1 };

/**
 * A posable copy of one figure, centred on the origin and `height` units tall.
 *
 * `SkeletonUtils.clone` rather than `Object3D.clone`: a plain clone copies the
 * mesh but leaves it bound to the *original* skeleton, so posing the copy would
 * silently move the original — and two copies on screen would fight each other.
 */
export function makeFigure(source: THREE.Group, sex: Sex, height = 1.75) {
  const whole = cloneSkinned(source);

  whole.updateMatrixWorld(true);

  // The clothes are skinned meshes as well, bound to their figure's own skin
  // (`studio/tools/blender/clothes.py`), so being skinned does not make a mesh
  // a body. They carry `nvClothing` in their glTF extras, which the loader puts
  // in `userData`.
  const skins: THREE.SkinnedMesh[] = [];
  const clothes: THREE.SkinnedMesh[] = [];
  whole.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (m.isSkinnedMesh) (m.userData.nvClothing ? clothes : skins).push(m);
  });
  // Sort by rest x so the pair is identified by position, as above.
  skins.sort((a, b) => {
    const av = new THREE.Vector3().setFromMatrixPosition(a.matrixWorld).x;
    const bv = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).x;
    return av - bv;
  });

  const wanted = skins[ORDER[sex]] ?? skins[0];

  // Drop the other figure's mesh, but keep every bone: the two skeletons are
  // siblings under one root and the surviving mesh's own bones must stay.
  for (const s of skins) if (s !== wanted) s.removeFromParent();
  // A figure's clothes are the ones moved by its bones; the other's go with it.
  const worn = clothes.filter((c) => c.skeleton.bones[0] === wanted.skeleton.bones[0]);
  for (const c of clothes) if (!worn.includes(c)) c.removeFromParent();

  const group = new THREE.Group();
  group.add(whole);

  // Normalise: the figures stand about 1.75 units tall already, but the export
  // is not guaranteed to, and the scene is framed on a known height. Measured
  // on the body alone, so the clothes cannot change the figure's size or where
  // it stands, and every pose keyed against the undressed body still lands.
  group.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(wanted);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = height / (size.y || 1);
  whole.scale.multiplyScalar(scale);

  // Re-measure after scaling and sit the figure on y = 0, centred on x/z.
  group.updateWorldMatrix(true, true);
  const box2 = new THREE.Box3().setFromObject(wanted);
  const centre = new THREE.Vector3();
  box2.getCenter(centre);
  whole.position.x -= centre.x;
  whole.position.z -= centre.z;
  whole.position.y -= box2.min.y;

  // Before anything is posed: the export's leg chain does not work as it
  // stands, and every pose built on it would inherit the fault.
  repairLegs(wanted);

  dressFigure(wanted);
  for (const c of worn) wearClothes(c);
  adornGuru(wanted, sex);

  return { group, mesh: wanted, clothes: worn };
}

/**
 * How much of its own colour a garment glows with. See `wearClothes`.
 */
const CLOTH_GLOW = 0.28;

/**
 * Readies one garment to be drawn on its figure.
 *
 * Differentiates 24K gold zari brocade, lustrous royal silk, emerald blouse,
 * and Kasavu cream dhoti with tuned PBR parameters.
 */
function wearClothes(mesh: THREE.SkinnedMesh) {
  const own = (m: THREE.Material) => {
    const copy = m.clone();
    const cloth = copy as THREE.MeshStandardMaterial;
    if (cloth.isMeshStandardMaterial) {
      const name = (cloth.name || "").toLowerCase();
      if (name.includes("zari")) {
        // 24K Temple Gold Zari brocade with shimmering metallic reflection
        cloth.color = new THREE.Color("#d4af37");
        cloth.metalness = 0.82;
        cloth.roughness = 0.28;
        cloth.emissive = new THREE.Color("#352405");
      } else if (name.includes("silk")) {
        // Lustrous Royal Silk
        cloth.metalness = 0.08;
        cloth.roughness = 0.40;
        cloth.emissive.add(cloth.color.clone().multiplyScalar(CLOTH_GLOW));
      } else if (name.includes("blouse")) {
        // Peacock emerald blouse
        cloth.metalness = 0.06;
        cloth.roughness = 0.42;
        cloth.emissive.add(cloth.color.clone().multiplyScalar(CLOTH_GLOW));
      } else if (name.includes("dhoti")) {
        // Kerala Kasavu ivory cream dhoti
        cloth.metalness = 0.02;
        cloth.roughness = 0.48;
        cloth.emissive.add(cloth.color.clone().multiplyScalar(CLOTH_GLOW));
      } else {
        cloth.emissive.add(cloth.color.clone().multiplyScalar(CLOTH_GLOW));
      }
    }
    return copy;
  };
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
  mesh.frustumCulled = false;
}

/**
 * The skin: warm honey-sandalwood complexion with subsurface scattering depth.
 */
const SKIN = "#b97950";
const SKIN_GLOW = 0.16;
const SSS_DERMAL_WARMTH = "#7a2612";

/**
 * Gives the figure luminous, living skin with subsurface depth and tejas sheen.
 */
function dressFigure(mesh: THREE.SkinnedMesh) {
  const skin = new THREE.Color(SKIN);
  const sss = new THREE.Color(SSS_DERMAL_WARMTH).multiplyScalar(0.18);
  const material = new THREE.MeshStandardMaterial({
    color: skin,
    emissive: skin.clone().multiplyScalar(SKIN_GLOW).add(sss),
    roughness: 0.46,
    metalness: 0.04,
    side: THREE.FrontSide,
    flatShading: false,
  });
  mesh.material = material;
  mesh.frustumCulled = false;
}

/**
 * Repairs the leg chain, which the export shipped broken.
 *
 * Blender's IK targets came through as ordinary bones, and the feet were
 * parented to them rather than to the shins:
 *
 *     Hip.L → Shin.L → (nothing)
 *     LegIK.L → Foot.L → Toes.L
 *
 * `LegIK` is a control bone: it carries no skin weight and nothing drives it,
 * so rotating a hip moved the thigh and calf and left the foot hanging in
 * space. The feet themselves are fine — `Foot.L` carries 104 units of skin
 * weight and `Toes.L` 38, so they deform the mesh properly once something
 * actually moves them.
 *
 * Re-parenting each foot onto its shin restores plain FK, Hip → Shin → Foot →
 * Toes. The world transform is preserved across the move, so the rest pose is
 * unchanged and the inverse bind matrices stay valid — skinning reads
 * `bone.matrixWorld * inverseBind`, and only the route by which matrixWorld is
 * computed has changed, not its value.
 */
export function repairLegs(mesh: THREE.SkinnedMesh) {
  const bones = new Map<string, THREE.Bone>();
  for (const b of mesh.skeleton.bones) {
    bones.set(b.name.replace(/_\d+$/, "").replace(/[.\s]/g, ""), b);
  }

  const moved: string[] = [];
  for (const side of ["L", "R"] as const) {
    const shin = bones.get(`Shin${side}`);
    const foot = bones.get(`Foot${side}`);
    if (!shin || !foot || foot.parent === shin) continue;

    foot.updateWorldMatrix(true, false);
    shin.updateWorldMatrix(true, false);
    const world = foot.matrixWorld.clone();

    shin.add(foot);
    // Local = parent⁻¹ · world, so the bone lands exactly where it already was.
    foot.matrix.copy(shin.matrixWorld).invert().multiply(world);
    foot.matrix.decompose(foot.position, foot.quaternion, foot.scale);
    moved.push(`Foot.${side}`);
  }

  mesh.skeleton.bones[0].updateMatrixWorld(true);


  return moved;
}

/**
 * Anjali mudra, as a table of joint angles — one table per figure.
 *
 * Angles are degrees of delta on the rest pose, in the bone's own space, and
 * each table is mirrored onto both sides by `expand` below.
 *
 * Per figure, because one table demonstrably cannot serve both. Applying the
 * man's angles to the woman leaves her hands 27.9 mm apart with nothing
 * touching at all; hers on him leaves his 21.0 mm apart, likewise nothing. The
 * two bodies differ enough through the arm that a shared table has to be wrong
 * for at least one of them, and the shared one that was here was wrong for
 * both — his hands merged, hers never met.
 *
 * Solved against the deformed surface — the triangles the renderer draws —
 * rather than against bone positions. That distinction is the whole reason the
 * previous numbers could be wrong while measuring as correct:
 *
 *  - Bones say nothing about skin. The old table held the bone chain at a
 *    textbook separation while the palms it carried were forty degrees apart.
 *  - Vertex sampling is not a distance between surfaces. On a mesh this coarse
 *    two palms meet face to face and the nearest *vertices* are the corners of
 *    those faces; on a test case with one face 0.05 above another it reports
 *    42x the true gap, and it cannot see a face pass clean through a face.
 *
 * The measure that decides whether a namaste is possible at all is the angle
 * between the two palm planes. Palms held at an angle meet along one edge and
 * must then either gape or bury themselves in one another, and no amount of
 * moving the arms closer will fix it. Every earlier attempt spent itself
 * choosing between those two failures without naming the cause.
 *
 * Contact area alone is not enough either, and pursued on its own it actively
 * misleads: a curled hand brings more surface within reach of the other one, so
 * maximising contact curls both hands into claws while every number improves.
 * Finger straightness is therefore measured from bone *directions* rather than
 * joint positions — the last phalanx has nothing downstream of it, so a fully
 * curled fingertip moves no measured joint and scores as perfectly straight.
 *
 * One more thing none of the above can see, and it took someone looking at the
 * figure to catch: the line from one elbow, through the joined hands, to the
 * other elbow. In the danced mudra that line is straight and level seen from
 * the front. Bent, it reads as a steeple — a different gesture — and every
 * contact measure here is completely indifferent to it, because the hands can
 * be flush, parallel, centred and at the right height with the forearms at any
 * angle at all. An earlier pose scored clean throughout while bent to 126°.
 *
 * What these produce, measured on the drawn surface (`tools/namaste/verify`,
 * which poses through the shipped `applyNamaste`, constraint pass and all):
 *
 *          palm planes   overlapping   deepest overlap   fingers   forearm climb
 *   man        2.4°        19 faces        4.3 mm         1.00       3°
 *   woman      1.3°        68 faces        2.4 mm         0.98       7°
 *
 * The man's fingertips still sit 18-22 mm apart and the pinky ~35 mm: the two
 * figures' below-elbow skeletons are not mirrored, so one mirrored table can
 * square the woman's palms but only bring the man's close. Neither figure
 * trips the torso rule, so nothing is eased back at runtime.
 * `tools/namaste` re-measures all of it, and draws the elbow line on the figure.
 */
const NAMASTE_ARMS: Record<Sex, Pose> = {
  male: {
    Collar: { z: -7 },
    UpperArm: { x: 10, y: 77, z: 1 },
    Forearm: { x: 76, y: 13, z: -34 },
    Palm: { x: 47, y: -61, z: -62 },
  },
  female: {
    Collar: { z: -22 },
    UpperArm: { x: 5, y: 84, z: 18 },
    Forearm: { x: 96, y: 3, z: -35 },
    Palm: { x: 59, y: -78, z: -67 },
  },
};

/** Fingers come out of their relaxed curl and press flat together. */
const FINGERS = ["Index", "Middle", "Ring", "Pinky"];
const FINGER_STRAIGHTEN: Record<Sex, number[]> = {
  male: [35, 42, 41],
  female: [36, 26, 49],
};
// The man's thumb is held at 26 rather than the 18 the solve preferred: at 18
// the tip grazes the chest volume, which is nothing to look at but enough for
// the constraint pass to ease the whole arm back, and a pose that ships eased
// back is not the pose that was solved.
const THUMB: Record<Sex, number> = { male: 26, female: 18 };

/** Spine bones, which have no side. */
const NAMASTE_SPINE: Pose = {
  Neck: { x: -8 },
  Head: { x: -4 },
};

/** Mirrors one figure's table onto `.L` and `.R`, and adds the fingers. */
function expand(sex: Sex): Pose {
  const pose: Pose = { ...NAMASTE_SPINE };
  for (const side of ["L", "R"] as const) {
    for (const [stem, angles] of Object.entries(NAMASTE_ARMS[sex])) {
      pose[`${stem}.${side}`] = angles;
    }
    for (const finger of FINGERS) {
      FINGER_STRAIGHTEN[sex].forEach((x, i) => (pose[`${finger}${i + 1}.${side}`] = { x }));
    }
    for (const i of [1, 2, 3]) pose[`Thumb${i}.${side}`] = { x: THUMB[sex] };
  }
  return pose;
}

export const NAMASTE: Record<Sex, Pose> = {
  male: expand("male"),
  female: expand("female"),
};

/** The stored angles for one bone, by normalised name. Zero if it is untouched. */
export function storedAngles(bone: string, sex: Sex = "male") {
  for (const [name, angles] of Object.entries(NAMASTE[sex])) {
    if (boneKey(name) === bone) return { x: 0, y: 0, z: 0, ...angles };
  }
  return { x: 0, y: 0, z: 0 };
}

/**
 * Puts `mesh` into namaste, subject to the joint limits and the body volume.
 *
 * Everything the constraints had to give up comes back rather than being
 * swallowed, so a caller can report that the pose on screen is not quite the
 * pose that was asked for.
 */
export function applyNamaste(
  mesh: THREE.SkinnedMesh,
  height = 1.75,
  sex: Sex = "male",
  /** Per-bone angles that replace the stored ones, keyed by normalised name. */
  overrides?: Pose,
) {
  let pose = NAMASTE[sex];
  if (overrides && Object.keys(overrides).length) {
    pose = { ...NAMASTE[sex] };
    for (const name of Object.keys(NAMASTE[sex])) {
      const o = overrides[boneKey(name)];
      if (o) pose[name] = o;
    }
    // Bones the stored pose says nothing about, but the editor has touched.
    for (const [name, angles] of Object.entries(overrides)) {
      if (!Object.keys(NAMASTE[sex]).some((n) => boneKey(n) === name)) pose[name] = angles;
    }
  }
  const result = applyPoseSafely(mesh, pose, height, sex);
  if (result.missing.length) {
    console.warn(`namaste: bones not found — ${result.missing.join(", ")}`);
  }
  return result;
}

/** Frees the geometry and materials of a figure built by `makeFigure`. */
export function disposeFigure(group: THREE.Object3D) {
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mat = m.material;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}
