import type { Metadata } from "next";
import { Inter, Outfit, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SiteBackdrop from "@/components/layout/SiteBackdrop";
import Footer from "@/components/layout/Footer";
import LiveChat from "@/components/shared/LiveChat";
import SiteLoader from "@/components/shared/SiteLoader";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
// The editorial pair. Newsreader carries the section headlines and the mudra
// meanings; JetBrains Mono carries labels, figures and units, where a fixed
// advance is what makes a column of numbers scan as a column.
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "NrityaVaani | Real-Time Mudra Recognition",
  description: "Advanced platform for Bharatanatyam mudra recognition and classical dance training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${newsreader.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground selection:bg-primary/30 selection:text-primary min-h-screen">
        <div className="mesh-gradient" />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Navbar />
            {/* Behind every page but the landing page, which runs its own. */}
            <SiteBackdrop />
            <main className="min-h-screen relative z-10">
              {children}
            </main>
            <Footer />
            <LiveChat />
            <Toaster position="bottom-right" theme="dark" richColors />
            {/*
              The intro sits at body level, not inside <main>. <main> is
              `relative z-10`, which makes it a stacking context, so anything
              rendered inside it — however high its z-index — still paints under
              the navbar's z-50 sibling. Out here it can genuinely cover the page.
            */}
            <SiteLoader />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
