"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { StatsService, type PracticeSession } from "@/lib/services/StatsService";
import { MUDRAS } from "@/lib/constants/mudras";
import { Eyebrow, Rule } from "@/components/ui/editorial";
import { cn } from "@/lib/utils";

/** A mudra counts as held once you have cleared this in a session. */
const MASTERY = 90;

const TABS = ["Overview", "History", "Mastered", "Account"] as const;
type Tab = (typeof TABS)[number];

export default function DashboardPage() {
  const { data: auth } = useSession();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [tab, setTab] = useState<Tab>("Overview");
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    let stored = StatsService.getSessions();

    // The demo account is seeded so the dashboard has something to show. A real
    // account is not: inventing history for someone would make every number on
    // this page a lie.
    if (auth?.user?.email === "demo@example.com" && stored.length === 0) {
      [
        { mudraId: "mayura", mudraName: "Mayura", accuracy: 98, duration: 300 },
        { mudraId: "ardhapataka", mudraName: "Ardhapataka", accuracy: 95, duration: 200 },
        { mudraId: "pataka", mudraName: "Pataka", accuracy: 92, duration: 120 },
        { mudraId: "tripataka", mudraName: "Tripataka", accuracy: 88, duration: 45 },
        { mudraId: "kartarimukha", mudraName: "Kartarimukha", accuracy: 85, duration: 60 },
      ].forEach((d) => StatsService.saveSession(d));
      stored = StatsService.getSessions();
    }

    // localStorage cannot be read during render — it does not exist on the
    // server — so reading it on mount and setting state is the only way in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(stored);
  }, [auth]);

  const firstName = auth?.user?.name?.split(" ")[0] ?? "there";
  const mastered = useMemo(() => sessions.filter((s) => s.accuracy >= MASTERY), [sessions]);

  /**
   * What to practise next, derived from what actually happened.
   *
   * This panel used to be three fixed cards — "You're close to 90% accuracy",
   * "New mudra unlocked!" — shown to everyone including someone who had never
   * practised anything. Now it reads the sessions, and when there is nothing to
   * say it says so instead.
   */
  const suggestions = useMemo(() => {
    const out: { title: string; body: string; href: string }[] = [];

    const close = sessions
      .filter((s) => s.accuracy >= 75 && s.accuracy < MASTERY)
      .sort((a, b) => b.accuracy - a.accuracy)[0];
    if (close) {
      out.push({
        title: `Finish ${close.mudraName}`,
        body: `Your best is ${close.accuracy}%. ${MASTERY}% marks it held.`,
        href: `/practice/${close.mudraId}`,
      });
    }

    const practised = new Set(sessions.map((s) => s.mudraId));
    const untouched = MUDRAS.find((m) => !practised.has(m.slug));
    if (untouched) {
      out.push({
        title: `Try ${untouched.name}`,
        body: `${untouched.meaning}. You have not practised this one yet.`,
        href: `/practice/${untouched.slug}`,
      });
    }

    const weakest = [...sessions].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (weakest && weakest.accuracy < 75) {
      out.push({
        title: `Go back to ${weakest.mudraName}`,
        body: `Your lowest reading, at ${weakest.accuracy}%.`,
        href: `/practice/${weakest.mudraId}`,
      });
    }

    return out.slice(0, 3);
  }, [sessions]);

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <Eyebrow tone="primary">dashboard</Eyebrow>
            <h1 className="serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3rem)] mt-4">
              Welcome back, {firstName}.
            </h1>
            <p className="serif text-[1.02rem] leading-[1.6] text-foreground/60 mt-3 max-w-[52ch]">
              {sessions.length > 0
                ? `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"} recorded, all of it stored in this browser.`
                : "Nothing recorded yet. Practise a mudra and it will show up here."}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setShowAccount(false);
                }}
                aria-current={tab === t ? "page" : undefined}
                className={cn(
                  "mono text-[10px] uppercase tracking-[0.16em] transition-colors",
                  tab === t ? "text-primary" : "text-foreground/45 hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>

        <Rule className="mt-10 mb-12" />

        {tab === "Overview" && (
          <div className="space-y-14">
            <DashboardStats />
            <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-10 lg:gap-14">
              <section>
                <Eyebrow>recent</Eyebrow>
                <SessionList sessions={sessions.slice(0, 5)} empty="No sessions yet." />
              </section>
              <section>
                <Eyebrow>what to do next</Eyebrow>
                {suggestions.length > 0 ? (
                  <ul className="mt-6">
                    {suggestions.map((s) => (
                      <li key={s.title} className="border-t border-foreground/12">
                        <Link href={s.href} className="block py-4 group">
                          <p className="text-[0.98rem] font-medium group-hover:text-primary transition-colors">
                            {s.title}
                          </p>
                          <p className="serif text-[0.92rem] leading-[1.5] text-foreground/55 mt-1">
                            {s.body}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="serif italic text-[0.98rem] text-foreground/45 mt-6 max-w-[32ch]">
                    Nothing to suggest yet — practise a few mudras and this will fill in.
                  </p>
                )}
              </section>
            </div>
          </div>
        )}

        {tab === "History" && (
          <section>
            <Eyebrow>every session</Eyebrow>
            <SessionList sessions={sessions} empty="No sessions recorded yet." />
          </section>
        )}

        {tab === "Mastered" && (
          <section>
            <Eyebrow>held above {MASTERY}%</Eyebrow>
            {mastered.length > 0 ? (
              <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                {mastered.map((s) => (
                  <li key={s.id} className="border-t border-foreground/12">
                    <Link href={`/library/${s.mudraId}`} className="block py-4 group">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[1rem] font-medium group-hover:text-primary transition-colors">
                          {s.mudraName}
                        </span>
                        <span className="mono text-[0.9rem] tabular-nums text-primary">
                          {s.accuracy}%
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="serif italic text-[0.98rem] text-foreground/45 mt-6 max-w-[38ch]">
                Reach {MASTERY}% on any mudra and it will be listed here.
              </p>
            )}
          </section>
        )}

        {tab === "Account" && (
          <section className="max-w-2xl">
            {!showAccount ? (
              <>
                <Eyebrow>account</Eyebrow>
                <h2 className="serif text-[1.8rem] leading-tight tracking-tight mt-4">
                  {auth?.user?.name ?? "Not signed in"}
                </h2>
                <p className="mono text-[11px] text-foreground/45 mt-2">
                  {auth?.user?.email ?? "—"}
                </p>

                <Rule className="my-9" />

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAccount(true)}
                    className="w-full flex items-center justify-between py-4 border-t border-foreground/12 group"
                  >
                    <span className="mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 group-hover:text-primary transition-colors">
                      Account details
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "Delete all practice history stored in this browser? This cannot be undone.",
                        )
                      ) {
                        StatsService.clearAll();
                        setSessions([]);
                      }
                    }}
                    className="w-full text-left py-4 border-t border-foreground/12"
                  >
                    <span className="mono text-[11px] uppercase tracking-[0.16em] text-rose-400">
                      Delete practice history
                    </span>
                    <span className="block serif text-[0.92rem] text-foreground/50 mt-1.5">
                      Removes every session from this browser. Nothing is stored anywhere else,
                      so there is no copy to restore from.
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowAccount(false)}
                  className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/45 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Account
                </button>
                <h2 className="serif text-[1.8rem] leading-tight tracking-tight mt-6">
                  Account details
                </h2>
                <dl className="mt-8">
                  <Detail label="name" value={auth?.user?.name ?? "—"} />
                  <Detail label="email" value={auth?.user?.email ?? "—"} />
                  {/*
                    Derived, not asserted. This row read "Google OAuth" for
                    everyone, including anyone signed in with the demo password.
                  */}
                  <Detail
                    label="signed in with"
                    value={auth?.user?.email === "demo@example.com" ? "Demo account" : "Google"}
                  />
                  <Detail label="history stored in" value="This browser only" />
                </dl>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3.5 border-t border-foreground/12">
      <dt className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">{label}</dt>
      <dd className="text-[0.98rem] text-foreground/85 text-right">{value}</dd>
    </div>
  );
}

function SessionList({ sessions, empty }: { sessions: PracticeSession[]; empty: string }) {
  if (sessions.length === 0) {
    return <p className="serif italic text-[0.98rem] text-foreground/45 mt-6">{empty}</p>;
  }
  return (
    <ul className="mt-6">
      {sessions.map((s) => (
        <li key={s.id} className="border-t border-foreground/12">
          {/* Really a link now. These rows carried `cursor-pointer` and a hover
              state with no handler behind them — they looked clickable and were
              not. */}
          <Link
            href={`/library/${s.mudraId}`}
            className="flex items-center justify-between gap-6 py-4 group"
          >
            <div className="min-w-0">
              <p className="text-[1rem] font-medium group-hover:text-primary transition-colors truncate">
                {s.mudraName}
              </p>
              <p className="mono text-[10px] uppercase tracking-[0.14em] text-foreground/40 mt-1.5">
                {formatDistanceToNow(s.timestamp)} ago · {Math.floor(s.duration)}s
              </p>
            </div>
            <span className="mono text-[1.15rem] tabular-nums text-foreground/85 shrink-0">
              {s.accuracy}%
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
