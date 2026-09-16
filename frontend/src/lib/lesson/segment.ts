/**
 * Cuts a baked take into steps, by finding where the dancer paused.
 *
 * This is the "AI watches the video and finds the steps" part, done without an
 * AI. The observation that makes it work is a property of *teaching* video, not
 * of dancing: a teacher demonstrates a step, then stops to talk, then does the
 * next one. The talk is the seam. While talking, the lower body is planted —
 * whatever the hands are doing — so measuring only the lower body separates
 * "dancing" (feet and knees move) from "explaining" (hands wave, legs stay
 * still) in a way that measuring the whole body cannot.
 *
 * This is deliberately dependency-free. It runs in the browser after a bake,
 * and it runs in `tools/lesson/segment.mjs` under Node, where it is tested.
 * No three, no mediapipe, no DOM — just geometry over a list of landmarks.
 */

/** A single tracked point, in whatever space the caller baked in. */
export interface TrackPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** One frame's worth of landmarks, or null when nothing was found that frame. */
export type Track = (TrackPoint[] | null)[];

/** MediaPipe pose landmark indices for the lower body. See `P` in `retarget.ts`. */
const LOWER_BODY = [23, 24, 25, 26, 27, 28, 31, 32]; // hips, knees, ankles, feet

export interface SegmentOptions {
  /** Frames per second the track was sampled at. */
  fps: number;
  /**
   * Lower-body displacement in metres per frame below which a frame counts as
   * still. World landmarks are in metres; a still dancer jitters a few
   * millimetres a frame, a real step moves tens of centimetres.
   */
  still?: number;
  /** How many seconds of stillness it takes to count as a deliberate pause. */
  minPause?: number;
  /** Steps shorter than this (seconds) are folded into their neighbour. */
  minStep?: number;
  /** Which landmark indices define "motion". Defaults to the lower body. */
  joints?: number[];
}

export interface Segment {
  /** 0-based order of the step in the take. */
  index: number;
  /** First frame of the step, inclusive. */
  startFrame: number;
  /** First frame after the step, exclusive. */
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  /** 0-1 fraction of the step's frames that actually had a pose. */
  coverage: number;
  /** The most the body moved in one frame, m/frame — how "fast" the step is. */
  peakSpeed: number;
}

/**
 * Splits a track into steps.
 *
 * Returns one segment when no pauses are found (a continuous demonstration),
 * and `[]` when there is no real motion at all.
 */
export function segmentTrack(track: Track, opts: SegmentOptions): Segment[] {
  const n = track.length;
  if (n < 2) return [];

  const fps = opts.fps > 0 ? opts.fps : 10;
  const still = opts.still ?? 0.008;
  const joints = opts.joints ?? LOWER_BODY;
  const minPauseFrames = Math.max(1, Math.round((opts.minPause ?? 0.35) * fps));
  const minStepFrames = Math.max(1, Math.round((opts.minStep ?? 0.6) * fps));

  // --- Per-frame lower-body energy -----------------------------------------
  // Mean displacement of the tracked joints from the previous frame. A missing
  // joint is skipped; a frame with nothing to measure is NaN and never called
  // still on its own — only a run of missing *frames* reads as a pause.
  const energy = new Array<number>(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    const a = track[i - 1];
    const b = track[i];
    if (!a || !b) continue;
    let sum = 0;
    let cnt = 0;
    for (const j of joints) {
      const p = a[j];
      const q = b[j];
      if (!p || !q) continue;
      sum += Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      cnt++;
    }
    if (cnt) energy[i] = sum / cnt;
  }

  // --- Still and missing runs, which are the pauses ------------------------
  // A frame with no measurable energy — the first frame, or one right after a
  // gap — inherits its neighbour's answer. Without this, frame 0 is always
  // "moving", a still opening would start its run at frame 1, and the leading
  // pause would be mistaken for a seam between two steps.
  const isStillAt = (i: number): boolean => {
    if (track[i] === null) return true;
    if (Number.isFinite(energy[i])) return energy[i] < still;
    const next = energy[i + 1];
    if (Number.isFinite(next)) return next < still;
    const prev = energy[i - 1];
    if (Number.isFinite(prev)) return prev < still;
    return false;
  };

  const pauses: [number, number][] = [];
  let s = -1;
  for (let i = 0; i < n; i++) {
    if (isStillAt(i)) {
      if (s < 0) s = i;
    } else if (s >= 0) {
      pauses.push([s, i - 1]);
      s = -1;
    }
  }
  if (s >= 0) pauses.push([s, n - 1]);

  // A pause at the very start is "hasn't begun" and at the very end is
  // "finished"; neither is a seam between steps. The rest only count once
  // they last long enough to be deliberate.
  const cuts: number[] = [];
  for (const [a, b] of pauses) {
    if (a === 0 || b === n - 1) continue;
    if (b - a + 1 < minPauseFrames) continue;
    cuts.push(Math.round((a + b) / 2));
  }
  cuts.sort((x, y) => x - y);

  // Leading/trailing stillness is trimmed so a step begins when the dancer
  // begins and ends when she stops, rather than padding the take's edges.
  let head = 0;
  let tail = n;
  if (pauses.length) {
    const first = pauses[0];
    if (first[0] === 0 && first[1] - first[0] + 1 >= minPauseFrames) head = first[1] + 1;
    const last = pauses[pauses.length - 1];
    if (last[1] === n - 1 && last[1] - last[0] + 1 >= minPauseFrames) tail = last[0];
  }
  if (head >= tail) return [];

  // A cut is kept only if it leaves a real step on both sides; a rejected cut
  // folds two short bursts into one step rather than orphaning frames.
  const starts: number[] = [head];
  for (const c of cuts) {
    const prev = starts[starts.length - 1];
    if (c - prev >= minStepFrames && c >= head) starts.push(c);
  }

  const out: Segment[] = [];
  for (let k = 0; k < starts.length; k++) {
    const start = starts[k];
    const end = k + 1 < starts.length ? starts[k + 1] : tail;
    if (end <= start) continue;
    out.push(measure(track, energy, start, end, k, fps));
  }
  return out;
}

function measure(
  track: Track,
  energy: number[],
  start: number,
  end: number,
  index: number,
  fps: number,
): Segment {
  let present = 0;
  let peak = 0;
  for (let i = start; i < end; i++) {
    if (track[i]) present++;
    if (Number.isFinite(energy[i])) peak = Math.max(peak, energy[i]);
  }
  return {
    index,
    startFrame: start,
    endFrame: end,
    startTime: start / fps,
    endTime: end / fps,
    duration: (end - start) / fps,
    coverage: end > start ? present / (end - start) : 0,
    peakSpeed: peak,
  };
}

/** Rough but readable name for a step before anything has transcribed it. */
export function stepName(index: number) {
  return `Step ${index + 1}`;
}
