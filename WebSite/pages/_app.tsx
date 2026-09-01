import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "@/styles/globals.css";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "../components/NotificationSystem";
import { LanguageProvider } from "../components/LanguageContext";
import WaitlistModal from "../components/WaitlistModal";
import { useUserStore } from "@/stores";
import type { AppProps } from "next/app";

/**
 * Three typefaces, not six.
 *
 * The site used to load Inter, Playfair, Space Grotesk, Poppins, Lato and
 * Cormorant — Poppins and Lato were never referenced at all, and the mix is
 * most of what made the design read as generated rather than designed.
 *
 * Geist for text, Geist Mono for anything that is a measurement (a score, a
 * delta, an engine label — mono keeps digits aligned between rows), and
 * Instrument Serif for display headings.
 */
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // Rehydrate persisted stores on client mount (SSR-safe)
  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  // Smooth scroll with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <SessionProvider session={session}>
      <LanguageProvider>
    
        <div
          className={`${sans.variable} ${mono.variable} ${serif.variable} font-sans`}
        >
          <NotificationProvider position="top-right" maxNotifications={3}>
            <Component {...pageProps} />
            <WaitlistModal />
          </NotificationProvider>
          <Toaster position="top-right" />
          <Analytics />
        </div>
      </LanguageProvider>
    </SessionProvider>
  );
}
