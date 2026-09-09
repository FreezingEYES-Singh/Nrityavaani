"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cloneFigure, loadNataraja } from "./natarajaModel";

/**
 * Nataraja, in three states, resolved by scrolling.
 *
 *   1. **Silhouette.** Behind the hero: one flat unlit fill, a shade off the
 *      page's own background. No lighting, no edges, so it reads as a shape cut
 *      out of the page rather than as an object in a room — present enough to
 *      give the hero depth, faint enough that the copy over it wins.
 *   2. **Outline.** The same geometry as hairline edges, a drawing of the thing
 *      the silhouette was.
 *   3. **Built.** Lit bronze, backlit, fully dimensional.
 *
 * The three do not crossfade. They are **clipped against the page's own section
 * edges**: everything above the edge is drawn in one state, everything below it
 * in the next, on a hard line. Because the figure is fixed and the edge scrolls,
 * that line sweeps up through the figure and converts it a slice at a time.
 *
 * That is the whole trick, and it is worth being explicit about why it beats a
 * crossfade. A crossfade dissolves the whole figure at once, so for most of the
 * transition you are looking at two ghosts of the same shape — which is exactly
 * what it looked like, and it looked like a bug. A wipe never shows a partial
 * anything: every pixel is one state or the other, fully drawn, and the reader
 * reads the moving line rather than a smear.
 *
 * The stage is `fixed`, so it never enters the page's layout. It reads the
 * top edges of `#lineage` and `#what` to place its two boundaries, so the
 * figure changes on lines that are really there: the sketch belongs to the
 * lineage section, the built figure to the one explaining the engine.
 */

/** How tall the figure stands in world units. */
const FIGURE_HEIGHT = 3.6;

/**
 * Crease angle above which an edge is drawn, in degrees.
 *
 * 40 keeps the contour and the real creases — the ring, the limbs, the drum,
 * the ornament — and drops the tessellation, which at 41k triangles would read
 * as hatching. It is worth knowing that a wireframe ball here is not a symptom
 * of this number being too low: it means the edges have been placed outside
 * their mesh's own space, and no threshold will fix that.
 */
const EDGE_THRESHOLD = 40;

/** Ken Perlin's smootherstep — zero first and second derivative at both ends. */
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The silhouette's fill, per theme.
 *
 * The brief is "barely distinguishable from the page", and the honest way to
 * hit that is to sit a hair off the background rather than to fade black down
 * with opacity — a black fill at low alpha over a near-black page turns muddy
 * grey at the edges where it overlaps the hero's own glow.
 */
const SILHOUETTE = { dark: 0x100c08, light: 0xe4ddd2 };

export default function NatarajaStage({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disposables: { dispose(): void }[] = [];
    let disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL — every section over this is legible without it
    }
    // Each state is clipped to its own band of the figure.
    renderer.localClippingEnabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const stage = new THREE.Group();
    scene.add(stage);

    /*
     * Two boundaries, four half-spaces. A THREE.Plane keeps the side where
     * `normal · p + constant > 0`, so a normal of +Y with constant -k keeps
     * y > k, and -Y with constant k keeps y < k. Band membership is then just
     * an intersection of half-spaces, which is what a material's clippingPlanes
     * array already means.
     */
    const aboveA = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const belowA = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const aboveB = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const belowB = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const setBoundary = (above: THREE.Plane, below: THREE.Plane, y: number) => {
      above.constant = -y;
      below.constant = y;
    };

    // ---- 1. the silhouette ------------------------------------------------
    // Unlit on purpose: MeshBasicMaterial ignores every light in the scene, so
    // the figure fills as one flat tone with no shading to give away that it is
    // a mesh. That is what makes it read as 2D.
    const silhouetteMaterial = new THREE.MeshBasicMaterial({
      color: SILHOUETTE.dark,
      transparent: true,
      opacity: 1,
      clippingPlanes: [aboveA],
    });
    disposables.push(silhouetteMaterial);
    const silhouette = new THREE.Group();
    stage.add(silhouette);

    // ---- 2. the outline ---------------------------------------------------
    const edgeMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      clippingPlanes: [belowA, aboveB],
    });
    disposables.push(edgeMaterial);
    const outline = new THREE.Group();
    stage.add(outline);

    // ---- 3. the built figure ----------------------------------------------
    const solidMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1608,
      roughness: 0.52,
      metalness: 0.85,
      emissive: 0x120600,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 1,
      clippingPlanes: [belowB],
    });
    disposables.push(solidMaterial);
    const solid = new THREE.Group();
    stage.add(solid);

    // Backlight only, so the built figure reads as a form cut out of a glow.
    const ambient = new THREE.AmbientLight(0xffb066, 0);
    const backLeft = new THREE.PointLight(0xff9933, 0, 22, 2);
    backLeft.position.set(-2.4, 1.6, -3.2);
    const backRight = new THREE.PointLight(0xffd28a, 0, 20, 2);
    backRight.position.set(2.6, 0.6, -2.8);
    const under = new THREE.PointLight(0x8b5cf6, 0, 18, 2);
    under.position.set(0, -2.6, -2.2);
    scene.add(ambient, backLeft, backRight, under);

    const glowTex = radialTexture();
    disposables.push(glowTex);
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    disposables.push(glowMaterial);
    const glow = new THREE.Sprite(glowMaterial);
    glow.position.set(0, 0.35, -2.4);
    glow.scale.setScalar(7.5);
    scene.add(glow);

    let ready = false;

    loadNataraja()
      .then((source) => {
        if (disposed) return;

        // Three views of the same geometry, each its own clone of the
        // hierarchy. The model is nine meshes deep in a Sketchfab scene graph
        // with transforms on the intermediate nodes, which matters: an
        // EdgesGeometry is built in its mesh's *local* space, so a line put
        // anywhere other than that mesh's own place in the tree lands in the
        // wrong space. Nine of them stacked at the origin is a ball of wire.
        // Rebuilding the tree and swapping each mesh for its own outline, in
        // the same parent and with the same local transform, leaves no
        // arithmetic to get wrong.
        const built = cloneFigure(source, FIGURE_HEIGHT);
        const flat = cloneFigure(source, FIGURE_HEIGHT);
        const wire = cloneFigure(source, FIGURE_HEIGHT);

        built.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = solidMaterial;
            mesh.frustumCulled = false;
          }
        });
        flat.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = silhouetteMaterial;
            mesh.frustumCulled = false;
          }
        });

        // Collected first: swapping meshes out while traversing mutates the
        // tree underneath the traversal.
        const wireMeshes: THREE.Mesh[] = [];
        wire.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) wireMeshes.push(mesh);
        });
        for (const mesh of wireMeshes) {
          const edges = new THREE.EdgesGeometry(mesh.geometry, EDGE_THRESHOLD);
          disposables.push(edges);
          const line = new THREE.LineSegments(edges, edgeMaterial);
          line.position.copy(mesh.position);
          line.quaternion.copy(mesh.quaternion);
          line.scale.copy(mesh.scale);
          line.frustumCulled = false;
          mesh.parent?.add(line);
          mesh.removeFromParent();
        }

        solid.add(built);
        silhouette.add(flat);
        outline.add(wire);

        disposables.push({
          dispose() {
            for (const root of [built, flat, wire]) {
              root.traverse((o) => {
                const mesh = o as THREE.Mesh;
                if (mesh.isMesh) mesh.geometry.dispose();
              });
            }
          },
        });

        ready = true;
        if (reduceMotion) draw();
        else play();
      })
      .catch(() => {
        /* already reported by the shared loader */
      });

    /**
     * Where a boundary element currently sits, in the scene's world Y.
     *
     * The figure is at z 0 and the camera at z 6, so the visible height at the
     * figure's depth is fixed and a viewport pixel maps linearly onto world Y.
     * Returning +/-Infinity for a missing element makes the caller degrade to
     * "entirely one state" rather than to a figure sliced at the origin.
     */
    function worldYOf(id: string, fallback: number) {
      const el = document.getElementById(id);
      if (!el) return fallback;
      const top = el.getBoundingClientRect().top;
      const visible = 2 * Math.tan(((camera.fov * Math.PI) / 180) / 2) * camera.position.z;
      // The canvas, not the host: it is the surface being projected onto, and
      // it is non-null here in a way the host's narrowing does not survive into
      // a hoisted function body.
      return (0.5 - top / renderer.domElement.clientHeight) * visible;
    }

    /**
     * Fades the stage out once the sequence is behind us — at the end of the
     * section the built figure belongs to, not the one before it, or the figure
     * would vanish on the way into its own reveal.
     */
    function stagePresence() {
      const what = document.getElementById("what");
      if (!what) return 1;
      const out = what.offsetTop + what.offsetHeight - window.innerHeight * 0.6;
      return 1 - clamp01((window.scrollY - out) / (window.innerHeight * 0.5));
    }

    const isLight = () => document.documentElement.classList.contains("light");

    function draw() {
      const presence = stagePresence();

      // The two lines the figure changes on, taken from the elements that draw
      // them. Above A is silhouette, between A and B is outline, below B is
      // built — so both lines sweep upward through the figure as the page
      // scrolls, and the reader watches it resolve from the feet up.
      const a = worldYOf("lineage", Infinity);
      const b = worldYOf("what", Infinity);
      setBoundary(aboveA, belowA, a);
      setBoundary(aboveB, belowB, b);

      silhouetteMaterial.color.set(isLight() ? SILHOUETTE.light : SILHOUETTE.dark);
      silhouetteMaterial.opacity = presence;
      edgeMaterial.color.set(isLight() ? 0x4a3a26 : 0xffc98a);
      edgeMaterial.opacity = 0.5 * presence;
      solidMaterial.opacity = presence;

      // How much of the figure has crossed into the built band. The lights and
      // the glow follow it, so the backlight arrives with the bronze rather
      // than washing the outline that is still above the line.
      const half = FIGURE_HEIGHT / 2;
      const litFraction = clamp01((b + half) / FIGURE_HEIGHT) * presence;
      ambient.intensity = 0.16 * litFraction;
      backLeft.intensity = 30 * litFraction;
      backRight.intensity = 24 * litFraction;
      under.intensity = 14 * litFraction;
      glowMaterial.opacity = 0.78 * smootherstep(litFraction);

      renderer.render(scene, camera);
    }

    let raf = 0;
    let running = false;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      draw();
    };
    const play = () => {
      if (running || reduceMotion || !ready) return;
      running = true;
      frame();
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => {
      if (document.hidden) pause();
      else if (!reduceMotion) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Reduced motion gets a still frame per scroll rather than a running loop.
    const onScroll = () => {
      if (reduceMotion && ready) draw();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (ready && (reduceMotion || !running)) draw();
    });
    ro.observe(host);

    return () => {
      disposed = true;
      pause();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={className} />;
}

/** Soft radial disc, used as the light the built figure is cut out of. */
function radialTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,214,140,0.95)");
  g.addColorStop(0.22, "rgba(255,153,51,0.55)");
  g.addColorStop(0.55, "rgba(190,80,20,0.18)");
  g.addColorStop(1, "rgba(120,40,10,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
