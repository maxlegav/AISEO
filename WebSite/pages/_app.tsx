import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import {
  Inter,
  Playfair_Display,
  Space_Grotesk,
  Poppins,
  Lato,
} from "next/font/google";
import { NotificationProvider } from "../components/NotificationSystem";
import { LanguageProvider } from "../components/LanguageContext";
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

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // Rehydrate persisted stores on client mount (SSR-safe)
  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <div
          className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} ${poppins.variable} ${lato.variable} font-sans`}
        >
          <NotificationProvider position="top-right" maxNotifications={3}>
            <Component {...pageProps} />
          </NotificationProvider>
        </div>
      </LanguageProvider>
    </SessionProvider>
  );
}
