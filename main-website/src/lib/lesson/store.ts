import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { byPart, danceOf, type LessonManifest, type LessonSummary } from "./manifest";

/**
 * The server-side view of the published lessons.
 *
 * Published lessons live as static files under `public/lessons`: one
 * `<slug>.json` manifest apiece, alongside its `<slug>.nvclip` (and the man's
 * own take, `<slug>-male.nvclip`, when it has one) and, when narration was
 * generated, `<slug>-voice.json` and `<slug>-voice/`. The player
 * fetches those files directly; these helpers read and write the same files, so
 * the route handlers that list and import lessons act on exactly what is served.
 * Nothing on the site deletes a lesson: learners use it.
 *
 * Imported only on the server — by the route handlers and the `/learn` server
 * pages — never by client code, and the `node:` imports are why it must stay
 * that way.
 */

const LESSONS_DIR = path.join(process.cwd(), "public", "lessons");

/** Slugs are one URL path segment; anything else is refused before touching disk. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/i;

function isManifest(name: string) {
  return name.endsWith(".json") && !name.endsWith("-voice.json") && name !== "index.json";
}

/** Every published lesson, as the `/learn` pages need it, in part order. Empty on no dir. */
export async function listLessons(): Promise<LessonSummary[]> {
  let names: string[];
  try {
    names = await readdir(LESSONS_DIR);
  } catch {
    return [];
  }

  const out: LessonSummary[] = [];
  for (const name of names) {
    if (!isManifest(name)) continue;
    const slug = name.slice(0, -".json".length);
    const manifest = await readLesson(slug);
    if (!manifest) continue;
    out.push({
      slug: manifest.slug,
      title: manifest.title ?? manifest.slug,
      subtitle: manifest.subtitle ?? "",
      dance: danceOf(manifest),
      part: typeof manifest.part === "number" ? manifest.part : null,
      duration: typeof manifest.duration === "number" ? manifest.duration : 0,
      steps: Array.isArray(manifest.steps) ? manifest.steps.length : 0,
      lines: Array.isArray(manifest.lines) ? manifest.lines.length : 0,
      sex: manifest.sex ?? "",
      hasVoice: typeof manifest.voice === "string",
    });
  }
  out.sort(byPart);
  return out;
}

/** One manifest, or `null` if there is no such lesson. */
export async function readLesson(slug: string): Promise<LessonManifest | null> {
  if (!SLUG.test(slug)) return null;
  try {
    const raw = await readFile(path.join(LESSONS_DIR, `${slug}.json`), "utf8");
    const manifest = JSON.parse(raw) as LessonManifest;
    return manifest && typeof manifest.slug === "string" ? manifest : null;
  } catch {
    return null;
  }
}

/** Writes a manifest back to disk. Returns false only for a refused slug. */
export async function writeLesson(slug: string, manifest: LessonManifest): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  await writeFile(
    path.join(LESSONS_DIR, `${slug}.json`),
    JSON.stringify(manifest, null, 1) + "\n",
    "utf8",
  );
  return true;
}

/** The file a figure's take lives in: the woman's is plain `<slug>.nvclip`, the man's `<slug>-male.nvclip`. */
function clipFile(slug: string, sex: "female" | "male") {
  return `${slug}${sex === "male" ? "-male" : ""}.nvclip`;
}

/** Writes a published clip's bytes. Returns false only for a refused slug. */
export async function writeClip(
  slug: string,
  data: Uint8Array,
  sex: "female" | "male" = "female",
): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  await writeFile(path.join(LESSONS_DIR, clipFile(slug, sex)), data);
  return true;
}

/** One filename inside `<slug>-voice/` — never a path, so it cannot escape. */
const VOICE_FILE = /^[a-z0-9][a-z0-9._-]*$/i;

/** Writes the narration clips manifest (`<slug>-voice.json`). */
export async function writeVoiceManifest(slug: string, clips: unknown): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  await writeFile(
    path.join(LESSONS_DIR, `${slug}-voice.json`),
    JSON.stringify(clips, null, 1) + "\n",
    "utf8",
  );
  return true;
}

/** Writes one narration audio file into `<slug>-voice/`. */
export async function writeVoiceFile(
  slug: string,
  name: string,
  data: Uint8Array,
): Promise<boolean> {
  if (!SLUG.test(slug) || !VOICE_FILE.test(name)) return false;
  const dir = path.join(LESSONS_DIR, `${slug}-voice`);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
  return true;
}
