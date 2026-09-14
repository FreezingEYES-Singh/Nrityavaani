"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { classifyMudra, type Point } from "@/lib/mediapipe/classification";
import { Eyebrow, Rule } from "@/components/ui/editorial";

/**
 * Reading a mudra out of a still photograph.
 *
 * Same engine as the live page, in MediaPipe's IMAGE running mode: the model
 * runs in this tab, on this machine, and the file is never uploaded anywhere
 * despite the page being called Upload. That is worth being precise about on a
 * page whose name implies the opposite.
 */

/**
 * Pinned, not `@latest`.
 *
 * This URL is a script this page executes. Resolving it to whatever is newest
 * at page load means the code running here can change without anything in this
 * repository changing — a broken release, or a compromised one, arrives on its
 * own. The version is pinned to the same one the package.json depends on.
 */
const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** Matches the copy: a limit that is claimed has to be a limit that is applied. */
const MAX_BYTES = 10 * 1024 * 1024;

type Reading = {
  handedness: string;
  name: string;
  confidence: number;
  feedback: string;
};

type ModelState = "loading" | "ready" | "failed";

export default function UploadAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelState>("loading");

  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const detectorRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const detector = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "IMAGE",
          numHands: 2,
        });
        if (cancelled) {
          detector.close();
          return;
        }
        detectorRef.current = detector;
        setModel("ready");
      } catch (err) {
        console.error("Hand landmarker failed to initialise", err);
        // Surfaced, not just logged. Without this the page looks ready and the
        // analyse button simply refuses, with no way to tell why.
        if (!cancelled) setModel("failed");
      }
    })();
    return () => {
      cancelled = true;
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  }, []);

  // Object URLs are held by the document until revoked, so every file picked
  // and discarded leaked its full decoded size for the life of the page.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setReadings(null);
    if (!picked.type.startsWith("image/")) {
      setError("That is not an image file.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(`That file is ${(picked.size / 1048576).toFixed(1)} MB. The limit is 10 MB.`);
      return;
    }
    setError(null);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const clear = () => {
    setFile(null);
    setPreviewUrl(null);
    setReadings(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyse = useCallback(() => {
    const detector = detectorRef.current;
    const img = imageRef.current;
    if (!detector || !img) return;
    setBusy(true);
    setError(null);
    try {
      const result = detector.detect(img);
      const found: Reading[] = (result.landmarks ?? []).map((hand, i) => {
        const handedness = result.handednesses?.[i]?.[0]?.categoryName ?? "Unknown";
        const mudra = classifyMudra(hand as Point[], handedness);
        return { handedness, ...mudra };
      });
      setReadings(found);
    } catch (err) {
      console.error("Detection failed", err);
      setError("Could not read that image. Try a different file.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/45 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-end">
          <div>
            <Eyebrow tone="primary">from a photograph</Eyebrow>
            <h1 className="serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3rem)] mt-4">
              Read a mudra from a still.
            </h1>
          </div>
          <p className="serif text-[1.02rem] leading-[1.62] text-foreground/60 max-w-[58ch]">
            The same engine the live page uses, run once over one image. Despite the name of
            this page, <strong className="font-semibold text-foreground">the file is not
            uploaded</strong> — the model runs in this tab and the picture never leaves your
            machine.
          </p>
        </div>

        <Rule className="mt-12 mb-12" />

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          {/* ------------------------------------------------------- the file */}
          <div>
            <input
              type="file"
              ref={inputRef}
              onChange={onPick}
              accept="image/*"
              className="hidden"
            />

            {file && previewUrl ? (
              <div className="relative border border-foreground/12 rounded-sm overflow-hidden bg-black">
                {/* A blob URL from a file the user just picked — next/image
                    optimises remote and static sources, not these. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="The photograph being read"
                  className="w-full max-h-[440px] object-contain"
                />
                <button
                  type="button"
                  onClick={clear}
                  aria-label="Remove this image"
                  className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-background/70 backdrop-blur hover:bg-rose-500/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full min-h-[320px] border border-dashed border-foreground/20 rounded-sm grid place-items-center px-8 hover:border-primary/50 transition-colors group"
              >
                <span className="text-center">
                  <Upload className="w-6 h-6 text-foreground/35 mx-auto group-hover:text-primary transition-colors" />
                  <span className="block mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 mt-5">
                    Choose an image
                  </span>
                  <span className="block mono text-[10px] text-foreground/35 mt-2.5">
                    JPG or PNG · up to 10 MB
                  </span>
                </span>
              </button>
            )}

            {error && (
              <p role="alert" className="mono mt-5 text-[11px] leading-relaxed text-rose-400">
                {error}
              </p>
            )}

            {model === "failed" && (
              <p role="alert" className="mono mt-5 text-[11px] leading-relaxed text-rose-400">
                The hand model could not load. Check your connection and reload — nothing on
                this page works without it.
              </p>
            )}

            <button
              type="button"
              onClick={analyse}
              disabled={!file || busy || model !== "ready"}
              className="mono mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-black py-3.5 text-[11px] uppercase tracking-[0.16em] hover:bg-primary/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Reading
                </>
              ) : model === "loading" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading the model
                </>
              ) : (
                "Read this image"
              )}
            </button>
          </div>

          {/* ---------------------------------------------------- the readings */}
          <div>
            <Eyebrow>what it read</Eyebrow>

            {!readings && (
              <p className="serif italic text-[1rem] text-foreground/40 mt-6">
                Nothing yet. Choose an image and read it.
              </p>
            )}

            {readings?.length === 0 && (
              <div className="mt-6 border-l-2 border-foreground/20 pl-5">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-foreground/40" />
                  <h2 className="mono text-[11px] uppercase tracking-[0.16em] text-foreground/70">
                    No hand found
                  </h2>
                </div>
                <p className="serif text-[0.98rem] leading-[1.6] text-foreground/60 mt-3">
                  The model could not find a hand in that picture. It wants the whole hand in
                  frame, reasonably lit, and not too far from the camera.
                </p>
              </div>
            )}

            {readings && readings.length > 0 && (
              <ul className="mt-6 space-y-8">
                {readings.map((reading, i) => (
                  <li key={`${reading.name}-${i}`}>
                    <Rule className="mb-5" />
                    <p className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                      {reading.handedness} hand
                    </p>
                    <h2 className="serif text-[1.9rem] leading-none tracking-tight mt-2.5">
                      {reading.name}
                    </h2>

                    <div className="mt-6 flex items-baseline gap-2.5">
                      <span className="mono text-[1.6rem] leading-none tabular-nums text-primary">
                        {Math.round(reading.confidence * 100)}
                      </span>
                      <span className="mono text-[10px] text-foreground/45">% confidence</span>
                    </div>
                    {/*
                      A plain meter, so the number has a shape. Width is driven
                      from the same value the figure prints, not a second one.
                    */}
                    <div className="mt-3 h-px w-full bg-foreground/15">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round(reading.confidence * 100)}%` }}
                      />
                    </div>

                    <p className="serif text-[1rem] leading-[1.6] text-foreground/70 mt-6">
                      {reading.feedback}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
