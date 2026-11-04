import TagSEO from "@/components/TagSEO";
import TagSchema from "@/components/TagSchema";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, Linkedin, Mail, Plus, Minus, Twitter } from "lucide-react";
import { useWaitlistModalStore } from "@/stores";
import SybMark from "@/components/icons/SybMark";
import DashboardPreview from "@/components/landing/DashboardPreview";
import { AnswerSection, FeatureRows, GeoVsSeo } from "@/components/landing/LandingSections";

const aiModels = [
  { name: "ChatGPT", logo: "/logos/openai-logo.svg", text: "/logos/openai-text.svg" },
  { name: "Claude", logo: "/logos/claude-logo.svg", text: "/logos/claude-text.svg" },
  { name: "Gemini", logo: "/logos/gemini-logo.svg", text: "/logos/gemini-text.svg" },
  { name: "Perplexity", logo: "/logos/perplexity-logo.svg", text: "/logos/perplexity-text.svg" },
  { name: "Grok", logo: "/logos/grok-logo.png", text: "/logos/grok-text.svg" },
];

// Animated AI Model Marquee with real logos
const AIModelMarquee = () => (
  <div className="mt-8 w-full">
    <p className="text-center text-gray-500 text-sm font-medium mb-4 tracking-wide">
      MENTIONED BY ALL MAJOR AI ENGINES
    </p>

    <div className="relative overflow-hidden py-4 lg:py-6 bg-white/60 backdrop-blur-sm rounded-full mx-auto max-w-[280px] sm:max-w-sm md:max-w-xl lg:max-w-4xl border border-white/50 shadow-sm">
      <div className="flex animate-marquee items-center w-max">
        {[...aiModels, ...aiModels].map((model, i) => (
          <div
            key={i}
            className="flex items-center gap-2 md:gap-3 mx-4 md:mx-6 lg:mx-10 flex-shrink-0"
          >
            <Image
              src={model.logo}
              alt={`${model.name} logo`}
              width={32}
              height={32}
              className="h-7 w-7 lg:h-12 lg:w-12 object-contain"
            />
            <Image
              src={model.text}
              alt={model.name}
              width={100}
              height={24}
              className="h-5 lg:h-8 w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const plans = [
  {
    name: "Solo",
    price: 29,
    for: "Freelancers and consultants",
    features: ["2 brands", "3 AI engines", "Weekly runs", "Competitors and cited sources", "Email alerts"],
    cta: "Start with Solo",
    href: "/signup?plan=solo",
  },
  {
    name: "Pro",
    price: 79,
    for: "Marketing teams",
    features: ["10 brands", "All 4 AI engines", "Daily runs on 2 brands", "12-week history per engine", "Per-engine recommendations"],
    cta: "Start with Pro",
    href: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: 149,
    for: "Agencies with 10 to 20 clients",
    features: ["Unlimited brands", "All 4 AI engines", "Daily runs on 5 brands", "Multi-client dashboard", "White-label PDF reports"],
    cta: "Start with Agency",
    href: "/signup?plan=agency",
  },
];

const faqs = [
  {
    q: "What is GEO?",
    a: "Generative Engine Optimization: making sure AI assistants such as ChatGPT, Claude, Perplexity and Gemini name your brand when someone asks them for a recommendation. It complements SEO; it does not replace it.",
  },
  {
    q: "How does the monitoring work?",
    a: "You add your brand, your competitors and the questions your buyers ask. ShowYourBrand sends those questions to each engine on a fixed schedule, stores every answer, and tracks whether you are cited, in which position, and from which sources.",
  },
  {
    q: "Why a score per engine?",
    a: "Each engine builds its answers from different sources, so a single number hides where you are missing. The per-engine score tells you where to act first.",
  },
  {
    q: "Can I see it before signing up?",
    a: "Yes. The demo dashboard opens without an account or a card.",
  },
];

function FAQItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-ink-200">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base md:text-lg font-medium text-ink-900">{q}</span>
        {open ? <Minus className="h-4 w-4 shrink-0 text-ink-500" /> : <Plus className="h-4 w-4 shrink-0 text-ink-500" />}
      </button>
      {open && <p className="pb-5 pr-10 leading-relaxed text-ink-600">{a}</p>}
    </div>
  );
}

export default function Home() {
  const { openWaitlistModal } = useWaitlistModalStore();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <TagSEO
        canonicalSlug=""
        title="ShowYourBrand | GEO monitoring for ChatGPT, Claude, Perplexity & Gemini"
        description="See how often ChatGPT, Claude, Perplexity and Gemini cite your brand, every week. A score per engine, your competitors on the same prompts, and the sources AI reads."
        keywords="GEO monitoring, generative engine optimization, AI visibility tracking, ChatGPT monitoring, brand mentions AI, LLM visibility"
        og={{
          title: "ShowYourBrand | Is your brand cited by AI?",
          description:
            "Track your brand across ChatGPT, Claude, Perplexity and Gemini, week after week, against your competitors.",
          image: `https://showyourbrand.app/og-homepage.jpeg`,
          url: "https://showyourbrand.app/",
        }}
      />
      <TagSchema />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @media (min-width: 1024px) {
          .animate-marquee {
            animation-duration: 18s;
          }
        }
      `}</style>

      <main className="bg-paper text-ink-900">
        <Navbar />

        {/* Hero */}
        <section className="px-4 pt-36 pb-20 md:pt-44 md:pb-28">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-[1.02] tracking-tight">
              Your brand,{" "}
              <em className="italic text-ink-500">cited by AI</em>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-ink-600">
              When a buyer asks ChatGPT which tool to pick, the answer names two or three brands.
              ShowYourBrand tells you, every week, whether yours is one of them, and what to change
              when it is not.
            </p>
            <AIModelMarquee />
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openWaitlistModal}
                className="rounded-full bg-ink-900 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-ink-800"
              >
                Book a demo
              </button>
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 rounded-full border border-ink-300 px-8 py-4 text-base font-semibold text-ink-900 transition-colors hover:border-ink-900"
              >
                See the live dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <DashboardPreview />

        {/* Video */}
        <section className="px-4 py-20 md:py-28">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-heading text-4xl md:text-5xl font-medium text-center mb-10">
              The product in 25 seconds
            </h2>
            <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-900">
              <video
                ref={videoRef}
                className="aspect-video w-full object-cover"
                controls
                muted
                playsInline
                preload="metadata"
              >
                <source src="/SYBvideo.mov" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        <AnswerSection />
        <FeatureRows />
        <GeoVsSeo />

        {/* Pricing */}
        <section id="pricing" className="px-4 py-20 md:py-28 border-t border-ink-200">
          <div className="container mx-auto max-w-6xl">
            <h2 className="font-heading text-4xl md:text-5xl font-medium">Pricing</h2>
            <p className="mt-3 text-ink-600">Start solo, scale to an agency plan when you manage clients.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-2xl p-7 ${
                    plan.highlighted ? "bg-ink-900 text-white" : "border border-ink-200 bg-paper-raised"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {plan.highlighted && <span className="text-xs text-ink-300">Most chosen</span>}
                  </div>
                  <p className={`mt-1 text-sm ${plan.highlighted ? "text-ink-300" : "text-ink-500"}`}>{plan.for}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-data text-4xl font-semibold">€{plan.price}</span>
                    <span className={plan.highlighted ? "text-ink-300" : "text-ink-500"}>/month</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-white" : "text-ink-900"}`} />
                        <span className={plan.highlighted ? "text-ink-100" : "text-ink-700"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-white text-ink-900 hover:bg-ink-100"
                        : "border border-ink-300 text-ink-900 hover:border-ink-900"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-ink-500">
              Need a custom plan for your agency?{" "}
              <button type="button" onClick={openWaitlistModal} className="font-semibold text-ink-900 underline">
                Book a call
              </button>
              .
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-4 py-20 md:py-28 border-t border-ink-200">
          <div className="container mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_2fr]">
            <h2 className="font-heading text-4xl md:text-5xl font-medium">Questions</h2>
            <div className="border-t border-ink-200">
              {faqs.map((f, i) => (
                <FAQItem
                  key={f.q}
                  q={f.q}
                  a={f.a}
                  open={openFAQ === i}
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA + footer */}
        <footer className="bg-ink-900 px-4 pt-20 pb-10 text-white">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <h2 className="font-heading text-4xl md:text-6xl font-medium leading-tight max-w-xl">
                Find out what AI says about you.
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openWaitlistModal}
                  className="rounded-full bg-white px-8 py-4 text-base font-semibold text-ink-900 transition-colors hover:bg-ink-100"
                >
                  Book a demo
                </button>
                <Link
                  href="/demo"
                  className="rounded-full border border-white/30 px-8 py-4 text-center text-base font-semibold transition-colors hover:border-white"
                >
                  See the live dashboard
                </Link>
              </div>
            </div>

            <div className="mt-20 flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-ink-300 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="flex items-center gap-2 text-white">
                <SybMark className="h-6 w-6" />
                <span className="font-semibold">ShowYourBrand</span>
              </Link>
              <nav className="flex flex-wrap gap-6">
                <Link href="/blog" className="hover:text-white">Blog</Link>
                <Link href="/login" className="hover:text-white">Login</Link>
                <Link href="/privacy" className="hover:text-white">Privacy</Link>
                <Link href="/terms" className="hover:text-white">Terms</Link>
              </nav>
              <div className="flex items-center gap-4">
                <a href="https://x.com/showyourbrand_" aria-label="X" className="hover:text-white"><Twitter className="h-4 w-4" /></a>
                <a href="https://www.linkedin.com/company/showyourbrand/" aria-label="LinkedIn" className="hover:text-white"><Linkedin className="h-4 w-4" /></a>
                <a href="mailto:contact@showyourbrand.app" aria-label="Email" className="hover:text-white"><Mail className="h-4 w-4" /></a>
                <span>© 2026 ShowYourBrand</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
