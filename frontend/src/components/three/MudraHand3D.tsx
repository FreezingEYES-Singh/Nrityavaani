"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  BONES,
  MUDRAS,
  TIPS,
  jointsToLandmarks,
  makeJointScratch,
  mixJoints,
  type Landmarks,
} from "./mudraRig";
import { loadRiggedHand, type RiggedHand } from "./handRig";

const HOLD_MS = 2400;
const MORPH_MS = 1500;
const CYCLE_MS = HOLD_MS + MORPH_MS;

const SAFFRON = new THREE.Color("#FF9933");
const GOLD = new THREE.Color("#FFD700");

/** Ken Perlin's smootherstep — zero first and second derivative at both ends. */
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Soft radial dot, used for the joint bloom and the mandala points. */
function radialTexture(inner: string, outer: string) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, "rgba(255,153,51,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Concentric petal rings behind the hand, loosely a rangoli. */
function mandalaGeometry() {
  const pts: number[] = [];
  const shade: number[] = [];
  for (let ring = 0; ring < 7; ring++) {
    const radius = 1.75 + ring * 0.3;
    const count = 26 + ring * 9;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const petal = 1 + 0.11 * Math.sin(a * 8) + 0.05 * Math.cos(a * 16);
      pts.push(
        Math.cos(a) * radius * petal,
        Math.sin(a) * radius * petal,
        -1.5 - ring * 0.16 + Math.sin(a * 6) * 0.12,
      );
      shade.push(1 - ring / 9);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  geo.setAttribute("aShade", new THREE.Float32BufferAttribute(shade, 1));
  return geo;
}

/** Lets the surrounding page drive the cycle. */
export type MudraHandHandle = {
  /** Forms `index` and carries the cycle on from there. */
  goTo: (index: number) => void;
};

export default function MudraHand3D({
  onPoseChange,
  handleRef,
  staticPose,
  className = "",
}: {
  onPoseChange?: (index: number) => void;
  handleRef?: React.RefObject<MudraHandHandle | null>;
  staticPose?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  // The scene is built once; this keeps it calling the current callback
  // without tearing down and rebuilding WebGL on every parent render.
  const poseCbRef = useRef(onPoseChange);
  useEffect(() => {
    poseCbRef.current = onPoseChange;
  });

  const staticPoseRef = useRef(staticPose);
  useEffect(() => {
    staticPoseRef.current = staticPose;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disposables: { dispose(): void }[] = [];

    // ---- renderer -------------------------------------------------------
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL — the caller's static fallback stays visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // The rig spans roughly 2.1 units tall; 4.7 back on a 38° vertical fov
    // leaves it at about two thirds of frame height, with room to rotate.
    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.7);

    // ---- lighting -------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.PointLight(0xff9933, 26, 18, 2);
    key.position.set(-2.2, 2.4, 3);
    const rim = new THREE.PointLight(0xffd700, 18, 16, 2);
    rim.position.set(2.6, 0.4, 1.6);
    const back = new THREE.PointLight(0x8b5cf6, 22, 16, 2);
    back.position.set(0.4, -1.4, -2.6);
    scene.add(key, rim, back);

    // ---- hand group -----------------------------------------------------
    const hand = new THREE.Group();
    const HAND_Y = -0.9; // centres the wrist-to-fingertip span on the camera axis
    hand.position.y = HAND_Y;
    scene.add(hand);

    const joints = Array.from({ length: 21 }, () => new THREE.Vector3());
    // Scratch for the morph, so blending two mudras allocates nothing per frame:
    // angles blend into `midway`, which is then solved into `blend`.
    const blend = Array.from({ length: 21 }, () => new THREE.Vector3());
    const midway = makeJointScratch();

    const jointGeo = new THREE.IcosahedronGeometry(1, 2);
    const jointMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const jointMesh = new THREE.InstancedMesh(jointGeo, jointMat, 21);
    jointMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    hand.add(jointMesh);
    disposables.push(jointGeo, jointMat);

    const boneGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0x2a1b10,
      metalness: 0.92,
      roughness: 0.26,
      emissive: new THREE.Color("#ff7a1a"),
      emissiveIntensity: 0.22,
    });
    const boneMesh = new THREE.InstancedMesh(boneGeo, boneMat, BONES.length);
    boneMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    hand.add(boneMesh);
    disposables.push(boneGeo, boneMat);

    // The real hand mesh, fetched and then bound to these same joints. Until it
    // arrives the skeleton renders on its own, which is a fine intermediate
    // state; if the fetch fails it simply stays that way.
    let rigged: RiggedHand | null = null;
    let disposed = false;

    // Per-joint colour ramp: saffron at the knuckle, gold at the fingertip.
    const rampColor = new THREE.Color();
    for (let i = 0; i < 21; i++) {
      const depth = i === 0 ? 0 : ((i - 1) % 4) / 3;
      rampColor.copy(SAFFRON).lerp(GOLD, depth);
      jointMesh.setColorAt(i, rampColor);
    }
    jointMesh.instanceColor!.needsUpdate = true;

    // ---- additive bloom on every joint ----------------------------------
    const glowTex = radialTexture("rgba(255,225,170,0.95)", "rgba(255,153,51,0.35)");
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    });
    disposables.push(glowTex, glowMat);
    const glows = joints.map((_, i) => {
      const s = new THREE.Sprite(glowMat);
      const isTip = TIPS.includes(i);
      s.userData.base = isTip ? 0.2 : 0.12;
      s.scale.setScalar(s.userData.base);
      hand.add(s);
      return s;
    });

    // A wide soft aura so the hand reads against the page background.
    const auraTex = radialTexture("rgba(255,153,51,0.5)", "rgba(255,122,26,0.14)");
    const auraMat = new THREE.SpriteMaterial({
      map: auraTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.75,
      toneMapped: false,
    });
    const aura = new THREE.Sprite(auraMat);
    aura.scale.setScalar(5);
    aura.position.set(0, 0.05, -1.9);
    scene.add(aura);
    disposables.push(auraTex, auraMat);

    // ---- mandala --------------------------------------------------------
    const mandalaGeo = mandalaGeometry();
    const mandalaTex = radialTexture("rgba(255,215,0,0.9)", "rgba(255,153,51,0.3)");
    const mandalaMat = new THREE.PointsMaterial({
      size: 0.055,
      map: mandalaTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.62,
      sizeAttenuation: true,
      toneMapped: false,
    });
    const mandala = new THREE.Points(mandalaGeo, mandalaMat);
    scene.add(mandala);
    disposables.push(mandalaGeo, mandalaTex, mandalaMat);

    // ---- theme ----------------------------------------------------------
    // Read the class off <html> rather than the React ref: next-themes writes
    // the attribute and the MutationObserver fires immediately, with no
    // guarantee React has re-rendered and refreshed the ref by then.
    let isLight = document.documentElement.classList.contains("light");
    const applyTheme = () => {
      isLight = document.documentElement.classList.contains("light");
      boneMat.color.set(isLight ? 0x6b4423 : 0x2a1b10);
      boneMat.emissiveIntensity = isLight ? 0.12 : 0.22;
      mandalaMat.opacity = isLight ? 0.4 : 0.62;
      auraMat.opacity = isLight ? 0.34 : 0.75;
      glowMat.opacity = isLight ? 0.55 : 1;
      // The hand sits over a pale ground in light mode, so lift its opacity.
      rigged?.setOpacity(isLight ? 0.42 : 0.3);
    };
    applyTheme();

    loadRiggedHand("/models/hand.glb", MUDRAS[0].landmarks)
      .then((loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }
        rigged = loaded;
        hand.add(loaded.root);
        applyTheme();
        if (!running) {
          writeHand(MUDRAS[0].landmarks);
          renderer.render(scene, camera);
        }
      })
      .catch((err) => {
        if (!disposed) console.warn("hand model failed to load:", err);
      });

    // ---- interaction ----------------------------------------------------
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      // A host with no box (display: none, waiting to be shown again) has
      // nothing to aim at. Dividing by its zero size would make the target
      // infinite, and the smoothing below would carry that on as NaN — a
      // rotation that draws no hand at all, even once the host is back.
      if (!r.width || !r.height) return;
      // Clamped to the host's own edges: on a page where the hand shares the row
      // with text, reading the column beside it would otherwise put the pointer
      // several host-widths away and turn the hand edge-on.
      pointer.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pointer.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onPointerLeave = () => {
      pointer.tx = 0;
      pointer.ty = 0;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    // ---- frame ----------------------------------------------------------
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const scl = new THREE.Vector3();

    let lastEmitted = -1;
    // Not const: jumping to a mudra rewinds this rather than tracking a
    // separate offset, which keeps one clock driving the whole cycle.
    let start = performance.now();

    const writeHand = (landmarks: Landmarks) => {
      // Once the model is up, it owns the pose: it bends its own skeleton and
      // hands back where the joints actually ended up, so the glowing overlay
      // is read from the same skeleton the mesh is skinned to and the two
      // cannot drift apart. Before that, draw the baked landmarks as they are —
      // they were generated from this model, so nothing jumps when it lands.
      if (rigged) rigged.pose(landmarks, joints);
      else for (let i = 0; i < 21; i++) joints[i].copy(landmarks[i]);

      for (let i = 0; i < 21; i++) {
        const p = joints[i];
        const r = i === 0 ? 0.062 : TIPS.includes(i) ? 0.05 : 0.042;
        m.makeScale(r, r, r);
        m.setPosition(p);
        jointMesh.setMatrixAt(i, m);
        glows[i].position.copy(p);
      }
      jointMesh.instanceMatrix.needsUpdate = true;

      for (let b = 0; b < BONES.length; b++) {
        const a = joints[BONES[b][0]];
        const c = joints[BONES[b][1]];
        dir.subVectors(c, a);
        const len = dir.length() || 1e-5;
        mid.addVectors(a, c).multiplyScalar(0.5);
        q.setFromUnitVectors(up, dir.divideScalar(len));
        scl.set(0.021, len, 0.021);
        m.compose(mid, q, scl);
        boneMesh.setMatrixAt(b, m);
      }
      boneMesh.instanceMatrix.needsUpdate = true;

    };

    const frame = () => {
      const now = performance.now();
      const elapsed = now - start;
      const t = elapsed / 1000;

      // Which mudra, and how far into the morph toward the next one.
      let index = 0;
      let landmarks: Landmarks;
      const targetPose = staticPoseRef.current;
      if (targetPose !== undefined && targetPose >= 0 && targetPose < MUDRAS.length) {
        landmarks = MUDRAS[targetPose].landmarks;
        if (targetPose !== lastEmitted) {
          lastEmitted = targetPose;
          poseCbRef.current?.(targetPose);
        }
      } else if (reduceMotion) {
        landmarks = MUDRAS[0].landmarks;
      } else {
        const step = Math.floor(elapsed / CYCLE_MS);
        const within = elapsed - step * CYCLE_MS;
        index = step % MUDRAS.length;
        const next = (index + 1) % MUDRAS.length;
        const k = within <= HOLD_MS ? 0 : smootherstep((within - HOLD_MS) / MORPH_MS);
        if (k === 0) {
          landmarks = MUDRAS[index].landmarks;
        } else {
          // Blend the joint angles, then solve them, so every joint travels
          // its own arc instead of the fingertips sliding along straight lines.
          mixJoints(MUDRAS[index].joints, MUDRAS[next].joints, k, midway);
          jointsToLandmarks(midway, blend);
          landmarks = blend;
        }
        // Announce the next mudra at the morph midpoint, as it becomes legible.
        const shown = k > 0.5 ? next : index;
        if (shown !== lastEmitted) {
          lastEmitted = shown;
          poseCbRef.current?.(shown);
        }
      }

      writeHand(landmarks);

      if (!reduceMotion) {
        pointer.x += (pointer.tx - pointer.x) * 0.045;
        pointer.y += (pointer.ty - pointer.y) * 0.045;
        hand.rotation.y = Math.sin(t * 0.22) * 0.3 + pointer.x * 0.45;
        hand.rotation.x = -0.05 + pointer.y * 0.2;
        hand.position.y = HAND_Y + Math.sin(t * 0.6) * 0.022;
        mandala.rotation.z = -t * 0.035;
        mandala.material.opacity = (isLight ? 0.4 : 0.62) + Math.sin(t * 0.9) * 0.06;
        const pulse = 1 + Math.sin(t * 1.7) * 0.08;
        for (const g of glows) g.scale.setScalar(g.userData.base * pulse);
        aura.scale.setScalar(5 + Math.sin(t * 0.5) * 0.2);
      }

      renderer.render(scene, camera);
    };

    // ---- external control -----------------------------------------------
    /**
     * Forms one mudra on demand and lets the cycle carry on from it.
     *
     * Rather than freezing on the chosen pose, this winds the clock back to the
     * moment that mudra's hold began, so it settles there and then goes on to
     * the next as though it had arrived in the usual order. It also morphs in
     * from wherever the hand currently is, because only the clock moves — the
     * frame either side of a click is drawn by the same code as any other.
     */
    const goTo = (index: number) => {
      const i = ((index % MUDRAS.length) + MUDRAS.length) % MUDRAS.length;
      if (reduceMotion) {
        writeHand(MUDRAS[i].landmarks);
        renderer.render(scene, camera);
        if (i !== lastEmitted) {
          lastEmitted = i;
          poseCbRef.current?.(i);
        }
        return;
      }
      start = performance.now() - i * CYCLE_MS;
      // Always draw, rather than only when the loop is parked. `running` says
      // the loop is registered, not that frames are arriving: a backgrounded
      // tab suspends requestAnimationFrame while running stays true, and a
      // click then moved the clock but never painted. One extra frame while
      // the loop is live costs nothing; a click that does nothing is a bug.
      frame();
    };
    if (handleRef) handleRef.current = { goTo };

    // ---- lifecycle ------------------------------------------------------
    let running = false;
    const play = () => {
      if (running) return;
      running = true;
      renderer.setAnimationLoop(frame);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      renderer.setAnimationLoop(null);
    };

    if (reduceMotion) {
      writeHand(MUDRAS[0].landmarks);
      renderer.render(scene, camera);
      poseCbRef.current?.(0);
    } else {
      play();
    }

    // Only burn frames while the hero is actually on screen and the tab is active.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduceMotion) return;
        if (entry.isIntersecting && !document.hidden) play();
        else pause();
      },
      { threshold: 0.01 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) pause();
      else play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (reduceMotion) renderer.render(scene, camera);
    });
    ro.observe(host);

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      if (handleRef) handleRef.current = null;
      pause();
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      disposed = true;
      jointMesh.dispose();
      boneMesh.dispose();
      rigged?.dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // A ref object, so this stays a build-once effect in practice; listing it
    // is honest about the fact that a caller swapping refs would need the
    // handle re-published, and that only happens by rebuilding the scene.
  }, [handleRef]);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
