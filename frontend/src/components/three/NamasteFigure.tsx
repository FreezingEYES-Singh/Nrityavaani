"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { applyNamaste, disposeFigure, loadFigures, makeFigure, type Sex } from "./figureRig";
import { boneKey, debugBody, type Clamped, type Pose, type Violation } from "./figureConstraints";

/** Units tall. Every girth in the collision model is a fraction of this. */
const FIGURE_HEIGHT = 1.75;

/** Camera distance limits: close enough to read a fingertip, far enough for the whole figure. */
export const MIN_DIST = 0.6;
export const MAX_DIST = 7;

export type PoseReport = {
  clamped: Clamped[];
  /** What the raw pose hit, before the collision pass eased it back. */
  initial: Violation[];
  violations: Violation[];
  amount: { L: number; R: number };
};

/**
 * One figure, standing in namaste, turning slowly.
 *
 * The scene is built once and kept; changing `sex` swaps only the figure inside
 * it. Tearing down WebGL to change which body is on screen would drop the
 * context and re-upload every buffer for what is, to the viewer, a toggle.
 */
export default function NamasteFigure({
  sex,
  showBody = false,
  showJoints = false,
  overrides,
  selected = null,
  onSelect,
  zoom,
  onZoom,
  onReport,
  onView,
  className = "",
}: {
  sex: Sex;
  /** Draw the collision volume, to look at the rule rather than trust it. */
  showBody?: boolean;
  /** Draw a pickable marker on every joint. */
  showJoints?: boolean;
  /** Per-bone angle overrides layered on top of the stored pose. */
  overrides?: Pose;
  selected?: string | null;
  onSelect?: (bone: string | null) => void;
  /** Camera distance. Smaller is closer; the slider drives this. */
  zoom?: number;
  onZoom?: (distance: number) => void;
  onReport?: (report: PoseReport) => void;
  /** Receives a function for driving the camera to a known angle. */
  onView?: (set: (yaw: number, pitch: number, dist?: number) => void) => void;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Set by the build effect, read by the swap effects below.
  const swapRef = useRef<((sex: Sex) => void) | null>(null);
  const bodyRef = useRef<((show: boolean) => void) | null>(null);
  const viewRef = useRef<((yaw: number, pitch: number, dist?: number) => void) | null>(null);
  const jointsRef = useRef<((show: boolean) => void) | null>(null);
  const poseRef = useRef<((o: Pose | undefined) => void) | null>(null);
  const selectRef = useRef<((bone: string | null) => void) | null>(null);
  const zoomRef = useRef<((d: number) => void) | null>(null);

  const zoomCb = useRef(onZoom);
  useEffect(() => {
    zoomCb.current = onZoom;
  });

  // Kept current without rebuilding the scene.
  const pickRef = useRef(onSelect);
  useEffect(() => {
    pickRef.current = onSelect;
  });

  // Kept current without rebuilding the scene, the same way MudraHand3D does.
  const reportRef = useRef(onReport);
  useEffect(() => {
    reportRef.current = onReport;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disposables: { dispose(): void }[] = [];

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL — the caller's fallback copy stays visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, 0.1, 100);
    // A 1.75-unit figure on a 34° vertical fov shows 2*z*tan(17°) of height, so
    // 4.2 back puts it at about two thirds of frame. Aimed at the sternum,
    // which is where the hands are and what the pose is about.
    camera.position.set(0, 1.12, 4.2);
    camera.lookAt(0, 1.0, 0);

    // 4-Point Classical Temple Lighting:
    // Warm key, divine gold rim, saffron fill, and floor bounce
    const ambient = new THREE.AmbientLight(0xfff5ea, 0.45);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff4e6, 1.8);
    key.position.set(2.4, 3.4, 3.2);
    const fill = new THREE.DirectionalLight(0xff9933, 0.7);
    fill.position.set(-3, 1.2, 1.8);
    const rim = new THREE.DirectionalLight(0xffa726, 1.4);
    rim.position.set(-1.2, 2.2, -3);
    const bounce = new THREE.DirectionalLight(0xffd2a0, 0.35);
    bounce.position.set(0, -0.8, 1.5);
    scene.add(key, fill, rim, bounce);

    // The figure hangs off a turntable so the slow rotation never touches the
    // pose, and so a swap is a single removeFromParent.
    const turntable = new THREE.Group();
    scene.add(turntable);

    /*
     * Camera controls.
     *
     * Left drag pans, right drag orbits. That split matters once you are zoomed
     * in on a hand: with orbit on the left button there is no way to move
     * *across* the model, so the fingers you want simply sit off screen. Pan is
     * the verb you need most while editing, so it gets the primary button, and
     * a left click that does not travel still picks a joint.
     */
    const target = new THREE.Vector3(0, 1.0, 0);
    const view = { yaw: 0, pitch: 0.06, dist: zoom ?? 4.2, auto: true };
    let mode: "none" | "pan" | "orbit" = "none";
    let px = 0, py = 0, travelled = 0;

    const right = new THREE.Vector3();
    const upAxis = new THREE.Vector3();

    const place = () => {
      const r = view.dist * Math.cos(view.pitch);
      camera.position.set(
        target.x + Math.sin(view.yaw) * r,
        target.y + view.dist * Math.sin(view.pitch),
        target.z + Math.cos(view.yaw) * r,
      );
      camera.lookAt(target);
    };
    place();

    const onDown = (e: PointerEvent) => {
      view.auto = false; // a hand on the model stops the idle turn
      mode = e.button === 2 ? "orbit" : "pan";
      px = e.clientX;
      py = e.clientY;
      travelled = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = mode === "orbit" ? "grabbing" : "move";
    };

    const onMove = (e: PointerEvent) => {
      if (mode === "none") return;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      travelled += Math.abs(dx) + Math.abs(dy);
      px = e.clientX;
      py = e.clientY;

      if (mode === "orbit") {
        view.yaw -= dx * 0.008;
        view.pitch = THREE.MathUtils.clamp(view.pitch + dy * 0.006, -0.5, 0.8);
      } else {
        // Scaled by distance, so a drag covers the same fraction of the frame
        // however far out the camera is.
        const k = view.dist * 0.0016;
        camera.matrixWorld.extractBasis(right, upAxis, new THREE.Vector3());
        target.addScaledVector(right, -dx * k);
        target.addScaledVector(upAxis, dy * k);
      }
      place();
      if (reduceMotion) renderer.render(scene, camera);
    };

    const onUp = (e: PointerEvent) => {
      // A click that did not travel is a selection, not a drag. `pick` is
      // declared further down with the joint markers it needs; this only ever
      // runs from a pointer event, long after the effect body has finished.
      if (mode === "pan" && travelled < 5) pick(e);
      mode = "none";
      renderer.domElement.style.cursor = "grab";
      renderer.domElement.releasePointerCapture?.(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Multiplicative, so a notch moves the same *proportion* wherever you
      // are. The old additive step crawled when zoomed in, which is exactly
      // where the fine work happens.
      view.dist = THREE.MathUtils.clamp(view.dist * Math.exp(e.deltaY * 0.0016), MIN_DIST, MAX_DIST);
      place();
      positionJoints();
      zoomCb.current?.(view.dist);
      if (reduceMotion) renderer.render(scene, camera);
    };

    // Right-drag is a camera control here, so the browser menu would eat it.
    const onMenu = (e: Event) => e.preventDefault();

    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("contextmenu", onMenu);

    let current: THREE.Object3D | null = null;
    let currentMesh: THREE.SkinnedMesh | null = null;
    let currentClothes: THREE.SkinnedMesh[] = [];
    let bodyView: THREE.Group | null = null;
    let source: THREE.Group | null = null;
    let disposed = false;
    let wanted: Sex = sex;
    let bodyShown = showBody;
    let bodyKind: Sex = sex;
    let jointsShown = showJoints;
    let liveOverrides: Pose | undefined = overrides;
    let picked: string | null = selected;

    const clearBody = () => {
      if (!bodyView) return;
      bodyView.removeFromParent();
      (bodyView.userData.dispose as () => void)?.();
      bodyView = null;
    };

    const drawBody = () => {
      clearBody();
      if (!bodyShown || !currentMesh) return;
      // Bone world positions are only as current as their parent chain, and
      // `makeFigure` re-centres the figure *after* the bones were last updated.
      // Reading them without this gives the position the figure had before it
      // was centred — which is why the wireframe drew off to one side.
      scene.updateMatrixWorld(true);
      bodyView = debugBody(currentMesh, FIGURE_HEIGHT, bodyKind, turntable);
      turntable.add(bodyView);
    };

    const build = (which: Sex) => {
      if (!source || disposed) return;
      if (current) {
        clearBody();
        current.removeFromParent();
        disposeFigure(current);
      }
      const { group, mesh, clothes } = makeFigure(source, which, FIGURE_HEIGHT);
      const { clamped, initial, violations, amount } = applyNamaste(
        mesh, FIGURE_HEIGHT, which, liveOverrides,
      );
      turntable.add(group);
      current = group;
      currentMesh = mesh;
      currentClothes = clothes;
      bodyKind = which;
      // A new figure arrives with a fresh material, so the ghost has to be
      // re-derived rather than carried over from the one just disposed.
      solidMat = Array.isArray(mesh.material) ? null : mesh.material;
      ghostMat = null;
      applyTheme();
      setXray(picked !== null);
      drawBody();
      drawJoints();
      reportRef.current?.({ clamped, initial, violations, amount });
      if (reduceMotion) renderer.render(scene, camera);
    };

    /*
     * A pickable dot on every joint.
     *
     * Instanced, because 51 separate meshes would be 51 draw calls for what is
     * one repeated sphere; raycasting an InstancedMesh reports `instanceId`,
     * which indexes straight back into the bone list.
     */
    const jointGeo = new THREE.SphereGeometry(1, 10, 8);
    // depthTest off so every joint is visible once the body is ghosted —
    // including the spine and hips, which are otherwise buried in the mesh.
    const jointMat = new THREE.MeshBasicMaterial({
      toneMapped: false, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false,
    });
    const boneMat = new THREE.LineBasicMaterial({
      color: 0xff9933, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false,
    });
    let jointMesh: THREE.InstancedMesh | null = null;
    let jointBones: THREE.Bone[] = [];
    let boneLines: THREE.LineSegments | null = null;
    let solidMat: THREE.Material | null = null;
    let ghostMat: THREE.Material | null = null;
    disposables.push(jointGeo, jointMat, boneMat);

    /*
     * Theme.
     *
     * The figure is opaque — skin and cloth both — so the page no longer shows
     * through it and there is no alpha left to trade against the background.
     * What is left is the lamps: near-white light piled onto a warm body over a
     * pale page pushes the skin toward peach and flattens it against the paper,
     * so both come down for the light theme and the figure holds its own
     * colour and its edge in either.
     *
     * Read off <html> rather than a React ref: next-themes writes the class and
     * the observer fires with no guarantee React has re-rendered by then.
     */
    const applyTheme = () => {
      const isLight = document.documentElement.classList.contains("light");
      ambient.intensity = isLight ? 0.2 : 0.42;
      key.intensity = isLight ? 1.05 : 1.5;
      boneMat.color.set(isLight ? 0xc2410c : 0xff9933);
    };
    const themeWatch = new MutationObserver(() => {
      applyTheme();
      if (reduceMotion) renderer.render(scene, camera);
    });
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /**
     * X-ray: the body drops to a ghost so the skeleton inside it can be read.
     *
     * Turned on by selecting a joint, because that is exactly the moment you
     * want to see what you are about to move and what it is attached to.
     */
    const setXray = (on: boolean) => {
      if (!currentMesh) return;
      // The clothes are opaque, so they would hide exactly the joints the
      // ghost is there to show. They step aside with it.
      for (const c of currentClothes) c.visible = !on;
      if (!solidMat) return; // this model ships a single material
      if (on) {
        if (!ghostMat) {
          ghostMat = (solidMat as THREE.Material).clone();
          const g = ghostMat as THREE.MeshStandardMaterial;
          g.transparent = true;
          g.opacity = 0.07;
          g.depthWrite = false;
          disposables.push(ghostMat);
        }
        currentMesh.material = ghostMat;
      } else if (solidMat) {
        currentMesh.material = solidMat;
      }
    };

    /**
     * How big a joint dot is drawn, in world units.
     *
     * Derived from the camera distance rather than fixed, so the dots hold a
     * constant size *on screen*. A fixed world radius is right at exactly one
     * zoom level and wrong everywhere else — zoomed in far enough to place a
     * fingertip, fixed-size dots swell up and cover the very thing you are
     * trying to see.
     *
     * At distance d the camera shows 2·d·tan(fov/2) of world height, so a dot
     * of radius r covers 2r/that of the frame; solving for a target pixel
     * diameter gives the expression below.
     */
    const DOT_PX = 9;
    const dotRadius = () => {
      const h = renderer.domElement.clientHeight || 1;
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      return (view.dist * Math.tan(halfFov) * DOT_PX) / h;
    };

    const PLAIN = new THREE.Color("#ff9933");
    const HOT = new THREE.Color("#ffffff");
    const scratch = new THREE.Matrix4();
    const at = new THREE.Vector3();

    const clearJoints = () => {
      if (boneLines) {
        boneLines.removeFromParent();
        boneLines.geometry.dispose();
        boneLines = null;
      }
      if (!jointMesh) return;
      jointMesh.removeFromParent();
      jointMesh.dispose();
      jointMesh = null;
      jointBones = [];
    };

    const drawJoints = () => {
      clearJoints();
      // A selection forces the markers on: ghosting the body to reveal a
      // skeleton and then not drawing the skeleton would be worse than useless.
      if ((!jointsShown && !picked) || !currentMesh) return;
      scene.updateMatrixWorld(true);
      // Only bones that deform the mesh: the export's IK targets carry no skin
      // weight, so selecting one would move nothing and just confuse.
      jointBones = currentMesh.skeleton.bones.filter((b) => !/IK/i.test(b.name));
      jointMesh = new THREE.InstancedMesh(jointGeo, jointMat, jointBones.length);
      jointMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      jointMesh.renderOrder = 3;
      jointMesh.frustumCulled = false;
      turntable.add(jointMesh);

      // One segment per bone-to-parent link: the structure, not just the dots.
      boneLines = new THREE.LineSegments(new THREE.BufferGeometry(), boneMat);
      boneLines.renderOrder = 2;
      boneLines.frustumCulled = false;
      turntable.add(boneLines);

      positionJoints();
    };

    const positionJoints = () => {
      if (!jointMesh) return;
      scene.updateMatrixWorld(true);
      turntable.updateWorldMatrix(true, false);
      const inv = new THREE.Matrix4().copy(turntable.matrixWorld).invert();
      jointBones.forEach((b, i) => {
        at.setFromMatrixPosition(b.matrixWorld).applyMatrix4(inv);
        const hot = boneKey(b.name) === picked;
        const r = dotRadius() * (hot ? 1.9 : 1);
        scratch.makeScale(r, r, r);
        scratch.setPosition(at);
        jointMesh!.setMatrixAt(i, scratch);
        jointMesh!.setColorAt(i, hot ? HOT : PLAIN);
      });
      jointMesh.instanceMatrix.needsUpdate = true;
      if (jointMesh.instanceColor) jointMesh.instanceColor.needsUpdate = true;

      if (boneLines) {
        const known = new Set(jointBones);
        const pts: number[] = [];
        const a = new THREE.Vector3();
        for (const b of jointBones) {
          const parent = b.parent as THREE.Bone | null;
          if (!parent || !known.has(parent)) continue;
          a.setFromMatrixPosition(parent.matrixWorld).applyMatrix4(inv);
          at.setFromMatrixPosition(b.matrixWorld).applyMatrix4(inv);
          pts.push(a.x, a.y, a.z, at.x, at.y, at.z);
        }
        boneLines.geometry.dispose();
        boneLines.geometry = new THREE.BufferGeometry().setAttribute(
          "position", new THREE.Float32BufferAttribute(pts, 3),
        );
      }
    };

    /**
     * Picks the joint nearest the pointer, in screen space.
     *
     * Not a raycast: the dots are 0.012 across, so ray-testing their geometry
     * makes them a pixel-perfect target, and the joints worth clicking are the
     * finger ones — the smallest and most crowded of the lot. Projecting each
     * bone to the screen and taking the closest within a radius gives the same
     * answer with a hit area you can actually land on, and it stays constant
     * whatever the zoom.
     */
    const PICK_RADIUS = 22; // css pixels
    const proj = new THREE.Vector3();

    const pick = (e: PointerEvent) => {
      if (!jointMesh || !jointBones.length) return false;
      const r = renderer.domElement.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;

      let bestBone: THREE.Bone | null = null;
      let bestDist = PICK_RADIUS;
      for (const b of jointBones) {
        proj.setFromMatrixPosition(b.matrixWorld).project(camera);
        if (proj.z > 1) continue; // behind the camera
        const sx = ((proj.x + 1) / 2) * r.width;
        const sy = ((1 - proj.y) / 2) * r.height;
        const d = Math.hypot(sx - mx, sy - my);
        if (d < bestDist) {
          bestDist = d;
          bestBone = b;
        }
      }
      if (!bestBone) return false;

      picked = boneKey(bestBone.name);
      setXray(true);
      drawJoints();
      pickRef.current?.(picked);
      renderer.render(scene, camera);
      return true;
    };

    swapRef.current = (next) => {
      wanted = next;
      build(next);
    };
    bodyRef.current = (show) => {
      bodyShown = show;
      drawBody();
      if (reduceMotion) renderer.render(scene, camera);
    };
    jointsRef.current = (show) => {
      jointsShown = show;
      drawJoints();
      renderer.render(scene, camera);
    };
    selectRef.current = (bone) => {
      picked = bone;
      setXray(bone !== null);
      drawJoints();
      renderer.render(scene, camera);
    };
    poseRef.current = (o) => {
      liveOverrides = o;
      if (!currentMesh) return;
      const r = applyNamaste(currentMesh, FIGURE_HEIGHT, bodyKind, o);
      drawBody();
      positionJoints();
      reportRef.current?.({ clamped: r.clamped, initial: r.initial, violations: r.violations, amount: r.amount });
      renderer.render(scene, camera);
    };

    loadFigures().then(
      (loaded) => {
        if (disposed) return;
        source = loaded;
        build(wanted);
      },
      (err) => {
        // The page is designed to read with nothing here.
        console.warn("figures: could not load", err);
      },
    );

    // ---- loop, paused when off screen or in a hidden tab ------------------
    let raf = 0;
    let running = false;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      // A slow turn until someone takes hold of it, then it stays where put.
      if (view.auto) {
        view.yaw = Math.sin(clock.getElapsedTime() * 0.22) * 0.5;
        place();
      }
      // The idle turn is on the turntable's parent, not the joints, so the dots
      // stay put; only a pose change moves them.
      renderer.render(scene, camera);
    };
    const play = () => {
      if (running || reduceMotion) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : pause()),
      { threshold: 0.01 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) pause();
      else play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    zoomRef.current = (d) => {
      view.dist = THREE.MathUtils.clamp(d, MIN_DIST, MAX_DIST);
      place();
      positionJoints();
      renderer.render(scene, camera);
    };

    // Lets a caller (and a screenshot) drive the view to a known angle.
    viewRef.current = (yaw, pitch, dist) => {
      view.auto = false;
      view.yaw = yaw;
      view.pitch = pitch;
      if (dist) view.dist = dist;
      place();
      renderer.render(scene, camera);
    };

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      positionJoints();
      if (reduceMotion) renderer.render(scene, camera);
    });
    ro.observe(host);

    return () => {
      disposed = true;
      swapRef.current = null;
      bodyRef.current = null;
      viewRef.current = null;
      zoomRef.current = null;
      jointsRef.current = null;
      poseRef.current = null;
      selectRef.current = null;
      clearJoints();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("contextmenu", onMenu);
      clearBody();
      themeWatch.disconnect();
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (current) disposeFigure(current);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Built once. `sex` and `showBody` are deliberately not dependencies — the
    // effects below drive them through handles instead of rebuilding WebGL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    swapRef.current?.(sex);
  }, [sex]);

  useEffect(() => {
    bodyRef.current?.(showBody);
  }, [showBody]);

  useEffect(() => {
    jointsRef.current?.(showJoints);
  }, [showJoints]);

  useEffect(() => {
    if (zoom !== undefined) zoomRef.current?.(zoom);
  }, [zoom]);

  useEffect(() => {
    selectRef.current?.(selected);
  }, [selected]);

  useEffect(() => {
    poseRef.current?.(overrides);
  }, [overrides]);

  useEffect(() => {
    if (!onView) return;
    onView((yaw, pitch, dist) => viewRef.current?.(yaw, pitch, dist));
  }, [onView]);

  return <div ref={hostRef} className={className} />;
}
