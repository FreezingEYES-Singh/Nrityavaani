import type { Point } from "./classification";

/**
 * The shapes that travel between the camera, the classifier and the panels.
 *
 * These existed only as `any` before, in eight different signatures, which is
 * why a landmark array and a detection array could be passed to each other
 * without complaint. Naming them once is what makes the wiring checkable.
 */

/** One hand's reading: what it was judged to be, and how firmly. */
export interface MudraReading {
  name: string;
  /** 0–1. The panels render this as a percentage; the classifier emits the ratio. */
  confidence: number;
  feedback: string;
}

/** A reading with the hand it came from, once handedness is known. */
export interface HandReading extends MudraReading {
  handedness: string;
  /**
   * Set in practice mode, where each hand yields two readings: how well it
   * matches the mudra being practised, and separately what it most looks like.
   * The panels lead with the target so the score you are working on stays put.
   */
  isTarget?: boolean;
}

/** What MediaPipe returns per frame, narrowed to the parts this app reads. */
export interface FrameLandmarks {
  landmarks?: Point[][];
  handednesses?: { categoryName: string }[][];
}

/** The camera's per-frame callback. */
export type FrameHandler = (frame: FrameLandmarks | null, readings: HandReading[]) => void;
