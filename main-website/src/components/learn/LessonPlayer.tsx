"use client";

/**
 * A lesson, played.
 *
 * The other end of `tools/blender/namaskaram.py`: that keys the take against
 * the teaching video, this plays it back. The figure is driven from the clip
 * frame by frame rather than handed to an `AnimationMixer`, because everything
 * else on the page — the step, her words, the scrubber — has to agree with the
 * pose on screen, and the only way to guarantee that is for one clock to drive
 * all four.
 *
 * That clock is the wall clock, not a frame counter, so the lesson runs at the
 * speed it was danced whatever the display is doing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Pause, Play, Repeat, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { MocapApi } from "@/components/three/MocapFigure";
import type { Sex } from "@/components/three/figureRig";
import { decodeClip, samplePose, type Clip } from "@/lib/motion/clip";
import { DIMS } from "@/lib/motion/poseCodec";
import {
  clipFor,
  lineAt,
  lineText,
  linesIn,
  loadManifest,
  loadVoice,
  readingFor,
  stepAt,
  type Language,
  type LessonManifest,
  type SpokenLine,
} from "@/lib/lesson/manifest";
import { Eyebrow, Rule } from "@/components/ui/editorial";

const MocapFigure = dynamic(() => import("@/components/three/MocapFigure"), {
  ssr: false,
  loading: () => null,
});

const SPEEDS = [0.5, 1] as const;

function clock(t: number) {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const chip =
  "mono rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";
const chipOn = "border-primary/70 bg-primary/10 text-primary";
const chipOff =
  "border-foreground/20 text-foreground/60 hover:border-primary/50 hover:text-primary";

export default function LessonPlayer({
  slug,
  dance,
  part,
}: {
  slug: string;
  /** The dance this lesson is a part of, which is where "back" goes; null if unknown. */
  dance: { slug: string; name: string } | null;
  /** Its place in that dance's sequence — "Part 1" — or null if it is not published. */
  part: number | null;
}) {
  const backHref = dance ? `/learn/${dance.slug}` : "/learn";

  const [manifest, setManifest] = useState<LessonManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [line, setLine] = useState<SpokenLine | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState(false);
  const [sex, setSex] = useState<Sex>("female");
  const [lang, setLang] = useState<Language>("en");
  const [skeleton, setSkeleton] = useState(false);

  // The pose on screen changes sixty times a second; the step and her words
  // change eleven and nineteen times in the whole lesson. So the scrubber and
  // the clock are written straight to the DOM, and only the things that
  // genuinely change get to re-render the page.
  const apiRef = useRef<MocapApi | null>(null);
  // Every take the lesson ships, by path — one per figure when it has them.
  const clipsRef = useRef(new Map<string, Clip>());
  const manRef = useRef<LessonManifest | null>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const stepRef = useRef(0);
  // The showing line's start time, which identifies it; -1 while she is silent.
  const lineRef = useRef(-1);
  // Scratch for the interpolated pose, reused every frame.
  const poseRef = useRef(new Float32Array(DIMS));

  const rafRef = useRef(0);
  const tRef = useRef(0);
  const originRef = useRef(0);
  const startedRef = useRef(0);
  const speedRef = useRef(1);
  const loopRef = useRef(false);
  const sexRef = useRef<Sex>("female");
  const langRef = useRef<Language>("en");
  speedRef.current = speed;
  loopRef.current = loop;
  sexRef.current = sex;
  langRef.current = lang;

  // Voice narration — pre-loaded Audio elements, one per spoken line.
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const voiceRef = useRef<
    {
      start: number;
      end: number;
      en?: { female: HTMLAudioElement; male: HTMLAudioElement };
      hi: { female: HTMLAudioElement; male: HTMLAudioElement };
    }[]
  >([]);
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);
  // The clip currently speaking, so a frame can spot the line or voice changing.
  const activeVoiceRef = useRef<{
    start: number;
    lang: Language;
    sex: Sex;
    audio: HTMLAudioElement;
  } | null>(null);
  volumeRef.current = volume;
  mutedRef.current = muted;

  /** Puts the figure, the scrubber, the step and the caption at `t`. */
  const applyTime = useCallback((t: number) => {
    const man = manRef.current;
    // The take for the figure on screen, read each time so a swap mid-lesson
    // picks up that figure's own clip on the very next pose.
    const clip = man && clipsRef.current.get(clipFor(man, sexRef.current));
    if (!clip || !man) return;
    tRef.current = t;

    // Slerped, not the nearest stored frame: the clip is kept at 15 fps on the
    // understanding that playback fills in between.
    apiRef.current?.show(samplePose(clip, t, poseRef.current));

    if (scrubRef.current) scrubRef.current.value = String(t);
    if (clockRef.current) clockRef.current.textContent = clock(t);

    const s = stepAt(man.steps, t);
    if (s !== stepRef.current) {
      stepRef.current = s;
      setStep(s);
    }
    const l = lineAt(man.lines, t);
    const id = l?.start ?? -1;
    if (id !== lineRef.current) {
      lineRef.current = id;
      setLine(l);
    }
  }, []);

  /** Retire whatever line is speaking. */
  const stopVoice = useCallback(() => {
    activeVoiceRef.current?.audio.pause();
    activeVoiceRef.current = null;
  }, []);

  /**
   * Keep the narration on the clock. One clip plays at a time: the line whose
   * `start` has most recently passed. Clips are fitted (at build time) to end
   * before the next line begins, so a line is never cut off mid-sentence — it
   * simply plays out and the next one takes over on its own `start`.
   */
  const syncVoice = useCallback(
    (t: number) => {
      const clips = voiceRef.current;
      if (!clips.length) return;

      let idx = -1;
      for (let i = 0; i < clips.length; i++) {
        if (clips[i].start <= t) idx = i;
        else break;
      }
      const clip = idx >= 0 ? clips[idx] : null;

      const cur = activeVoiceRef.current;
      if (!clip) {
        if (cur) stopVoice();
        return;
      }

      // The reading that matches the learner's language and the figure on screen.
      const reading = readingFor(clip, langRef.current);
      const audio = reading[sexRef.current];
      audio.volume = mutedRef.current ? 0 : volumeRef.current;
      audio.playbackRate = speedRef.current;

      if (
        !cur ||
        cur.start !== clip.start ||
        cur.lang !== langRef.current ||
        cur.sex !== sexRef.current
      ) {
        // A new line, or the language or figure has been swapped: start the
        // right clip from where the clock has reached.
        cur?.audio.pause();
        const off = Math.max(0, t - clip.start);
        if (!Number.isFinite(audio.duration) || off < audio.duration - 0.05) {
          audio.currentTime = off;
          void audio.play().catch(() => {});
        }
        activeVoiceRef.current = {
          start: clip.start,
          lang: langRef.current,
          sex: sexRef.current,
          audio,
        };
        return;
      }

      // Same line, same voice. If it has already run its course (a short clip
      // followed by a pause before the next line), leave it silent — restarting
      // from the top would make her repeat herself.
      if (
        audio.ended ||
        (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.05)
      ) {
        return;
      }
      if (audio.paused) {
        audio.currentTime = Math.max(0, t - clip.start);
        void audio.play().catch(() => {});
      } else if (Math.abs(audio.currentTime - (t - clip.start)) > 0.15) {
        audio.currentTime = t - clip.start;
      }
    },
    [stopVoice],
  );

  const tick = useCallback(() => {
    const man = manRef.current;
    if (!man) return;
    let t =
      originRef.current +
      ((performance.now() - startedRef.current) / 1000) * speedRef.current;

    // Looping a step is how a step is learnt — the whole reason to sit with one
    // of these. The current step is read fresh each frame, so turning the loop
    // on mid-step catches the step you are actually watching.
    const s = man.steps[stepRef.current];
    const end = loopRef.current && s ? s.end : man.duration;
    const back = loopRef.current && s ? s.start : 0;
    if (t >= end) {
      t = back;
      originRef.current = back;
      startedRef.current = performance.now();
    }

    applyTime(t);
    syncVoice(t);
    rafRef.current = requestAnimationFrame(tick);
  }, [applyTime, syncVoice]);

  const play = useCallback(() => {
    if (!manRef.current) return;
    cancelAnimationFrame(rafRef.current);
    const duration = manRef.current?.duration ?? 0;
    originRef.current = tRef.current >= duration - 0.05 ? 0 : tRef.current;
    startedRef.current = performance.now();
    setPlaying(true);
    // Start the narration inside the click, so the browser's autoplay rules
    // are satisfied by a real gesture rather than a timer a frame later.
    syncVoice(originRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, syncVoice]);

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    setPlaying(false);
    stopVoice();
  }, [stopVoice]);

  /** Move the playhead without disturbing whether it is running. */
  const seek = useCallback(
    (t: number) => {
      applyTime(t);
      originRef.current = t;
      startedRef.current = performance.now();
      // Silence the narration until the next frame re-syncs it (or until Play,
      // if it was paused) — the figure and her voice should not disagree.
      stopVoice();
    },
    [applyTime, stopVoice],
  );

  // Load the lesson and its clips together — neither is any use alone.
  useEffect(() => {
    const abort = new AbortController();
    let dead = false;
    (async () => {
      try {
        const man = await loadManifest(slug, abort.signal);
        // Every figure's take up front, so swapping the figure mid-lesson never
        // leaves the new body waiting on the network in the other one's pose.
        // All the downloads start at once; they are only read back in turn.
        const paths = [...new Set([man.clip, ...Object.values(man.clips ?? {})])].filter(
          (p): p is string => !!p,
        );
        const pending = paths.map((path) => fetch(path, { signal: abort.signal }));
        // Awaiting one still throws; this only stops a later one that fails
        // while an earlier one is being read from surfacing as uncaught.
        pending.forEach((p) => p.catch(() => {}));
        const clips = new Map<string, Clip>();
        for (let i = 0; i < paths.length; i++) {
          const res = await pending[i];
          if (!res.ok) throw new Error(`Lesson clip missing (${res.status})`);
          clips.set(paths[i], await decodeClip(await res.blob()));
        }

        // Narration is optional; preload it so playback never waits on the net.
        const voice = man.voice ? await loadVoice(man.voice, abort.signal) : [];
        if (dead) return;
        manRef.current = man;
        clipsRef.current = clips;
        voiceRef.current = voice.map((c) => {
          const audio = (file: string) => {
            const a = new Audio(file);
            a.preload = "auto";
            a.volume = mutedRef.current ? 0 : volumeRef.current;
            return a;
          };
          return {
            start: c.start,
            end: c.end,
            en: c.en ? { female: audio(c.en.female), male: audio(c.en.male) } : undefined,
            hi: { female: audio(c.hi.female), male: audio(c.hi.male) },
          };
        });
        setManifest(man);
      } catch (err) {
        if (dead || abort.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      dead = true;
      abort.abort();
      cancelAnimationFrame(rafRef.current);
    };
  }, [slug]);

  // Two moments need the figure re-posed without the clock having moved: when
  // the clip and the model have both arrived, so the page opens on the first
  // pose rather than an empty stage; and after a figure swap, which builds a
  // fresh body at rest and does not call `onReady` again — so nothing else
  // would put the new figure back where the playhead is, in its own take.
  useEffect(() => {
    if (ready && manifest) applyTime(tRef.current);
  }, [sex, ready, manifest, applyTime]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      voiceRef.current.forEach((c) => {
        c.en?.female.pause();
        c.en?.male.pause();
        c.hi.female.pause();
        c.hi.male.pause();
      });
    },
    [],
  );

  // Space to play, arrows to scrub, the way any player behaves. Skipped while a
  // control has focus, so the keys keep their normal meaning there.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(el.tagName)) return;
      const man = manRef.current;
      if (!man) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (playing) pause();
        else play();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, tRef.current - 2));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(man.duration, tRef.current + 2));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, play, pause, seek]);

  if (error) {
    return (
      <div className="min-h-screen px-6 pt-40 pb-32">
        <div className="mx-auto max-w-md">
          <Eyebrow>not found</Eyebrow>
          <h1 className="serif mt-4 text-[2rem] leading-tight">
            That lesson isn&rsquo;t here.
          </h1>
          <p className="serif mt-3 text-[1rem] leading-[1.6] text-foreground/60">
            {error}
          </p>
          <Link
            href={backHref}
            className="mono mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {dance?.name ?? "all dances"}
          </Link>
        </div>
      </div>
    );
  }

  const current = manifest?.steps[step];

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="mx-auto max-w-6xl">
        <Link
          href={backHref}
          className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-foreground/50 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {dance?.name ?? "All dances"}
        </Link>

        <div className="mt-8">
          <Eyebrow tone="primary">
            {dance && part ? `${dance.name} · Part ${part}` : "lesson"}
          </Eyebrow>
          <h1 className="serif mt-3 text-[2.4rem] leading-[1.05] sm:text-[3rem]">
            {manifest?.title ?? " "}
          </h1>
          <p className="serif mt-2 text-[1.05rem] leading-[1.6] text-foreground/60">
            {manifest?.subtitle ?? "Loading the take…"}
          </p>
        </div>

        <Rule className="mt-8" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-card-border bg-card sm:aspect-video">
              <MocapFigure
                sex={sex}
                showBody
                showSkeleton={skeleton}
                className="h-full w-full"
                onReady={(api) => {
                  apiRef.current = api;
                  setReady(true);
                }}
              />
              {/* What you are looking at, on the figure itself. The step list
                  is off to one side and easy to lose track of once you are
                  watching the body rather than the page. */}
              {current && (
                <div className="pointer-events-none absolute top-4 left-4">
                  <p className="mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    Step {step + 1} of {manifest?.steps.length}
                  </p>
                  <p className="serif mt-1 text-[1.15rem] leading-tight text-foreground/90">
                    {current.name}
                  </p>
                </div>
              )}
              {!manifest && (
                <div className="mono absolute inset-0 grid place-items-center text-[11px] uppercase tracking-[0.16em] text-foreground/40">
                  Loading the lesson&hellip;
                </div>
              )}
            </div>

            {/* Her words, on the clip's clock. Holds its height so the panel
                below does not jump every time she pauses for breath. */}
            <p className="serif mt-4 min-h-[3.25rem] text-[1.05rem] leading-[1.55] text-foreground/80">
              {line ? lineText(line, lang) : ""}
            </p>

            <div className="mt-2 rounded-2xl border border-card-border bg-card p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => (playing ? pause() : play())}
                  disabled={!manifest || !ready}
                  aria-label={playing ? "Pause" : "Play"}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-black transition-opacity hover:opacity-85 disabled:opacity-30"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </button>

                <span
                  ref={clockRef}
                  className="mono w-10 shrink-0 text-[11px] text-foreground/60"
                >
                  0:00
                </span>

                <div className="relative flex-1">
                  <input
                    ref={scrubRef}
                    type="range"
                    min={0}
                    max={manifest?.duration ?? 1}
                    step={0.01}
                    defaultValue={0}
                    disabled={!manifest}
                    aria-label="Position in the lesson"
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  {/* Where one step becomes the next. */}
                  {manifest?.steps.slice(1).map((s) => (
                    <span
                      key={s.start}
                      aria-hidden
                      className="pointer-events-none absolute top-0 h-1.5 w-px bg-foreground/25"
                      style={{ left: `${(s.start / manifest.duration) * 100}%` }}
                    />
                  ))}
                </div>

                <span className="mono w-10 shrink-0 text-right text-[11px] text-foreground/40">
                  {clock(manifest?.duration ?? 0)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => seek(current?.start ?? 0)}
                  className={`${chip} ${chipOff}`}
                >
                  <RotateCcw className="mr-1.5 inline h-3 w-3" />
                  Restart step
                </button>
                <button
                  type="button"
                  onClick={() => setLoop((v) => !v)}
                  aria-pressed={loop}
                  className={`${chip} ${loop ? chipOn : chipOff}`}
                >
                  <Repeat className="mr-1.5 inline h-3 w-3" />
                  Loop step
                </button>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    aria-pressed={speed === s}
                    className={`${chip} ${speed === s ? chipOn : chipOff}`}
                  >
                    {s}&times;
                  </button>
                ))}
                <span aria-hidden className="mx-1 h-4 w-px bg-foreground/15" />
                {(["en", "hi"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    title={
                      l === "en"
                        ? "Narration and captions in English"
                        : "नैरेशन और कैप्शन हिंदी में"
                    }
                    className={`${chip} ${lang === l ? chipOn : chipOff}`}
                  >
                    {l === "en" ? "English" : "हिंदी"}
                  </button>
                ))}
                <span aria-hidden className="mx-1 h-4 w-px bg-foreground/15" />
                {(["female", "male"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    aria-pressed={sex === s}
                    className={`${chip} ${sex === s ? chipOn : chipOff}`}
                  >
                    {s === "female" ? "Woman" : "Man"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSkeleton((v) => !v)}
                  aria-pressed={skeleton}
                  className={`${chip} ${skeleton ? chipOn : chipOff}`}
                >
                  Bones
                </button>
                <span aria-hidden className="mx-1 h-4 w-px bg-foreground/15" />
                <button
                  type="button"
                  onClick={() => setMuted((v) => !v)}
                  disabled={!manifest?.voice}
                  aria-pressed={muted}
                  aria-label={muted ? "Unmute narration" : "Mute narration"}
                  className={`${chip} ${muted ? chipOn : chipOff} disabled:opacity-40`}
                >
                  {muted ? (
                    <VolumeX className="mr-1.5 inline h-3 w-3" />
                  ) : (
                    <Volume2 className="mr-1.5 inline h-3 w-3" />
                  )}
                  {muted ? "Muted" : "Voice"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  disabled={!manifest?.voice}
                  aria-label="Narration volume"
                  title="Narration volume"
                  className="h-1 w-24 cursor-pointer accent-primary disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <aside>
            <Eyebrow>the steps</Eyebrow>
            <ol className="mt-4 space-y-1">
              {manifest?.steps.map((s, i) => (
                <li key={s.start}>
                  <button
                    type="button"
                    onClick={() => seek(s.start)}
                    aria-current={i === step ? "step" : undefined}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      i === step ? "bg-primary/10" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span className="flex items-baseline gap-2">
                      <span
                        className={`mono text-[10px] tabular-nums ${
                          i === step ? "text-primary" : "text-foreground/35"
                        }`}
                      >
                        {clock(s.start)}
                      </span>
                      <span
                        className={`serif text-[0.98rem] leading-tight ${
                          i === step ? "text-foreground" : "text-foreground/65"
                        }`}
                      >
                        {s.name}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {current && (
              <div className="mt-6 rounded-2xl border border-card-border bg-card p-4">
                <Eyebrow tone="primary">{current.name}</Eyebrow>
                <p className="serif mt-2 text-[0.98rem] leading-[1.55] text-foreground/70">
                  {current.gloss}
                </p>
                <Rule className="my-3" />
                <ul className="space-y-2">
                  {current.cues.map((cue) => (
                    <li
                      key={cue}
                      className="serif flex gap-2 text-[0.95rem] leading-[1.5] text-foreground/75"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-primary"
                      />
                      {cue}
                    </li>
                  ))}
                </ul>

                {/* Everything she says during this step, readable while the
                    clip is stopped. The caption under the figure only shows
                    the line for the instant you are on, which is no use when
                    you want to know what a step is about before playing it. */}
                {manifest && (
                  <>
                    <Rule className="my-3" />
                    <Eyebrow>in her words</Eyebrow>
                    <ul className="mt-2 space-y-1">
                      {linesIn(manifest.lines, current).map((l) => (
                        <li key={l.start}>
                          <button
                            type="button"
                            onClick={() => seek(l.start)}
                            className={`serif w-full rounded-md px-2 py-1 text-left text-[0.92rem] leading-[1.45] transition-colors ${
                              l.start === line?.start
                                ? "bg-primary/10 text-foreground"
                                : "text-foreground/55 hover:bg-foreground/5 hover:text-foreground/80"
                            }`}
                          >
                            {lineText(l, lang)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
