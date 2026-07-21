import TagSEO from "@/components/TagSEO";
import TagSchema from "@/components/TagSchema";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useWaitlistModalStore } from "@/stores";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Twitter,
  Linkedin,
  Mail,
  Eye,
  Target,
  Zap,
  Star,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

// AI Models with their actual logo files
const aiModels = [
  {
    name: "OpenAI",
    logo: "/logos/openai-logo.svg",
    text: "/logos/openai-text.svg",
  },
  {
    name: "Claude",
    logo: "/logos/claude-logo.svg",
    text: "/logos/claude-text.svg",
  },
  {
    name: "Gemini",
    logo: "/logos/gemini-logo.svg",
    text: "/logos/gemini-text.svg",
  },
  {
    name: "Perplexity",
    logo: "/logos/perplexity-logo.svg",
    text: "/logos/perplexity-text.svg",
  },

  { name: "Grok", logo: "/logos/grok-logo.png", text: "/logos/grok-text.svg" },
];

// CMS logos
const cmsLogos = [
  { name: "Shopify", logo: "/logos/shopify-svgrepo-com.svg" },
  { name: "Lovable", logo: "/logos/lovable.png" },
  { name: "Wix", logo: "/logos/wix-svgrepo-com.svg" },
  { name: "WordPress", logo: "/logos/wordpress-logo-svgrepo-com.svg" },
  { name: "Framer", logo: "/logos/framer-svgrepo-com.svg" },
  { name: "Webflow", logo: "/logos/webflow-svgrepo-com.svg" },
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

// CMS Platform logos with scrolling marquee
const CMSLogos = () => (
  <div className="relative overflow-hidden py-4 bg-white/60 backdrop-blur-sm rounded-full mx-auto max-w-3xl border border-white/50 shadow-sm">
    <div className="flex animate-marquee-slow items-center">
      {cmsLogos.map((cms, i) => (
        <div
          key={`first-${i}`}
          className="flex items-center gap-3 mx-8 md:mx-12 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Image
            src={cms.logo}
            alt={cms.name}
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-gray-600 font-medium text-sm">{cms.name}</span>
        </div>
      ))}
      {cmsLogos.map((cms, i) => (
        <div
          key={`second-${i}`}
          className="flex items-center gap-3 mx-8 md:mx-12 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Image
            src={cms.logo}
            alt={cms.name}
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-gray-600 font-medium text-sm">{cms.name}</span>
        </div>
      ))}
    </div>
  </div>
);

// FAQ Item Component
const FAQItem = ({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <div className="border-b border-gray-200 last:border-b-0">
    <button
      className="w-full py-5 flex items-center justify-between text-left hover:text-purple-600 transition-colors"
      onClick={onClick}
    >
      <span className="font-medium text-gray-900 pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="pb-5 text-gray-600 leading-relaxed">{answer}</div>
    )}
  </div>
);

// Pricing Card Component
const PricingCard = ({
  title,
  subtitle,
  price,
  oldPrice,
  period,
  features,
  highlighted = false,
  ctaText,
  ctaLink,
  onCtaClick,
  note,
}: {
  title: string;
  subtitle: string;
  price: string;
  oldPrice?: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaLink?: string;
  onCtaClick?: () => void;
  note?: string;
}) => (
  <div
    className={`relative rounded-3xl p-7 transition-all duration-300 flex flex-col h-full ${
      highlighted
        ? "bg-[#0B1120] text-white shadow-premium-lg ring-1 ring-white/10 scale-[1.03]"
        : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg"
    }`}
  >
    {highlighted && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
          MOST POPULAR
        </span>
      </div>
    )}
    <div className={`text-xs font-bold tracking-widest mb-1 ${highlighted ? "text-pink-400" : "text-violet-600"}`}>
      {title}
    </div>
    <div className={`text-sm mb-4 ${highlighted ? "text-gray-400" : "text-gray-500"}`}>
      {subtitle}
    </div>
    <div className="flex items-baseline gap-2 mb-1">
      <span
        className={`text-4xl font-semibold ${highlighted ? "text-white" : "text-gray-900"}`}
      >
        {price}
      </span>
      <span className={highlighted ? "text-gray-300" : "text-gray-500"}>
        /{period}
      </span>
    </div>
    <div className="mb-5 h-6">
      {oldPrice ? (
        <>
          <span className={`text-sm line-through ${highlighted ? "text-gray-500" : "text-gray-400"}`}>
            {oldPrice}
          </span>
          <span className={`text-xs ml-2 font-semibold ${highlighted ? "text-green-400" : "text-green-600"}`}>
            LAUNCH PRICE
          </span>
        </>
      ) : null}
    </div>
    {note && (
      <p className={`text-xs mb-4 -mt-3 ${highlighted ? "text-gray-400" : "text-gray-400"}`}>
        {note}
      </p>
    )}
    <ul className="space-y-2.5 mb-7 flex-1">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3">
          <Check
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? "text-green-400" : "text-green-500"}`}
          />
          <span
            className={`text-sm ${highlighted ? "text-gray-200" : "text-gray-600"}`}
          >
            {feature}
          </span>
        </li>
      ))}
    </ul>
    {onCtaClick ? (
      <Button
        onClick={onCtaClick}
        className={`w-full h-12 rounded-xl font-semibold transition-all mt-auto ${
          highlighted
            ? "bg-white text-[#1E293B] hover:bg-gray-100 shadow-lg"
            : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
        }`}
        size="lg"
      >
        {ctaText}
      </Button>
    ) : ctaLink ? (
      <Link href={ctaLink} className="block mt-auto">
        <Button
          className={`w-full h-12 rounded-xl font-semibold transition-all ${
            highlighted
              ? "bg-white text-[#1E293B] hover:bg-gray-100 shadow-lg"
              : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          size="lg"
        >
          {ctaText}
        </Button>
      </Link>
    ) : null}
  </div>
);

// Hand-drawn underline SVG component
const HandDrawnUnderline = () => (
  <svg
    className="absolute -bottom-2 left-0 w-full h-3"
    viewBox="0 0 200 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <path
      d="M2 8C20 4 40 10 60 6C80 2 100 9 120 5C140 1 160 8 180 4C190 2 198 6 198 6"
      stroke="#7C3AED"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);


export default function Home() {
  const { openWaitlistModal } = useWaitlistModalStore();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const mainRef = useRef<HTMLElement>(null);
  const isScrolling = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video when scrolled into view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Fullpage section scroll
  useEffect(() => {
    const getSections = () => {
      if (!mainRef.current) return [];
      return Array.from(mainRef.current.querySelectorAll<HTMLElement>(":scope > section, :scope > footer"));
    };

    const findCurrentSectionIndex = (sections: HTMLElement[]) => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollCenter = scrollY + viewportHeight / 2;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollCenter) return i;
      }
      return 0;
    };

    const scrollToSection = (section: HTMLElement) => {
      isScrolling.current = true;
      window.scrollTo({ top: section.offsetTop, behavior: "smooth" });
      setTimeout(() => { isScrolling.current = false; }, 800);
    };

    const handleWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (isScrolling.current) { e.preventDefault(); return; }

      const sections = getSections();
      if (sections.length === 0) return;

      const currentIndex = findCurrentSectionIndex(sections);
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction));

      const nextSection = sections[nextIndex];
      if (nextIndex !== currentIndex && nextSection) {
        e.preventDefault();
        scrollToSection(nextSection);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth < 1024) return;
      if (isScrolling.current) return;
      const sections = getSections();
      if (sections.length === 0) return;
      const currentIndex = findCurrentSectionIndex(sections);

      let nextIndex = currentIndex;
      if (e.key === "ArrowDown" || e.key === "PageDown") nextIndex = Math.min(sections.length - 1, currentIndex + 1);
      else if (e.key === "ArrowUp" || e.key === "PageUp") nextIndex = Math.max(0, currentIndex - 1);
      else return;

      const nextSection = sections[nextIndex];
      if (nextIndex !== currentIndex && nextSection) {
        e.preventDefault();
        scrollToSection(nextSection);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const faqs = [
    {
      question: "What is GEO?",
      answer:
        "GEO (Generative Engine Optimization) is the practice of making your brand visible and cited by the major AI engines: ChatGPT, Claude, Perplexity, Gemini and others. As more people ask AI instead of Google, GEO decides whether your brand shows up in those answers.",
    },
    {
      question: "How does the monitoring work?",
      answer:
        "You add your brand, your competitors and the prompts your prospects ask. ShowYourBrand queries every major AI engine automatically — weekly by default, daily on paid plans — stores every answer, and shows your visibility score and how it evolves over time. It's continuous tracking, not a one-off snapshot.",
    },
    {
      question: "Why do you show a score per AI model?",
      answer:
        "Because each engine sources answers differently: ChatGPT follows Bing, Perplexity favours recent high-traffic pages, Claude leans on Reddit and forums, Gemini favours Google properties like YouTube. A single global score hides this. We show why you're strong on one model and invisible on another — and the specific action to fix each.",
    },
    {
      question: "Does this replace SEO?",
      answer:
        "No, GEO complements traditional SEO. SEO optimizes for search rankings; GEO makes sure AI engines understand and cite your content. Both work together to maximize your visibility.",
    },
    {
      question: "Which AI models do you track?",
      answer:
        "ChatGPT (OpenAI), Claude (Anthropic), Perplexity and Gemini (Google) — the engines your customers actually use. We track your presence, position and the sources cited across all of them, every run.",
    },
    {
      question: "Can agencies manage several clients?",
      answer:
        "Yes. Manage multiple brands from a single dashboard, track each client's visibility over time, and on the Agency plan deliver client-ready, branded reports.",
    },
  ];

  return (
    <>
      <TagSEO
        canonicalSlug=""
        title="ShowYourBrand | GEO monitoring for ChatGPT, Claude, Perplexity & Gemini"
        description="Monitor your brand's visibility across every major AI engine, every week. Per-LLM scores, competitor tracking, cited sources and model-specific actions to get cited."
        keywords="GEO monitoring, generative engine optimization, AI visibility tracking, ChatGPT monitoring, brand mentions AI, AI search optimization, LLM visibility"
        og={{
          title: "ShowYourBrand | Track your brand across every AI engine",
          description:
            "Is your brand cited by ChatGPT, Claude, Perplexity or Gemini? Monitor your visibility week after week, track competitors, and get model-specific actions to climb.",
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
        .animate-marquee-fast {
          animation: marquee 15s linear infinite;
        }
        .animate-marquee-fast:hover {
          animation-play-state: paused;
        }
        @media (min-width: 1024px) {
          .animate-marquee {
            animation-duration: 18s;
          }
        }
        .animate-marquee-slow {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee-slow:hover {
          animation-play-state: paused;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(8px);
            opacity: 0.5;
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>

      <main ref={mainRef} className="bg-gradient-to-b from-[#f4f1ff] via-white to-[#faf3f8]">
        <Navbar />

        {/* Hero Section */}
        <section className="h-screen px-4 relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 bg-grid-premium opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
          <div className="absolute top-10 left-0 w-48 h-48 md:w-96 md:h-96 bg-violet-400/25 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-20 right-0 w-48 h-48 md:w-[500px] md:h-[500px] bg-fuchsia-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-[520px] md:h-[520px] bg-indigo-300/25 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-6xl text-center relative z-10 flex flex-col items-center h-full pt-20 md:pt-28 pb-16 md:pb-20">
            {/* Centered: Title + Subtitle + Marquee */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5 md:gap-7">
              <span className="eyebrow-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-700">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Continuous GEO monitoring across every AI engine
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium text-gray-900 leading-[1.05] tracking-tight px-2 sm:px-0">
                Your brand,{" "}
                <span className="relative inline-block text-gradient-premium">
                  cited by AI
                  <HandDrawnUnderline />
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
                ShowYourBrand tracks how often ChatGPT, Claude, Perplexity and Gemini
                cite your brand — every week. Watch your visibility score evolve, keep an
                eye on competitors, and get model-specific actions to climb.
              </p>
              <AIModelMarquee />
            </div>

            {/* Social proof + CTA pinned to bottom */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[12, 32, 47, 65, 1].map((i, idx) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                      <Image
                        src={`https://i.pravatar.cc/64?img=${i}`}
                        alt={`Early user ${idx + 1}`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Used by 40+ brands in early access</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={openWaitlistModal}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-premium px-9 py-4 h-auto text-base font-semibold transition-all hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a demo
                </Button>
                <Link
                  href="/app"
                  className="inline-flex items-center rounded-full border border-gray-300/80 bg-white/60 backdrop-blur-sm text-gray-800 hover:border-gray-400 hover:bg-white px-9 py-4 text-base font-semibold transition-all"
                >
                  See a live dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll down arrow */}
          <a
            href="#features"
            className="absolute bottom-8 inset-x-0 mx-auto w-fit z-10 animate-bounce-slow"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </a>
        </section>

        {/* Video Demo Section */}
        <section className="px-4 py-16 md:py-20 lg:min-h-screen lg:flex lg:flex-col lg:items-center lg:justify-center">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-4 md:mb-6">
                See it in action
              </h2>
              
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50">
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                controls
                playsInline
                preload="metadata"
              >
                <source src="/SYBvideo.mov" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-16 md:py-20 lg:min-h-screen lg:flex lg:flex-col lg:items-center lg:justify-center">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-4 md:mb-6">
                GEO is the new SEO.
              </h2>
              <p className="text-gray-600 max-w-2xl lg:max-w-3xl mx-auto text-base md:text-lg lg:text-xl">
                When someone asks ChatGPT for a recommendation, they get one answer — not ten blue links.
                Either your brand is mentioned, or a competitor is. ShowYourBrand tracks that, every week.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-10 shadow-premium border border-white/60 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 ring-1 ring-violet-100">
                  <Eye className="w-6 h-6 lg:w-7 lg:h-7 text-violet-700" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  Track every engine, every week
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  We query ChatGPT, Claude, Perplexity and Gemini on your prompts automatically,
                  store every answer, and turn it into a visibility score that evolves over time —
                  not a one-off snapshot.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-10 shadow-premium border border-white/60 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 ring-1 ring-violet-100">
                  <Target className="w-6 h-6 lg:w-7 lg:h-7 text-violet-700" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  Know why each model ignores you
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Others give you one global score. We break it down by engine and explain it:
                  strong on Perplexity, invisible on Claude — with the specific reason and the
                  fix for each model.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-10 shadow-premium border border-white/60 hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 ring-1 ring-violet-100">
                  <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-violet-700" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  See competitors and the sources AI cites
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Track competitors on the same prompts, and see exactly which pages ChatGPT,
                  Claude and Perplexity pull from — and whether each source mentions you or not.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why ShowYourBrand */}
        <section className="px-4 py-16 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0B1120] px-6 py-14 md:px-14 md:py-20 text-white shadow-premium-lg">
              <div className="absolute inset-0 bg-grid-dark opacity-70" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-violet-200 mb-5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Why ShowYourBrand
                  </span>
                  <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium mb-4">
                    GEO monitoring, built for the French market
                  </h2>
                  <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                    Everything the best AI-visibility tools do — continuous multi-LLM tracking —
                    with per-engine explanations and French-first support.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { Icon: Target, title: "Every engine that matters", desc: "ChatGPT, Claude, Perplexity and Gemini, tracked together — so you see your visibility everywhere your customers ask." },
                    { Icon: Zap, title: "Evolution, week after week", desc: "Watch your visibility score move over 12 weeks, catch drops early with alerts, and prove the impact of every change." },
                    { Icon: ShieldCheck, title: "Made for the French market", desc: "Interface, support and use cases in French, pricing in euros — the GEO tool French brands and agencies actually get." },
                  ].map(({ Icon, title, desc }) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-violet-200" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI & Results Section */}
        <section
          id="process"
          className="px-4 py-16 md:py-20 lg:min-h-screen bg-white/50 backdrop-blur-sm lg:flex lg:flex-col lg:items-center lg:justify-center"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-12">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700 mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  The new front page of the internet
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-medium text-gray-900 mb-5 leading-[1.1]">
                  When buyers ask AI, you&apos;re the answer — or you&apos;re invisible.
                </h2>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg mb-6">
                  People no longer scroll through ten blue links. They ask ChatGPT, Claude or
                  Perplexity and act on the single answer they get back. If your brand isn&apos;t
                  in it, a competitor is.
                </p>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  ShowYourBrand is the fastest way to see exactly where you stand today — and the
                  clearest path to get your brand cited, engine by engine.
                </p>
              </div>

              {/* AI answer mockup — shows "the answer" vs "invisible" */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-violet-200/50 via-fuchsia-200/30 to-transparent rounded-[2.5rem] blur-2xl" />
                <div className="relative bg-white rounded-3xl border border-white/60 shadow-premium-lg p-5 md:p-7">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-400">Asked to ChatGPT · Perplexity · Gemini</span>
                  </div>

                  {/* user prompt */}
                  <div className="flex justify-end mb-5">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gray-100 px-4 py-2.5 text-sm text-gray-700">
                      &ldquo;What&apos;s the best <span className="font-medium text-gray-900">solution in my category</span>?&rdquo;
                    </div>
                  </div>

                  {/* answer: cited */}
                  <div className="rounded-2xl border border-green-200 bg-green-50/70 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">With ShowYourBrand — you&apos;re the answer</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-7">
                      &ldquo;I&apos;d go with <span className="font-semibold text-gray-900">your brand</span>{" "}— it&apos;s the one most often recommended for this.&rdquo;
                    </p>
                  </div>

                  {/* answer: invisible */}
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="block w-2 h-[2px] bg-white rounded-full" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Without it — you&apos;re invisible</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed pl-7">
                      &ldquo;I&apos;d recommend <span className="font-medium text-gray-600">Competitor A</span> or <span className="font-medium text-gray-600">Competitor B</span>.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-12">
              {[
                { value: "3×", label: "higher conversion rate", sub: "AI-referred vs. organic search" },
                { value: "58%", label: "of product searches", sub: "now start on an AI, not Google" },
                { value: "87%", label: "of brands cited zero times", sub: "across 100 AI prompts in their category" },
                { value: "1 mention", label: "in an AI answer", sub: "can outperform thousands of SEO clicks" },
              ].map((stat) => (
                <div key={stat.value} className="bg-white rounded-2xl p-5 md:p-6 shadow-premium border border-white/60">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-premium mb-1.5">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-800 mb-0.5">{stat.label}</div>
                  <div className="text-xs text-gray-400 leading-snug">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Case study */}
            <div className="bg-[#0F172A] rounded-3xl overflow-hidden text-white">
              <div className="grid md:grid-cols-2">

                {/* Left  Story */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">B2B SaaS · Project Management</p>

                  {/* Before */}
                  <div className="mb-6">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Before</span>
                    <h3 className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium mt-2 leading-tight text-gray-300">
                      Invisible.<br />Cited 0 times.<br />Losing to 2 competitors.
                    </h3>
                    <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                      GEO score 18/100. Not mentioned once across 100 AI prompts.
                      Two competitors cited on every relevant query.
                      The HTML scanner rated their features page 4/10 for AI readability.
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-2xl text-gray-600 mb-6">↓</div>

                  {/* After */}
                  <div className="mb-8">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">After 6 weeks</span>
                    <h3 className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium mt-2 leading-tight">
                      74/100.<br />12 citations.<br />Ahead of the pack.
                    </h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                      11 fixes from the action plan: Organization schema, FAQ structured data,
                      features page rewrite. Second audit returned 74/100.
                    </p>
                  </div>

                  <p className="text-gray-400 text-sm italic leading-relaxed border-l-2 border-gray-700 pl-4 mb-3">
                    &ldquo;The audit showed exactly why ChatGPT ignored us. Six weeks later
                    we show up on every prompt where we used to be invisible.&rdquo;
                  </p>
                  <p className="text-gray-600 text-xs">Founder, anonymous at their request</p>
                </div>

                {/* Right  Dashboard mockup */}
                <div className="bg-[#1E293B] p-6 md:p-8 flex flex-col gap-4">

                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 font-medium">GEO Dashboard · Audit 2 of 2</span>
                    <span className="text-xs text-green-400 font-semibold">↑ +56 pts</span>
                  </div>

                  {/* GEO Score */}
                  <div className="bg-[#0F172A] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">GEO Health Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 line-through">18/100</span>
                        <span className="text-lg font-bold text-white">74/100</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: "74%" }} />
                    </div>
                  </div>

                  {/* Citations */}
                  <div className="bg-[#0F172A] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">Citations / 100 prompts</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 line-through">0</span>
                        <span className="text-lg font-bold text-white">12</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>

                  {/* Competitor comparison */}
                  <div className="bg-[#0F172A] rounded-2xl p-5">
                    <span className="text-xs text-gray-400 block mb-3">vs. Competitors</span>
                    <div className="space-y-2.5">
                      {[
                        { name: "You", score: 74, color: "bg-purple-500", bold: true },
                        { name: "Competitor A", score: 79, color: "bg-gray-500", bold: false },
                        { name: "Competitor B", score: 68, color: "bg-gray-500", bold: false },
                        { name: "Competitor C", score: 55, color: "bg-gray-500", bold: false },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className={`text-xs w-24 flex-shrink-0 ${c.bold ? "text-white font-semibold" : "text-gray-500"}`}>{c.name}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.score}%` }} />
                          </div>
                          <span className={`text-xs w-8 text-right ${c.bold ? "text-white font-semibold" : "text-gray-600"}`}>{c.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action plan */}
                  <div className="bg-[#0F172A] rounded-2xl p-5">
                    <span className="text-xs text-gray-400 block mb-3">Action Plan</span>
                    <div className="space-y-2">
                      {[
                        { label: "Add Organization schema markup", priority: "Critical", color: "text-red-400", dot: "bg-red-500", done: true },
                        { label: "Implement FAQ structured data", priority: "Critical", color: "text-red-400", dot: "bg-red-500", done: true },
                        { label: "Rewrite features page for AI", priority: "High", color: "text-orange-400", dot: "bg-orange-500", done: true },
                        { label: "Add author markup to blog posts", priority: "Medium", color: "text-yellow-400", dot: "bg-yellow-500", done: false },
                        { label: "Update meta descriptions", priority: "Low", color: "text-gray-500", dot: "bg-gray-600", done: false },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                          <span className={`text-xs flex-1 ${item.done ? "line-through text-gray-600" : "text-gray-300"}`}>{item.label}</span>
                          <span className={`text-xs font-medium flex-shrink-0 ${item.color}`}>{item.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600">
                Start solo, track continuously, and scale to an agency plan when you manage clients.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
              <PricingCard
                title="SOLO"
                subtitle="Pour indépendants & consultants"
                price="€29"
                period="mois"
                features={[
                  "2 projets suivis en continu",
                  "3 moteurs IA au choix",
                  "Suivi hebdomadaire automatique",
                  "Score de visibilité par moteur",
                  "Suivi des concurrents",
                  "Sources citées par les IA",
                  "Alertes email sur variation",
                ]}
                ctaText="Commencer"
                ctaLink="/signup?plan=solo"
              />
              <PricingCard
                title="PRO"
                subtitle="Pour équipes marketing"
                price="€79"
                period="mois"
                highlighted={true}
                features={[
                  "10 projets suivis en continu",
                  "Les 4 moteurs IA (ChatGPT, Claude, Perplexity, Gemini)",
                  "Suivi quotidien automatique",
                  "Historique 12 semaines par moteur",
                  "Recommandations spécifiques par moteur",
                  "Suivi concurrents avancé",
                  "Alertes email sur variation",
                ]}
                ctaText="Suivre ma visibilité"
                ctaLink="/signup?plan=pro"
              />
              <PricingCard
                title="AGENCE"
                subtitle="Pour agences (10–20 clients)"
                price="€149"
                period="mois"
                features={[
                  "Projets illimités",
                  "Les 4 moteurs IA, suivi quotidien",
                  "Dashboard multi-clients",
                  "Rapports PDF en marque blanche",
                  "Logo & couleurs de votre agence",
                  "Recommandations par moteur & par client",
                  "Support prioritaire en français",
                ]}
                ctaText="Réserver un appel"
                ctaLink="/signup?plan=agency"
              />
            </div>

            

            <p className="mt-3 text-center text-sm text-gray-500">
              Need a custom plan for your agency?{" "}
              <button
                onClick={openWaitlistModal}
                className="font-semibold text-[#1E293B] hover:text-slate-700 underline"
              >
                Book a call with us
              </button>{" "}
              and we&apos;ll tailor the right solution.
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-transparent to-purple-50/50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Trusted by our beta-testers
              </h2>
              <p className="text-gray-600">
                See what early adopters are saying
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Thomas R.",
                  role: "Founder, SaaS B2B",
                  avatar: "T",
                  bg: "bg-purple-600",
                  quote: "We had no idea AI models barely mentioned us. After the audit we understood exactly why  and fixed it in a week. Our citation rate on ChatGPT doubled.",
                },
                {
                  name: "Sophie M.",
                  role: "CEO, Marketing Agency",
                  avatar: "S",
                  bg: "bg-pink-500",
                  quote: "I now offer GEO audits to all my clients as an add-on service. ShowYourBrand gives me the data and the reports  I just present them. It's a game changer for the agency.",
                },
                {
                  name: "Antoine L.",
                  role: "Head of Growth, E-commerce",
                  avatar: "A",
                  bg: "bg-slate-700",
                  quote: "The competitor comparison blew my mind. I could see exactly which pages our competitors had that were getting cited by Perplexity and we didn't. Incredibly actionable.",
                },
              ].map((t) => (
                <div key={t.name} className="bg-white rounded-2xl p-6 shadow-premium border border-white/60 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-gray-700 leading-relaxed text-sm flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${t.bg}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-gray-500 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Common Questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about GEO
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-premium border border-white/60">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>
          </div>
          {/* Seamless Integration Section */}
          <div className="container mx-auto max-w-4xl text-center mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">
              Seamless Integration with your CMS
            </h3>
            <CMSLogos />
          </div>
        
        </section>

        {/* CTA Section */}
        <section className="min-h-[60vh] md:h-[75vh] px-4 py-20 md:py-0 bg-[#0B1120] relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-grid-dark opacity-70" />
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-medium text-white mb-4 md:mb-6 lg:mb-8 leading-tight">
              Be the brand AI recommends
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 max-w-2xl lg:max-w-3xl mx-auto">
              Track exactly where you stand in ChatGPT, Claude, Perplexity and Gemini — week
              after week — and get model-specific actions to get cited.
            </p>

            <div className="mt-14 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
                <button
                  onClick={openWaitlistModal}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-premium px-10 py-4 text-base font-semibold transition-all hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4" />
                  Book a demo
                </button>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-[#0B1120] hover:bg-gray-100 shadow-lg px-10 py-4 text-base font-semibold transition-colors"
                >
                  See pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0B1120] text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 md:gap-12 mb-12">
              <div className="md:col-span-2">
                <Link href="/" className="flex items-center gap-2 mb-6">
                  <div className="w-16 h-16  rounded-lg flex items-center justify-center">
                    <Image
                      src={"/syb_logo_transparent.png"}
                      alt="logo"
                      width={120}
                      height={120}
                    ></Image>
                  </div>
                  <span className="text-base font-semibold text-white tracking-tight">
                    ShowYourBrand
                  </span>
                </Link>
                <p className="text-gray-400 mb-6 max-w-sm">
                  The first Generative Engine Optimization platform. Make your
                  brand visible to AI.
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://x.com/showyourbrand_"
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/showyourbrand/"
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="mailto:contact@ShowYourBrand"
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#features"
                      className="hover:text-white transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="hover:text-white transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="hover:text-white transition-colors"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="hover:text-white transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="hover:text-white transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm">
                © 2026 ShowYourBrand. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

    </>
  );
}
