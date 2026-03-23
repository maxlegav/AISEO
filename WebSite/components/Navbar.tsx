import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWaitlistModalStore } from "@/stores";

const isProduction = process.env.NEXT_PUBLIC_APP_STATE === "production";

const navLinks = [
  { label: "Features", href: "/#features", anchor: "#features" },
  { label: "Process", href: "/#process", anchor: "#process" },
  { label: "Pricing", href: "/#pricing", anchor: "#pricing" },
  { label: "FAQ", href: "/#faq", anchor: "#faq" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const { openWaitlistModal } = useWaitlistModalStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 relative">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Image
                src="/syb_logo_transparent.png"
                alt="logo"
                width={32}
                height={32}
              />
            </div>
            <span className="text-base font-semibold text-gray-900 tracking-tight">
              ShowYourBrand
            </span>
          </Link>

          {/* Desktop nav - centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const href = isHome && link.anchor ? link.anchor : link.href;
              const isActive =
                !link.anchor && router.pathname.startsWith(link.href);
              const El = isHome && link.anchor ? "a" : Link;
              if(link.label==="Pricing" && !isProduction){
                return (
                  <></>
                )
              }
              return (
                <El
                  key={link.label}
                  href={href}
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-purple-700 font-semibold"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                >
                  {link.label}
                </El>
              );
            })}
          </nav>

          {/* Desktop right actions */}
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Button variant="ghost" className="text-sm font-medium" onClick={openWaitlistModal}>
              Join Waitlist
            </Button>
            {isProduction && (
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-medium">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="ml-auto md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-6 shadow-lg">
          <nav className="flex flex-col gap-5 mb-6">
            {navLinks.map((link) => {
              const href = isHome && link.anchor ? link.anchor : link.href;
              const El = isHome && link.anchor ? "a" : Link;
              return (
                <El
                  key={link.label}
                  href={href}
                  className="text-base text-gray-700 hover:text-purple-600 transition-colors font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </El>
              );
            })}
          </nav>
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <Button
              className="w-full rounded-full bg-[#1E293B] hover:bg-[#334155] text-white font-semibold"
              onClick={() => { openWaitlistModal(); setMobileOpen(false); }}
            >
              Join Waitlist
            </Button>
            {isProduction && (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full text-sm font-medium">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
