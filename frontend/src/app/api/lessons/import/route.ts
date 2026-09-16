import { NextResponse } from "next/server";
import { unzip } from "@/lib/zip";
import { DANCES } from "@/lib/constants/dances";
import {
  listLessons,
  writeClip,
  writeLesson,
  writeVoiceFile,
  writeVoiceManifest,
} from "@/lib/lesson/store";
import { danceOf, type LessonManifest, type VoiceClip } from "@/lib/lesson/manifest";

/**
 * Imports a studio-exported lesson ZIP into `public/lessons`.
 *
 * This is the delivery site's only write path. The studio authors a lesson and
 * exports it as one portable archive — `manifest.json`, `clip.nvclip` and,
 * optionally, the man's own take as `clip-male.nvclip` and `voice.json` plus
 * `voice/*.mp3` — and this route unpacks it next
 * to the hand-built `namaskaram` lesson so the player serves it exactly like
 * any other published lesson. Nothing here runs Blender or any model; the
 * motion arrives already baked.
 *
 * The slug is derived from the manifest title and uniquified against what
 * already exists, so importing twice never silently overwrites an earlier
 * lesson. All file paths inside the archive are rewritten to the slug that is
 * finally chosen, so the archive is fully self-contained and relocatable.
 *
 * A lesson is filed under the dance named in the form's `dance` field — the
 * dance page it was uploaded from — or, without one, the dance its manifest
 * names, and always goes on the end of that dance as its last part.
 */

const MAX_BYTES = 128 * 1024 * 1024; // 128 MiB — clips are ~1.3 MB, voice ~2 MB.

const te = new TextDecoder("utf-8");

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "lesson";
}

/** The filename after the last `/`, the only part worth keeping on import. */
function basename(p: string): string {
  const i = p.lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

/** Re-points one narration clip at its new home under the final slug. */
function rewriteClip(clip: VoiceClip, slug: string): VoiceClip {
  const file = (p: string) => `/lessons/${slug}-voice/${basename(p)}`;
  return {
    index: clip.index,
    start: clip.start,
    end: clip.end,
    en: clip.en ? { female: file(clip.en.female), male: file(clip.en.male) } : undefined,
    hi: { female: file(clip.hi.female), male: file(clip.hi.male) },
  };
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body must be multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || !file.name) {
    return NextResponse.json({ error: "Need a ZIP file in the 'file' field." }, { status: 400 });
  }

  const dance = form.get("dance");
  if (dance !== null && !DANCES.some((d) => d.slug === dance)) {
    return NextResponse.json({ error: `No dance called "${dance}".` }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: "That archive is larger than 128 MiB." }, { status: 413 });
  }

  let files: Map<string, Uint8Array>;
  try {
    files = unzip(bytes);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read the ZIP." },
      { status: 400 },
    );
  }

  const manRaw = files.get("manifest.json");
  const clipRaw = files.get("clip.nvclip");
  if (!manRaw || !clipRaw) {
    return NextResponse.json(
      { error: "The ZIP must contain manifest.json and clip.nvclip." },
      { status: 400 },
    );
  }

  let manifest: LessonManifest;
  try {
    manifest = JSON.parse(te.decode(manRaw)) as LessonManifest;
  } catch {
    return NextResponse.json({ error: "manifest.json is not valid JSON." }, { status: 400 });
  }
  if (
    !manifest ||
    typeof manifest.title !== "string" ||
    !Array.isArray(manifest.steps) ||
    typeof manifest.duration !== "number"
  ) {
    return NextResponse.json(
      { error: "manifest.json is missing title, steps or duration." },
      { status: 400 },
    );
  }

  // A unique slug, so re-importing the same take never clobbers the previous one.
  const existing = await listLessons();
  const taken = new Set(existing.map((l) => l.slug));
  const base = slugify(manifest.title);
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

  // Re-point every public path at the slug that was finally chosen.
  manifest.slug = slug;
  manifest.clip = `/lessons/${slug}.nvclip`;
  const maleClipRaw = files.get("clip-male.nvclip");
  if (maleClipRaw) {
    manifest.clips = { female: manifest.clip, male: `/lessons/${slug}-male.nvclip` };
  } else {
    delete manifest.clips;
  }
  manifest.subtitle = typeof manifest.subtitle === "string" ? manifest.subtitle : "";
  manifest.fps = typeof manifest.fps === "number" ? manifest.fps : 15;
  manifest.sex = manifest.sex === "male" ? "male" : "female";
  manifest.lines = Array.isArray(manifest.lines) ? manifest.lines : [];

  // After the last part already in its dance, whatever part the archive claims.
  manifest.dance = typeof dance === "string" ? dance : danceOf(manifest);
  manifest.part =
    1 +
    Math.max(0, ...existing.filter((l) => l.dance === manifest.dance).map((l) => l.part ?? 0));

  const voiceRaw = files.get("voice.json");
  if (voiceRaw) {
    let clips: VoiceClip[];
    try {
      clips = JSON.parse(te.decode(voiceRaw)) as VoiceClip[];
    } catch {
      return NextResponse.json({ error: "voice.json is not valid JSON." }, { status: 400 });
    }
    if (!Array.isArray(clips)) {
      return NextResponse.json({ error: "voice.json must be an array." }, { status: 400 });
    }

    const written = await writeVoiceManifest(slug, clips.map((c) => rewriteClip(c, slug)));
    if (!written) {
      return NextResponse.json({ error: "Could not write the narration manifest." }, { status: 500 });
    }

    for (const [name, data] of files) {
      if (!name.startsWith("voice/") || name.endsWith("/")) continue;
      const ok = await writeVoiceFile(slug, basename(name), data);
      if (!ok) {
        return NextResponse.json({ error: `Refused narration file "${name}".` }, { status: 400 });
      }
    }
    manifest.voice = `/lessons/${slug}-voice.json`;
  } else {
    delete manifest.voice;
  }

  const wroteClip =
    (await writeClip(slug, clipRaw)) && (!maleClipRaw || (await writeClip(slug, maleClipRaw, "male")));
  if (!wroteClip) return NextResponse.json({ error: "Refused slug." }, { status: 400 });
  const wroteLesson = await writeLesson(slug, manifest);
  if (!wroteLesson) {
    return NextResponse.json({ error: "Could not write the lesson." }, { status: 500 });
  }

  return NextResponse.json({
    slug,
    title: manifest.title,
    dance: manifest.dance,
    steps: manifest.steps.length,
    hasVoice: typeof manifest.voice === "string",
  });
}
