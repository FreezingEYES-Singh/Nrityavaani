import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * One download of the Nataraja, shared by everything that draws it.
 *
 * Two things need the model at once — the loading screen, which is waiting on
 * it, and the hero behind it — and they mount at different moments. Without a
 * cache the second mount starts a second 772 KB fetch, and the loading screen
 * ends up reporting the progress of a download the page is not actually
 * waiting for. So the fetch is started once, memoised as a promise, and the
 * byte progress is broadcast to whoever is listening.
 */

const MODEL = "/models/natraj.glb";

export type Progress = { loaded: number; total: number; ratio: number };

let pending: Promise<THREE.Group> | null = null;
let latest: Progress = { loaded: 0, total: 0, ratio: 0 };
const listeners = new Set<(p: Progress) => void>();

/** Subscribe to download progress. Returns an unsubscribe. */
export function onNatarajaProgress(fn: (p: Progress) => void) {
  listeners.add(fn);
  fn(latest);
  return () => listeners.delete(fn);
}

function publish(p: Progress) {
  latest = p;
  for (const fn of listeners) fn(p);
}

/**
 * Loads (or returns) the model.
 *
 * The resolved group is shared, so callers must not pose or reparent it —
 * `cloneFigure` hands out a copy with its own materials for that.
 */
export function loadNataraja(): Promise<THREE.Group> {
  if (pending) return pending;

  const loader = new GLTFLoader();
  // The shipped glb is meshopt-compressed; without this it will not parse.
  loader.setMeshoptDecoder(MeshoptDecoder);

  pending = new Promise((resolve, reject) => {
    loader.load(
      MODEL,
      (gltf) => {
        publish({ loaded: 1, total: 1, ratio: 1 });
        resolve(gltf.scene);
      },
      (evt) => {
        // `total` is 0 when the server sends no content-length. Reporting a
        // ratio of Infinity or NaN would drive a progress bar off the end, so
        // in that case say nothing and let the caller show an indeterminate
        // state rather than a wrong number.
        if (!evt.total) return;
        publish({ loaded: evt.loaded, total: evt.total, ratio: evt.loaded / evt.total });
      },
      (err) => {
        // Let the page carry on without it. Every surface that draws the
        // Nataraja is designed to be legible with nothing behind it.
        console.warn(`Nataraja: could not load ${MODEL}`, err);
        publish({ loaded: 1, total: 1, ratio: 1 });
        reject(err);
      },
    );
  });

  return pending;
}

/**
 * Normalises the figure into a copy: centred on the origin, `height` units
 * tall, with its own materials so two views of it can be lit differently.
 */
export function cloneFigure(source: THREE.Group, height: number) {
  const figure = source.clone(true);
  const box = new THREE.Box3().setFromObject(figure);
  const size = new THREE.Vector3();
  const centre = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(centre);
  const scale = height / (size.y || 1);
  figure.scale.setScalar(scale);
  figure.position.copy(centre).multiplyScalar(-scale);
  return figure;
}
