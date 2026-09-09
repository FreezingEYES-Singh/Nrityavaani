"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { Eyebrow, Rule } from "@/components/ui/editorial";

/**
 * Paying by UPI.
 *
 * Two things about this page are deliberate.
 *
 * **The QR is drawn here.** It used to be fetched from api.qrserver.com by
 * putting the whole payment intent — payee VPA, amount, plan — in the query
 * string of a third-party URL. On a site whose stated claim is that nothing
 * leaves your device, handing a stranger's server the details of what you are
 * about to pay and to whom is not a detail. It also meant no QR at all if that
 * service was down or blocked.
 *
 * **The copy says only what is true.** The previous version promised "secure
 * end-to-end encryption", "instant activation after payment" and a "Startup
 * Pitch Secure Gateway". There is no backend here: nothing watches for the
 * payment, nothing activates, and no gateway of any kind is involved. This is
 * a UPI deep link and a QR of the same link — a request to pay, which a human
 * then has to reconcile.
 */

const PLANS: Record<string, { name: string; blurb: string }> = {
  sadhaka: { name: "Sadhaka", blurb: "For learning the vocabulary." },
  yoddha: { name: "Yoddha", blurb: "For daily practice with a record of it." },
  guru: { name: "Guru", blurb: "For an academy running classes." },
};

/** The payee. A real VPA, kept in one place so it is easy to find and change. */
const UPI_VPA = "8766231150@ptyes";
const PAYEE_NAME = "NrityaVaani";

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();

  const planId = (params.get("plan") ?? "yoddha").toLowerCase();
  const plan = PLANS[planId] ?? PLANS.yoddha;
  // Only digits: the amount goes into a payment URL, and anything else in it
  // either breaks the intent or changes what is being asked for.
  const price = (params.get("price") ?? "1499").replace(/[^\d]/g, "") || "1499";

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(UPI_VPA)}` +
    `&pn=${encodeURIComponent(PAYEE_NAME)}` +
    `&am=${encodeURIComponent(price)}` +
    `&cu=INR&tn=${encodeURIComponent(`${plan.name} subscription`)}`;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrFailed, setQrFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, upiUrl, {
      width: 264,
      margin: 1,
      errorCorrectionLevel: "M",
      // Fixed black on white regardless of theme: a QR read by a phone camera
      // needs its contrast, and a dark-mode QR is one many scanners refuse.
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => setQrFailed(true));
  }, [upiUrl]);

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/45 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to plans
        </button>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-12 lg:gap-16">
          {/* ------------------------------------------------------ the order */}
          <div>
            <Eyebrow tone="primary">checkout</Eyebrow>
            <h1 className="serif font-normal tracking-[-0.015em] leading-[1.08] text-[clamp(1.9rem,4.4vw,3rem)] mt-4">
              {plan.name}, ₹{price} a month.
            </h1>
            <p className="serif italic text-[1.05rem] text-foreground/55 mt-3">{plan.blurb}</p>

            <Rule className="my-9" />

            <dl className="space-y-4">
              <Row label="plan" value={plan.name} />
              <Row label="amount" value={`₹${price}`} />
              <Row label="billing" value="Monthly" />
              <Row label="payee" value={UPI_VPA} mono />
            </dl>

            <Rule className="my-9" />

            <div className="border-l-2 border-primary/40 pl-5">
              <Eyebrow tone="primary">before you pay</Eyebrow>
              <p className="serif text-[0.98rem] leading-[1.6] text-foreground/65 mt-2.5">
                This page raises a UPI payment request. It does not confirm one — nothing here
                watches your bank, so <strong className="font-semibold text-foreground">your
                plan will not switch over automatically</strong> when the transfer lands. Send
                the reference from your UPI app to{" "}
                <a
                  href="mailto:support@nrityavaani.com"
                  className="text-primary hover:underline underline-offset-4"
                >
                  support@nrityavaani.com
                </a>{" "}
                and it will be applied by hand.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------ the payment */}
          <div className="lg:pt-16">
            <div className="border border-foreground/12 rounded-sm p-8 sm:p-10 bg-background/60 backdrop-blur-sm">
              <Eyebrow>scan, or tap on a phone</Eyebrow>

              <div className="mt-7 flex justify-center">
                {qrFailed ? (
                  <p className="mono text-[11px] text-foreground/50 text-center leading-relaxed max-w-[24ch] py-10">
                    The code could not be drawn. Use the UPI ID below, or the button.
                  </p>
                ) : (
                  <div className="p-3 bg-white rounded-sm">
                    <canvas
                      ref={canvasRef}
                      className="block w-[min(60vw,264px)] h-[min(60vw,264px)]"
                      aria-label={`UPI payment code for ₹${price} to ${UPI_VPA}`}
                      role="img"
                    />
                  </div>
                )}
              </div>

              <p className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 text-center mt-6">
                {UPI_VPA}
              </p>

              <a
                href={upiUrl}
                className="mono mt-8 w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-primary text-black py-3.5 text-[11px] uppercase tracking-[0.16em] hover:bg-primary/85 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                Open a UPI app
              </a>

              <p className="mono text-[10px] leading-relaxed text-foreground/35 text-center mt-5">
                Opens your own UPI app with the amount filled in. You approve it there.
              </p>
            </div>

            <p className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/35 mt-7 text-center">
              Free plan needs no payment ·{" "}
              <Link href="/#pricing" className="text-primary hover:underline underline-offset-4">
                compare plans
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-foreground/10 pb-3.5">
      <dt className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">{label}</dt>
      <dd className={`${mono ? "mono text-[0.85rem]" : "text-[0.98rem]"} text-foreground/85`}>
        {value}
      </dd>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <p className="mono text-[11px] uppercase tracking-[0.2em] text-foreground/40">
            Loading checkout
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
