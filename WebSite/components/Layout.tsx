import "react-tooltip/dist/react-tooltip.css";
import { ReactNode, useEffect, useState } from "react";
import { Inter } from "next/font/google";
import NextNProgress from "nextjs-progressbar";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import { LanguageProvider } from "./LanguageContext";

import { Tooltip } from "react-tooltip";
import ErrorBoundary from "./ErrorBoundary";

const font = Inter({ subsets: ["latin"] });

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

const Layout = ({
  children,
  title = "ShowYourBrand - AI SEO Optimization Platform",
  description = "Optimize your website for AI search engines with advanced SEO analysis and recommendations.",
}: LayoutProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <main className="flex-grow">
          <div>
            {/* Most errors are catched in ErrorBondary to show a nice error page */}
            <ErrorBoundary>
              <style jsx global>{`
                html {
                  font-family: ${font.style.fontFamily};
                }
              `}</style>
              {/* Automatically show a progress bar at the top when navigating between pages */}
              <NextNProgress
                color="gray-800"
                options={{ showSpinner: false }}
              />
              {children}
            </ErrorBoundary>
          </div>
        </main>

        {/* Show Success/Error messages anywhere from the app with toast() */}
        {isMounted && (
          <Toaster
            toastOptions={{
              duration: 3000,
            }}
          />
        )}

        {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
        <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm" />
      </div>
    </LanguageProvider>
  );
};

export default Layout;
