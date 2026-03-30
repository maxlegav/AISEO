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
  { name: "", logo: "/logos/lovable.png" },
  { name: "Wix", logo: "/logos/wix-svgrepo-com.svg" },
  { name: "WordPress", logo: "/logos/wordpress-logo-svgrepo-com.svg" },
  { name: "Framer", logo: "/logos/framer-svgrepo-com.svg" },
  { name: "Webflow", logo: "/logos/webflow-svgrepo-com.svg" },
];


// Animated AI Model Marquee with real logos
const AIModelMarquee = () => (
  <div className="mt-8 w-full">
    <p className="text-center text-gray-500 text-sm font-medium mb-4 tracking-wide">
    BE MENTIONNED BY:
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
}) => (
  <div
    className={`relative rounded-3xl p-7 transition-all duration-300 flex flex-col h-full ${
      highlighted
        ? "bg-[#1E293B] text-white shadow-2xl shadow-slate-500/25 scale-[1.02]"
        : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg"
    }`}
  >
    {highlighted && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-pink-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
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
        "GEO (Generative Engine Optimization) is the practice of optimizing your website and content to be visible and cited by AI systems like ChatGPT, Claude, Perplexity, and other large language models. As more users turn to AI for answers, GEO ensures your brand appears in those responses.",
    },
    {
      question: "How long does an audit take?",
      answer:
        "A complete audit typically takes 10-15 minutes to process. We analyze your website across 100+ AI prompts, scan your HTML structure, and generate comprehensive recommendations. You'll receive real-time progress updates during the process.",
    },
    {
      question: "Does this replace SEO?",
      answer:
        "No, GEO complements traditional SEO. While SEO optimizes for search engine rankings, GEO ensures your content is structured and presented in ways that AI systems can understand and cite. Both work together to maximize your online visibility.",
    },
    {
      question: "Can I export the reports?",
      answer:
        "Yes! All plans give you access to your audit dashboard with a shareable link. Pro and Agency subscribers get a permanent dashboard with full history. Agency plans include white-label sharing so your clients see your branding.",
    },
    {
      question: "Which AI models do you analyze?",
      answer:
        "We analyze your visibility across the 4 major AI platforms: ChatGPT (OpenAI), Claude (Anthropic), Perplexity, and Gemini (Google). Each model has different training data and citation patterns, so we test across all of them to give you a complete picture.",
    },
    {
      question: "How often should I run an audit?",
      answer:
        "We recommend running audits monthly at minimum. AI models are constantly updated with new training data, and your competitors are optimizing too. Regular audits help you track progress and catch any drops in visibility before they impact your traffic.",
    },
    {
      question: "Do you offer white-label reports for agencies?",
      answer:
        "Yes! Our Agency plan includes fully customizable white-label dashboards with your branding. You can add your logo, colors, and share a custom link with your clients — they see your agency, not ShowYourBrand.",
    },
  ];

  return (
    <>
      <TagSEO
        canonicalSlug=""
        title="ShowYourBrand | GEO Audit: Appear in ChatGPT, Claude & Perplexity"
        description="Test your brand visibility across 100 AI prompts on ChatGPT, Claude, Perplexity & Gemini. Get your GEO score and an action plan to appear in AI answers."
        keywords="GEO optimization, generative engine optimization, AI visibility, ChatGPT SEO, brand mentions AI, AI search optimization, GEO audit"
        og={{
          title: "ShowYourBrand | Appear in AI Search Results",
          description:
            "Is your brand cited by ChatGPT, Claude or Perplexity? Test 100 AI prompts, get your GEO score and a clear action plan. Start your free audit today.",
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

      <main ref={mainRef} className="bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        <Navbar />

        {/* Hero Section */}
        <section className="h-screen px-4 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-10 left-0 w-48 h-48 md:w-96 md:h-96 bg-purple-400/30 md:bg-purple-400/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-48 h-48 md:w-[500px] md:h-[500px] bg-pink-400/20 md:bg-pink-400/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-[500px] md:h-[500px] bg-orange-300/40 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-6xl text-center relative z-10 flex flex-col items-center h-full pt-20 md:pt-28 pb-16 md:pb-20">
            {/* Centered: Title + Subtitle + Marquee */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-6">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-medium text-gray-900 leading-tight px-2 sm:px-0">
                Mention your{" "}
                <span className="relative inline-block">
                  Brand
                  <HandDrawnUnderline />
                </span>{" "}
                on AI
              </h1>
              <p className="text-base sm:text-lg md:text-lg lg:text-xl text-gray-700 max-w-2xl lg:max-w-3xl mx-auto px-2 sm:px-0">
                The first Generative Engine Optimization (GEO) platform. Audit,
                analyze, and optimize your brand&apos;s presence across all major
                AI models.
              </p>
              <AIModelMarquee />
            </div>

            {/* Social proof + CTA pinned to bottom */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                      <Image
                        src={`/avatars/user-${i}.jpg`}
                        alt={`Early user ${i}`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
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
                  <p className="text-xs text-gray-500 mt-0.5">Used by 120+ brands in early access</p>
                </div>
              </div>

              <Button
                onClick={openWaitlistModal}
                className="rounded-full bg-[#1E293B] hover:bg-[#334155] text-white shadow-lg px-10 py-4 h-auto text-base font-semibold"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book a Free Call
              </Button>
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
                muted
                preload="metadata"
              >
                <source src="/syb-final-HQ.mp4" type="video/mp4" />
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
                Either your brand is mentioned, or a competitor is. There is no page 2.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-10 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6">
                  <Eye className="w-6 h-6 lg:w-7 lg:h-7 text-gray-900" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  See what 4 AI models actually say about you
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  We run 100 real prompts across ChatGPT, Claude, Perplexity and Gemini.
                  You get the word-for-word responses — not estimates, not scores, the actual text.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-10 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6">
                  <Target className="w-6 h-6 lg:w-7 lg:h-7 text-gray-900" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  Find out who's being cited instead of you
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  When AI skips your brand, it names someone else. We tell you which competitors,
                  on which prompts, and what specifically puts them ahead — content structure,
                  schema, backlinks from cited sources.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-10 shadow-sm border border-gray-100 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 lg:mb-6">
                  <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-gray-900" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  A fix list, not a report
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Every issue comes with a specific action: schema markup to add,
                  a paragraph to rewrite, a page to restructure. Prioritized by impact.
                  No PDF to interpret, no consultant needed.
                </p>
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
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-12">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-medium text-gray-900 mb-5">
                  Visitors from AI already trust you.
                </h2>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg mb-6">
                  Traditional SEO brings people who are still comparing options.
                  Someone who found you through a ChatGPT answer has already validated the choice. The AI did it for them.
                  They&apos;re not browsing. They arrived with intent.
                </p>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  The problem: most brands have no idea whether they&apos;re being mentioned, or silently skipped.
                  GEO is the only way to find out, and to fix it.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "3×", label: "higher conversion rate", sub: "AI-referred vs. organic search" },
                  { value: "58%", label: "of product searches", sub: "now start on an AI, not Google" },
                  { value: "87%", label: "of brands cited zero times", sub: "across 100 AI prompts in their category" },
                  { value: "1 mention", label: "in an AI answer", sub: "can outperform thousands of SEO clicks" },
                ].map((stat) => (
                  <div key={stat.value} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">{stat.label}</div>
                    <div className="text-xs text-gray-400 leading-snug">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Case study */}
            <div className="bg-[#0F172A] rounded-3xl overflow-hidden text-white">
              <div className="grid md:grid-cols-2">

                {/* Left — Story */}
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

                {/* Right — Dashboard mockup */}
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
                One audit to test. A subscription to track. An agency plan to scale.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
              <PricingCard
                title="DATA"
                subtitle="For developers & SEO experts"
                price="€29"
                oldPrice="€49"
                period="one-time"
                features={[
                  "1 GEO audit — 4 AI engines",
                  "Raw JSON export of all results",
                  "GEO Health Score & category breakdown",
                  "100 prompts tested, 3 competitors",
                  "HTML scanner raw results",
                  "Permanent data access via API",
                ]}
                ctaText="Get the data"
                ctaLink="/signup?plan=data"
              />
              <PricingCard
                title="STARTER"
                subtitle="Test your AI visibility"
                price="€79"
                oldPrice="€129"
                period="one-time"
                features={[
                  "1 complete GEO audit",
                  "4 AI engines: ChatGPT, Claude, Perplexity & Gemini",
                  "GEO Health Score (0–100) with breakdown",
                  "100 AI prompts in your category",
                  "3 competitor benchmarks",
                  "Technical HTML & Schema.org audit",
                  "Prioritized action plan",
                  "Dashboard access (30 days)",
                ]}
                ctaText="Start my audit"
                ctaLink="/signup?plan=starter"
              />
              <PricingCard
                title="PRO"
                subtitle="Track your monthly progress"
                price="€59"
                oldPrice="€99"
                period="mo"
                highlighted={true}
                features={[
                  "1 automatic audit per month",
                  "4 AI engines + monthly comparison",
                  "Month-over-month score delta",
                  "Fixed vs new issues tracking",
                  "Prompt-level gain / loss tracking",
                  "3 competitor benchmarks",
                  "Permanent dashboard + full history",
                  "Action checklist + 15-day progress email",
                ]}
                ctaText="Start tracking"
                ctaLink="/signup?plan=pro"
              />
              <PricingCard
                title="AGENCY"
                subtitle="For marketing agencies"
                price="€599"
                oldPrice="€999"
                period="mo"
                features={[
                  "15 client audits per month",
                  "All Pro features per client",
                  "Multi-client dashboard",
                  "White-label shareable reports",
                  "3 competitor benchmarks per client",
                  "Resell at your own price",
                  "Dedicated account manager",
                ]}
                ctaText="Book a Call"
                onCtaClick={openWaitlistModal}
              />
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#1E293B] hover:text-slate-700 underline"
              >
                Log in
              </Link>{" "}
              to access your dashboard
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
                  quote: "We had no idea AI models barely mentioned us. After the audit we understood exactly why — and fixed it in a week. Our citation rate on ChatGPT doubled.",
                },
                {
                  name: "Sophie M.",
                  role: "CEO, Marketing Agency",
                  avatar: "S",
                  bg: "bg-pink-500",
                  quote: "I now offer GEO audits to all my clients as an add-on service. ShowYourBrand gives me the data and the reports — I just present them. It's a game changer for the agency.",
                },
                {
                  name: "Antoine L.",
                  role: "Head of Growth, E-commerce",
                  avatar: "A",
                  bg: "bg-slate-700",
                  quote: "The competitor comparison blew my mind. I could see exactly which pages our competitors had that were getting cited by Perplexity and we didn't. Incredibly actionable.",
                },
              ].map((t) => (
                <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
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

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
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
        <section className="min-h-[60vh] md:h-[75vh] px-4 py-20 md:py-0 bg-[#1E293B] relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-medium text-white mb-4 md:mb-6 lg:mb-8 leading-tight">
              Ready to dominate AI search?
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 max-w-2xl lg:max-w-3xl mx-auto">
              Join hundreds of brands already optimizing for the future of
              search. Start your free audit today and see exactly where you
              stand.
            </p>

            <div className="mt-14 max-w-xl mx-auto">
              <div className="flex justify-center mt-4">
                <Button
                  onClick={openWaitlistModal}
                  className="rounded-full bg-white text-[#1E293B] hover:bg-gray-100 shadow-lg px-10 py-4 h-auto text-base font-semibold"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a Free Call
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className=" text-black py-16">
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
                  <span className="text-base font-semibold text-gray-900 tracking-tight">
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
