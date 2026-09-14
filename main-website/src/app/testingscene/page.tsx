"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { storedAngles, type Sex } from "@/components/three/figureRig";
import { MAX_DIST, MIN_DIST } from "@/components/three/NamasteFigure";
import type { Pose } from "@/components/three/figureConstraints";
import type { PoseReport } from "@/components/three/NamasteFigure";

// three.js stays off the server render and off the critical path, the same way
// the hero's hand does.
const NamasteFigure = dynamic(() => import("@/components/three/NamasteFigure"), {
  ssr: false,
  loading: () => null,
});

const OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Man" },
  { value: "female", label: "Woman" },
];

const AXES = ["x", "y", "z"] as const;

const chip =
  "mono rounded-full border px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function TestingScenePage() {
  const [sex, setSex] = useState<Sex>("male");
  const [showBody, setShowBody] = useState(false);
  const [showJoints, setShowJoints] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Pose>({});
  const [report, setReport] = useState<PoseReport | null>(null);
  const [zoom, setZoom] = useState(4.2);

  // Stable, so the scene is not torn down and rebuilt on every render.
  const onReport = useCallback((r: PoseReport) => setReport(r), []);
  const onView = useCallback(
    (set: (yaw: number, pitch: number, dist?: number) => void) => {
      (window as unknown as { __nvView?: typeof set }).__nvView = set;
    },
    [],
  );

  // What the selected joint is set to: an edit if one has been made, otherwise
  // whatever the stored pose already says for it.
  const current = selected
    ? { x: 0, y: 0, z: 0, ...(overrides[selected] ?? storedAngles(selected, sex)) }
    : null;

  const setAxis = (axis: (typeof AXES)[number], value: number) => {
    if (!selected) return;
    setOverrides((o) => ({
      ...o,
      [selected]: { ...(o[selected] ?? storedAngles(selected, sex)), [axis]: value },
    }));
  };

  const asCode = Object.entries(overrides)
    .map(
      ([bone, a]) =>
        `${bone}: { x: ${Math.round(a.x ?? 0)}, y: ${Math.round(a.y ?? 0)}, z: ${Math.round(a.z ?? 0)} },`,
    )
    .join("\n");

  const edits = Object.keys(overrides).length;

  return (
    <div className="min-h-screen px-6 pt-28 pb-16">
      <div className="max-w-6xl mx-auto">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-primary">
          testing scene
        </p>
        <h1 className="serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3.2rem)] mt-4">
          Anjali mudra, on a rigged figure.
        </h1>
        <p className="serif mt-5 max-w-[58ch] text-[1.02rem] leading-[1.66] text-foreground/70">
          A scratch page for driving the full-body rig: the figure is posed by
          rotating its bones, not by playing a baked animation. Left-drag to
          move around, right-drag to turn the model, scroll or use the slider to
          zoom. Click a joint to edit it.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Figure"
            className="inline-flex rounded-full border border-foreground/20 p-1"
          >
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={sex === o.value}
                onClick={() => setSex(o.value)}
                className={`mono rounded-full px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  sex === o.value
                    ? "bg-primary text-black"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowJoints((v) => !v)}
            aria-pressed={showJoints}
            className={`${chip} ${showJoints ? "border-primary text-primary" : "border-foreground/20 text-foreground/60 hover:text-foreground"}`}
          >
            {showJoints ? "Hide joints" : "Show joints"}
          </button>

          <button
            type="button"
            onClick={() => setShowBody((v) => !v)}
            aria-pressed={showBody}
            className={`${chip} ${showBody ? "border-primary text-primary" : "border-foreground/20 text-foreground/60 hover:text-foreground"}`}
          >
            {showBody ? "Hide body volume" : "Show body volume"}
          </button>

          {edits > 0 && (
            <button
              type="button"
              onClick={() => setOverrides({})}
              className={`${chip} border-rose-500/30 text-rose-400 hover:border-rose-400`}
            >
              Reset {edits} edit{edits === 1 ? "" : "s"}
            </button>
          )}

          {/*
            Zoom as a slider as well as the wheel. Reversed, so dragging right
            moves the camera in — a "zoom" control that goes backwards when you
            push it forwards reads wrong however the maths is written.
          */}
          <label className="mono flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-foreground/45">
            Zoom
            <input
              type="range"
              min={MIN_DIST}
              max={MAX_DIST}
              step={0.02}
              value={MIN_DIST + MAX_DIST - zoom}
              onChange={(e) => setZoom(MIN_DIST + MAX_DIST - Number(e.target.value))}
              className="w-40 accent-primary"
              aria-label="Zoom"
            />
            <span className="tabular-nums text-foreground/70 w-10 text-right">
              {(4.2 / zoom).toFixed(1)}x
            </span>
          </label>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] items-start">
          <div className="rounded-sm border border-foreground/12 bg-foreground/[0.02]">
            <NamasteFigure
              sex={sex}
              showBody={showBody}
              showJoints={showJoints}
              overrides={overrides}
              selected={selected}
              onSelect={setSelected}
              onReport={onReport}
              onView={onView}
              zoom={zoom}
              onZoom={setZoom}
              className="w-full h-[clamp(26rem,68vh,40rem)]"
            />
          </div>

          {/*
            The joint editor. Angles are degrees of rotation on top of the rest
            pose, in the bone's own space — the same numbers the pose table
            holds, so anything dialled in here pastes straight back into it.
          */}
          <aside className="rounded-sm border border-foreground/12 p-5">
            {!selected || !current ? (
              <p className="mono text-[10px] uppercase leading-[1.9] tracking-[0.16em] text-foreground/45">
                Click a joint on the figure to edit it.
              </p>
            ) : (
              <>
                <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  {selected}
                </p>
                <p className="mono mt-1.5 text-[10px] uppercase tracking-[0.14em] text-foreground/40">
                  degrees on the rest pose
                </p>

                <div className="mt-6 space-y-5">
                  {AXES.map((axis) => (
                    <div key={axis}>
                      <div className="mono flex items-baseline justify-between text-[10px] uppercase tracking-[0.16em]">
                        <span className="text-foreground/45">{axis}</span>
                        <input
                          type="number"
                          value={Math.round(current[axis] ?? 0)}
                          onChange={(e) => setAxis(axis, Number(e.target.value) || 0)}
                          className="mono w-16 rounded-[1px] border border-foreground/20 bg-transparent px-2 py-1 text-right text-[11px] tabular-nums focus:border-primary focus:outline-none"
                        />
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={current[axis] ?? 0}
                        onChange={(e) => setAxis(axis, Number(e.target.value))}
                        className="mt-2 w-full accent-primary"
                        aria-label={`${selected} ${axis} rotation`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOverrides((o) => {
                        const next = { ...o };
                        delete next[selected];
                        return next;
                      })
                    }
                    className="mono rounded-[1px] border border-foreground/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground/60 hover:text-foreground"
                  >
                    Revert joint
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="mono rounded-[1px] border border-foreground/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground/60 hover:text-foreground"
                  >
                    Deselect
                  </button>
                </div>
              </>
            )}

            {edits > 0 && (
              <div className="mt-6 border-t border-foreground/12 pt-5">
                <p className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45">
                  Your edits
                </p>
                <pre className="mono mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-[1.7] text-foreground/70">
                  {asCode}
                </pre>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(asCode)}
                  className="mono mt-4 w-full rounded-[1px] bg-primary px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-black"
                >
                  Copy values
                </button>
              </div>
            )}
          </aside>
        </div>

        {/*
          The constraint readout. It says what the rules had to change, because
          a pose that was quietly walked back is otherwise indistinguishable
          from the pose that was asked for.
        */}
        <dl className="mono mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-foreground/12 pt-5 text-[10px] uppercase tracking-[0.16em]">
          <div>
            <dt className="text-foreground/45">Figure</dt>
            <dd className="mt-1.5 text-foreground/80">
              {sex === "male" ? "Male" : "Female"} · 60 bones
            </dd>
          </div>
          <div>
            <dt className="text-foreground/45">Inside the body</dt>
            <dd className={`mt-1.5 ${report?.violations.length ? "text-rose-400" : "text-emerald-400"}`}>
              {report ? (report.violations.length ? `${report.violations.length} point(s)` : "Clear") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/45">Joint limits hit</dt>
            <dd className={`mt-1.5 ${report?.clamped.length ? "text-amber-400" : "text-foreground/80"}`}>
              {report ? (report.clamped.length ? `${report.clamped.length} clamped` : "None") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/45">Pose applied</dt>
            <dd className="mt-1.5 text-foreground/80 tabular-nums">
              {report
                ? `L ${Math.round(report.amount.L * 100)}% · R ${Math.round(report.amount.R * 100)}%`
                : "—"}
            </dd>
          </div>
        </dl>

        {report && report.initial.length > 0 && (
          <p className="mono mt-4 text-[10px] uppercase tracking-[0.14em] text-foreground/50">
            <span className="text-foreground/35">Eased back because: </span>
            {report.initial
              .map((v) => `${v.probe}.${v.side} ${(v.depth * 100).toFixed(0)}% in`)
              .join("  ·  ")}
          </p>
        )}

        {report && report.clamped.length > 0 && (
          <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-amber-400/80">
            {report.clamped
              .map((c) => `${c.bone}.${c.axis} ${c.asked}° → ${c.used}°`)
              .join("  ·  ")}
          </p>
        )}
      </div>
    </div>
  );
}
