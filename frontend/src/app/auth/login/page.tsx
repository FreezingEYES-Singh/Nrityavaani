"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Eyebrow, Rule } from "@/components/ui/editorial";
import { GoogleMark } from "@/components/shared/GoogleMark";

export default function LoginPage() {
  const [pending, setPending] = useState<"credentials" | "google" | null>(null);
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("error");
      if (authError === "Configuration") {
        setError("Google Sign-In is not configured in this environment. Use the Demo Account (demo@example.com / demo123) below.");
      } else if (authError) {
        setError("Authentication could not be completed. Please sign in with the Demo Account.");
      }
    }
  }, []);

  const withGoogle = async () => {
    setPending("google");
    setError("");
    try {
      const res = await signIn("google", { callbackUrl: "/", redirect: false });
      if (res?.error) {
        setError("Google Sign-In is not configured in this environment. Use the Demo Account (demo@example.com / demo123) below.");
        setPending(null);
      }
    } catch {
      setError("Google Sign-In is not configured. Use the Demo Account below.");
      setPending(null);
    }
  };

  const withPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPending("credentials");
    setError("");
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("That email and password do not match an account.");
        setPending(null);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong signing in.");
      setPending(null);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-32 pb-20 flex items-center">
      <div className="w-full max-w-md mx-auto">
        <Eyebrow tone="primary">sign in</Eyebrow>
        <h1 className="serif font-normal tracking-[-0.015em] leading-[1.1] text-[clamp(1.9rem,4.4vw,2.6rem)] mt-4">
          Welcome back.
        </h1>
        <p className="serif text-[1.02rem] leading-[1.6] text-foreground/60 mt-3">
          Your practice history lives in this browser. Signing in is what ties it to you.
        </p>

        <form className="mt-10 space-y-5" onSubmit={withPassword}>
          <Field
            label="email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            label="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {/*
            Announced, not just coloured: a message that only exists as red text
            is not read out to anyone using a screen reader.
          */}
          {error && (
            <p role="alert" className="mono text-[11px] text-rose-400 leading-relaxed">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-primary bg-transparent"
              />
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-foreground/45 group-hover:text-foreground/70 transition-colors">
                Remember me
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={pending !== null}
            className="mono w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-black py-3.5 text-[11px] uppercase tracking-[0.16em] hover:bg-primary/85 disabled:opacity-50 transition-colors"
          >
            {pending === "credentials" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <Rule className="flex-1" />
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">or</span>
          <Rule className="flex-1" />
        </div>

        {/*
          Google only. There was a GitHub button here with no handler on it at
          all, and no GitHub provider configured to give it one — a control that
          looked available and silently did nothing.
        */}
        <button
          type="button"
          onClick={withGoogle}
          disabled={pending !== null}
          className="mono w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-foreground/25 py-3.5 text-[11px] uppercase tracking-[0.16em] text-foreground/80 hover:border-primary/60 hover:text-primary disabled:opacity-50 transition-colors"
        >
          {pending === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GoogleMark className="w-4 h-4" />
          )}
          Continue with Google
        </button>

        <Rule className="mt-10 mb-6" />

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[0.92rem] text-foreground/55">
            No account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline underline-offset-4">
              Create one
            </Link>
          </p>
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-foreground/35">
            demo@example.com · demo123
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * A labelled field.
 *
 * The label is a real `<label>` rather than placeholder text. Placeholders
 * vanish the moment you type, so a form built from them leaves you filling in
 * boxes with no idea what any of them were for.
 */
function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-2 w-full bg-transparent border-0 border-b border-foreground/20 focus:border-primary py-2.5 text-[0.95rem] focus:outline-none transition-colors"
      />
    </label>
  );
}
