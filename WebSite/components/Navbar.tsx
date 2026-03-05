import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useWaitlistModalStore } from "@/stores";

const isProduction = process.env.NEXT_PUBLIC_APP_STATE === "production";

const navLinks = [
  { label: "Features", href: "/#features", anchor: "#features" },
  { label: "Process", href: "/#process", anchor: "#process" },
  ...(isProduction
    ? [{ label: "Pricing", href: "/#pricing", anchor: "#pricing" }]
    : []),
  { label: "FAQ", href: "/#faq", anchor: "#faq" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const { openWaitlistModal } = useWaitlistModalStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 relative">
          <Link href="/" className="flex items-center gap-2">
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

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const href = isHome && link.anchor ? link.anchor : link.href;
              const isActive =
                !link.anchor && router.pathname.startsWith(link.href);
              const El = isHome && link.anchor ? "a" : Link;

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

          <div className="ml-auto flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
