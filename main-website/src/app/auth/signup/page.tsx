"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Eyebrow, Rule } from "@/components/ui/editorial";
import { GoogleMark } from "@/components/shared/GoogleMark";

/**
 * Creating an account.
 *
 * This page used to carry a full name / email / password form whose submit
 * handler was `(e) => e.preventDefault()` — it collected three fields, created
 * nothing, and returned you to a page that looked identical. There is no
 * registration endpoint behind it and no credentials store: the credentials
 * provider authorises exactly one hard-coded demo account.
 *
 * So it offers the two things that actually work — Google, which really does
 * create an account, and the demo login for trying the app without one — and
 * says plainly that email sign-up is not built yet. That is a smaller page than
 * the one it replaces and a truthful one.
 */
export default function SignupPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const withGoogle = async () => {
    setPending(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Could not reach Google. Try again.");
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-32 pb-20 flex items-center">
      <div className="w-full max-w-md mx-auto">
        <Eyebrow tone="primary">create an account</Eyebrow>
        <h1 className="serif font-normal tracking-[-0.015em] leading-[1.1] text-[clamp(1.9rem,4.4vw,2.6rem)] mt-4">
          Start keeping your practice.
        </h1>
        <p className="serif text-[1.02rem] leading-[1.6] text-foreground/60 mt-3">
          Recognition and the full library work without an account — they run on your machine.
          An account is what gives your session history somewhere to belong.
        </p>

        <button
          type="button"
          onClick={withGoogle}
          disabled={pending}
          className="mono mt-9 w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-primary text-black py-3.5 text-[11px] uppercase tracking-[0.16em] hover:bg-primary/85 disabled:opacity-50 transition-colors"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleMark className="w-4 h-4" />}
          Continue with Google
        </button>

        {error && (
          <p role="alert" className="mono mt-4 text-[11px] text-rose-400">
            {error}
          </p>
        )}

        <Rule className="my-9" />

        <div className="border-l-2 border-foreground/15 pl-5">
          <Eyebrow>email sign-up</Eyebrow>
          <p className="serif text-[0.98rem] leading-[1.6] text-foreground/60 mt-2.5">
            Not built yet. Google is the only way to create a real account at the moment.
            To look around without one, sign in with the demo account below.
          </p>
        </div>

        <Rule className="my-9" />

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[0.92rem] text-foreground/55">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-foreground/35">
            demo@example.com · demo123
          </p>
        </div>

        <p className="mono text-[10px] leading-relaxed text-foreground/30 mt-10">
          By continuing you agree to the terms and the privacy policy.
        </p>
      </div>
    </div>
  );
}
