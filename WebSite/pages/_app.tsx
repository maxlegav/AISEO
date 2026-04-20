import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "@/styles/globals.css";
import {
  Inter,
  Playfair_Display,
  Space_Grotesk,
  Poppins,
  Lato,
  Cormorant_Garamond,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NotificationProvider } from "../components/NotificationSystem";
import { LanguageProvider } from "../components/LanguageContext";
import WaitlistModal from "../components/WaitlistModal";
import { useUserStore } from "@/stores";
import type { AppProps } from "next/app";

// Configure fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
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
          className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} ${poppins.variable} ${lato.variable} ${cormorantGaramond.variable} font-sans`}
        >
          <NotificationProvider position="top-right" maxNotifications={3}>
            <Component {...pageProps} />
            <WaitlistModal />
          </NotificationProvider>
          <Analytics />
        </div>
      </LanguageProvider>
    </SessionProvider>
  );
}
