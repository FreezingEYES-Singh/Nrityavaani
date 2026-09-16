/**
 * Turns one step into the three key points a student should watch for.
 *
 * The lesson studio poses the figure at a step's representative frame, renders
 * it, and sends the render to a vision model along with the step's name and
 * timing. This file holds the prompt that asks for the notes and the parser
 * that reads them back — both pure, so the parser is tested without a model.
 *
 * Why a vision model here, when the correction loop elsewhere learns not to
 * trust one for joint angles: writing *advice* is exactly what a language model
 * is good at. It sees the pose and says "fingers together in Tripataka, elbow
 * at shoulder height" — three readable sentences, no numbers that have to be
 * right to a degree. The fragile part is the vocabulary discipline, which is
 * what the schema and parser enforce.
 */

export interface KeypointStep {
  /** What the step is called. */
  name: string;
  /** Seconds. */
  duration: number;
  /** What the teacher said during the step, if transcription exists. */
  transcript?: string;
}

export const KEYPOINT_SCHEMA = {
  type: "object",
  properties: {
    keyPoints: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
    },
    focus: { type: "string" },
  },
  required: ["keyPoints"],
  additionalProperties: false,
} as const;

/** The system prompt, shared so the route and any future caller agree. */
export function buildKeypointSystem(): string {
  return `You are a Bharatanatyam teacher writing practice notes for a student.

You will be given the step's name and how long it lasts (and any words the
teacher spoke during it), followed by one render of a 3D figure holding that
step.

Write THREE short, concrete key points a student must get right in this step.
Order them by what matters most. Each point is one sentence, in plain,
student-facing language — "keep the fingers together in Tripataka", not
"abduct the metacarpophalangeal joint". Point at the body (hand, arm, knee,
foot, gaze) rather than at abstract qualities.

Also give a "focus": one short line saying what the step is, for a lesson list.

Reply with json only, in exactly this shape:
{"keyPoints":["point one","point two","point three"],"focus":"Tripataka, right hand"}`;
}

/** The text half of the user message. The route adds the image. */
export function keypointUserText(step: KeypointStep): string {
  const lines = [
    `Step: ${step.name}`,
    `Duration: ${step.duration.toFixed(1)} seconds`,
  ];
  if (step.transcript) lines.push(`Teacher's words: ${step.transcript}`);
  return lines.join("\n");
}

export interface Keypoints {
  keyPoints: string[];
  focus: string;
}

/**
 * Reads the model's reply back.
 *
 * Like `parseCritique`, this exists because a provider that guarantees the
 * reply *parses* does not guarantee it matches the schema, and a schema that
 * drifts from the type fails at runtime looking like the model misbehaved.
 * Unknown shapes degrade to "nothing usable" rather than throwing, so one bad
 * frame never takes down a lesson.
 */
export function parseKeypoints(raw: unknown): Keypoints | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const keyPoints = Array.isArray(o.keyPoints)
    ? o.keyPoints.filter((k): k is string => typeof k === "string").slice(0, 3)
    : [];

  if (keyPoints.length === 0) return null;

  return {
    keyPoints,
    focus: typeof o.focus === "string" ? o.focus : "",
  };
}
