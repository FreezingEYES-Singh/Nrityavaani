import { DANCES } from "@/lib/constants/dances";

/**
 * A published lesson: what the figure does, and what she says while it does it.
 *
 * Distinct from `lesson.ts`, which is the *authoring* side — a `Lesson` there
 * is assembled in the browser from a tracked video and lives in IndexedDB. A
 * manifest is the finished article: keyed by hand in Blender, built by
 * `tools/blender/namaskaram.py`, and served as a static file next to the clip
 * it describes. Students read these; the words, timings and geometry are all
 * authored in the studio and arrive here frozen inside the published files.
 *
 * Kept separate from the `.nvclip` rather than folded into its header for the
 * reason the clip's own docs give about bakes: the two age differently. Fixing
 * a wrong cue or a mistimed caption should not mean re-keying and re-shipping
 * 1.3 MB of rotations.
 */

/** One thing she teaches, and the corrections she gives while teaching it. */
export interface LessonStep {
  /** Seconds from the start of the clip. Steps are contiguous and in order. */
  start: number;
  end: number;
  /** The vocabulary term — "Aramandi", "Katakamukha". */
  name: string;
  /** One line on what happens here. */
  gloss: string;
  /** Her corrections, in her words. */
  cues: string[];
}

/** The two languages a lesson can be read in. */
export type Language = "en" | "hi";

/** One thing she says, on the clip's clock. */
export interface SpokenLine {
  start: number;
  end: number;
  /** The English (or romanised Sanskrit) text, shown by default. */
  text: string;
  /** The Hindi text, shown when the learner switches language. */
  textHi?: string;
}

/** One reading — the same line in a female and a male voice. */
export interface VoiceReading {
  female: string;
  male: string;
}

/**
 * One pre-generated narration clip, timed on the clip's clock. Built by
 * `tools/blender/generate_voice.py` and listed in `<slug>-voice.json`; the
 * player preloads them and starts each one when the clock reaches its `start`.
 *
 * A line is recorded in both languages, each with a female and a male voice, so
 * the narration can follow the learner's language *and* the figure on screen.
 * Lines recited only in Sanskrit (the opening shloka) carry just `hi`; the
 * player falls back to it when English is selected.
 */
export interface VoiceClip {
  index: number;
  start: number;
  end: number;
  /** English reading; absent on lines recited only in Sanskrit/Hindi. */
  en?: VoiceReading;
  hi: VoiceReading;
}

export interface LessonManifest {
  slug: string;
  title: string;
  subtitle: string;
  /**
   * The dance this lesson is a part of, as a `Dance` slug. Lessons published
   * before they were filed under a dance have none — read it through `danceOf`.
   */
  dance?: string;
  /**
   * Where the lesson falls in its dance's sequence. An ordering key only: the
   * "Part N" a learner sees is its position in that sequence (see `byPart`), so
   * deleting a part never leaves a gap in the numbering.
   */
  part?: number;
  /** Public path of the `.nvclip` this describes, keyed on the figure named by `sex`. */
  clip: string;
  /**
   * A take per figure, each keyed on that figure's own body. A clip is joint
   * rotations, and the same rotations put two differently built bodies in
   * different places — her namaste on his arms leaves the palms apart — so a
   * lesson can ship one for each. Lessons without it play `clip` on both.
   */
  clips?: Partial<Record<"female" | "male", string>>;
  /** Seconds. Authoritative for the scrubber — the clip's own count is frames. */
  duration: number;
  fps: number;
  sex: string;
  steps: LessonStep[];
  lines: SpokenLine[];
  /** Public path of the voice clips manifest, if narration was generated. */
  voice?: string;
}

/** A lesson as the `/learn` pages list it — enough to render one part. */
export interface LessonSummary {
  slug: string;
  title: string;
  subtitle: string;
  /** Always a real `Dance` slug: already resolved through `danceOf`. */
  dance: string;
  part: number | null;
  duration: number;
  steps: number;
  lines: number;
  sex: string;
  hasVoice: boolean;
}

/** The text to show for a line, in the learner's language. */
export function lineText(line: SpokenLine, lang: Language): string {
  return lang === "hi" ? (line.textHi ?? line.text) : line.text;
}

/** The take to play on a figure: its own when the lesson has one, the lesson's clip otherwise. */
export function clipFor(manifest: Pick<LessonManifest, "clip" | "clips">, sex: "female" | "male"): string {
  return manifest.clips?.[sex] ?? manifest.clip;
}

/** The reading to play for a clip, in the learner's language. */
export function readingFor<R>(clip: { en?: R; hi: R }, lang: Language): R {
  return lang === "hi" ? clip.hi : (clip.en ?? clip.hi);
}

/**
 * The dance a lesson is a part of.
 *
 * Lessons were published before they were filed under a dance, and the Blender
 * build still writes no `dance` field. So far every one of those teaches
 * Bharatanatyam, so that is where a manifest without one — or naming a dance
 * that does not exist — is filed, rather than vanishing from every page. A
 * lesson for another dance built that way needs `dance` set in its manifest.
 */
export function danceOf(manifest: { dance?: string }): string {
  return DANCES.find((d) => d.slug === manifest.dance)?.slug ?? "bharatanatyam";
}

/**
 * Puts a dance's lessons in sequence: by `part`, then by title. A lesson with no
 * part sorts first, because it was published before parts were numbered; an
 * import is numbered after the last part already there.
 */
export function byPart(
  a: { part?: number | null; title: string },
  b: { part?: number | null; title: string },
): number {
  return (a.part ?? 0) - (b.part ?? 0) || a.title.localeCompare(b.title);
}

/** How much of a dance there is to learn: "1 part", "3 parts", or "No parts yet". */
export function partCount(n: number): string {
  return n === 0 ? "No parts yet" : `${n} part${n === 1 ? "" : "s"}`;
}

export async function loadManifest(slug: string, signal?: AbortSignal): Promise<LessonManifest> {
  const res = await fetch(`/lessons/${slug}.json`, { signal });
  if (!res.ok) throw new Error(`No lesson called "${slug}" (${res.status})`);
  return (await res.json()) as LessonManifest;
}

/** The narration clips for a lesson, in order. `path` is `LessonManifest.voice`. */
export async function loadVoice(path: string, signal?: AbortSignal): Promise<VoiceClip[]> {
  const res = await fetch(path, { signal });
  if (!res.ok) throw new Error(`Narration missing (${res.status})`);
  return (await res.json()) as VoiceClip[];
}

/**
 * Which step covers `t`.
 *
 * A linear walk rather than a binary search on purpose: this runs once per
 * animation frame over eleven steps, and the branch-free scan is quicker than
 * the search that would replace it.
 */
export function stepAt(steps: LessonStep[], t: number): number {
  for (let i = 0; i < steps.length; i++) if (t < steps[i].end) return i;
  return steps.length - 1;
}

/** What she is saying at `t`, or `null` in the gaps between lines. */
export function lineAt(lines: SpokenLine[], t: number): SpokenLine | null {
  for (const l of lines) if (t >= l.start && t < l.end) return l;
  return null;
}

/**
 * Everything she says during `step`.
 *
 * Overlap rather than containment: she routinely starts naming the next thing
 * while still finishing the last one, so a line that straddles a boundary
 * belongs to both steps. Dropping it from both — which is what testing for
 * containment would do — would lose the sentence that explains the step.
 */
export function linesIn(lines: SpokenLine[], step: LessonStep): SpokenLine[] {
  return lines.filter((l) => l.start < step.end && l.end > step.start);
}
