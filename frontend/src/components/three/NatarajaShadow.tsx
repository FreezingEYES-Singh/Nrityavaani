"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cloneFigure, loadNataraja } from "./natarajaModel";

/**
 * Nataraja as a shadow, for every page that is not the landing page.
 *
 * This is the landing hero's first state and nothing else: one flat unlit fill,
 * a shade off the page's own background. `MeshBasicMaterial` ignores every
 * light in the scene, so there is no shading anywhere on it to give away that
 * it is geometry — it reads as a shape cut out of the page rather than as an
 * object sitting behind the page.
 *
 * Deliberately not the landing page's `NatarajaStage`. These are working pages
 * — a camera, a dashboard, a checkout — and a figure that resolves into lit
 * bronze while you are trying to read your practice history is an animation
 * competing with a task. It holds one state, drifts imperceptibly, and stops.
 *
 * It shares the landing page's single model download, so arriving here from the
 * home page costs nothing.
 */

const FIGURE_HEIGHT = 3.9;

/** A shade off the background, per theme. See NatarajaStage for why not black. */
const SHADE = { dark: 0x0e0b07, light: 0xe9e3d9 };

export default function NatarajaShadow({ className = "" }: { className?: string }) {
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
      return; // no WebGL — every page over this is designed to read without it
    }
    // A silhouette has no detail to lose, so it does not earn a retina buffer.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const material = new THREE.MeshBasicMaterial({
      color: isDark ? SHADE.dark : SHADE.light,
      transparent: true,
      opacity: 0,
    });
    disposables.push(material);

    const figure = new THREE.Group();
    scene.add(figure);

    let ready = false;
    const timer = new THREE.Timer();

    loadNataraja()
      .then((source) => {
        if (disposed) return;
        const shape = cloneFigure(source, FIGURE_HEIGHT);
        shape.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = material;
            mesh.frustumCulled = false;
          }
        });
        figure.add(shape);
        disposables.push({
          dispose() {
            shape.traverse((o) => {
              const mesh = o as THREE.Mesh;
              if (mesh.isMesh) mesh.geometry.dispose();
            });
          },
        });
        ready = true;
        // Fade in rather than appear: the model lands whenever it lands, and a
        // shape that pops into a page the reader has already started on is more
        // noticeable than the shape itself.
        fadeStart = performance.now();
        if (reduceMotion) {
          material.opacity = 1;
          applyTheme();
          renderer.render(scene, camera);
        } else play();
      })
      .catch(() => {
        /* reported by the shared loader */
      });

    let fadeStart = 0;
    const FADE_MS = 900;

    const applyTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      material.color.set(isDark ? SHADE.dark : SHADE.light);
    };

    let raf = 0;
    let running = false;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      timer.update();
      const t = timer.getElapsed();
      material.opacity = Math.min(1, (performance.now() - fadeStart) / FADE_MS);
      applyTheme();
      // Slow enough to be felt rather than watched, and small enough that it
      // never pulls the eye off whatever the page is actually for.
      figure.rotation.y = Math.sin(t * 0.05) * 0.16;
      figure.position.y = Math.sin(t * 0.2) * 0.03;
      renderer.render(scene, camera);
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

    const themeObserver = new MutationObserver(() => {
      if (!ready) return;
      applyTheme();
      if (reduceMotion || !running) renderer.render(scene, camera);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (ready && (reduceMotion || !running)) renderer.render(scene, camera);
    });
    ro.observe(host);

    return () => {
      disposed = true;
      pause();
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={className} />;
}
