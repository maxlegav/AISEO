import TagSEO from "@/components/TagSEO";
import TagSchema from "@/components/TagSchema";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Star,
  Mail,
  Twitter ,
  Linkedin,
  Eye,
  Target,
  Zap,
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

// Trust badge initials for the counter
const trustAvatars = [
  { letter: "S", bg: "bg-gray-800" },
  { letter: "M", bg: "bg-gray-600" },
  { letter: "A", bg: "bg-gray-700" },
  { letter: "L", bg: "bg-gray-500" },
  { letter: "T", bg: "bg-gray-900" },
];

// Animated AI Model Marquee with real logos
const AIModelMarquee = () => (
  <div className="mt-8">
    <p className="text-center text-gray-500 text-sm font-medium mb-4 tracking-wide">
    BE MENTIONNED BY:
    </p>

    <div className="relative overflow-hidden py-4 bg-white/60 backdrop-blur-sm rounded-full mx-auto max-w-xl border border-white/50 shadow-sm">
      <div className="flex animate-marquee items-center w-max">
        {[...aiModels, ...aiModels].map((model, i) => (
          <div
            key={i}
            className="flex items-center gap-3 mx-5 md:mx-8 flex-shrink-0"
          >
            <Image
              src={model.logo}
              alt={`${model.name} logo`}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <Image
              src={model.text}
              alt={model.name}
              width={100}
              height={24}
              className="h-6 w-auto object-contain"
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

// Pricing Card Component - With strikethrough old price
const PricingCard = ({
  title,
  price,
  oldPrice,
  period,
  features,
  highlighted = false,
  ctaText,
  ctaLink,
}: {
  title: string;
  price: string;
  oldPrice: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaLink: string;
}) => (
  <div
    className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col h-full ${
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
    <div
      className={`text-sm font-semibold mb-4 ${highlighted ? "text-white" : "text-gray-900"}`}
    >
      {title}
    </div>
    <div className="flex items-baseline gap-2 mb-1">
      <span
        className={`text-5xl font-semibold ${highlighted ? "text-white" : "text-gray-900"}`}
      >
        {price}
      </span>
      <span className={highlighted ? "text-gray-300" : "text-gray-500"}>
        /{period}
      </span>
    </div>
    <div className="mb-6">
      <span
        className={`text-lg line-through ${highlighted ? "text-gray-400" : "text-gray-400"}`}
      >
        {oldPrice}/{period}
      </span>
      <span
        className={`text-xs ml-2 font-semibold ${highlighted ? "text-green-400" : "text-green-600"}`}
      >
        LAUNCH PRICE
      </span>
    </div>
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3">
          <Check
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${highlighted ? "text-green-400" : "text-green-500"}`}
          />
          <span
            className={`text-sm ${highlighted ? "text-gray-200" : "text-gray-600"}`}
          >
            {feature}
          </span>
        </li>
      ))}
    </ul>
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
  </div>
);

// Testimonial Card Component with Initial Letter
const TestimonialCard = ({
  quote,
  author,
  role,
  initial,
}: {
  quote: string;
  author: string;
  role: string;
  initial: string;
}) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex gap-1 mb-5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-700 text-lg leading-relaxed mb-6">
      &ldquo;{quote}&rdquo;
    </p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-semibold text-lg">{initial}</span>
      </div>
      <div>
        <div className="font-semibold text-gray-900">{author}</div>
        <div className="text-sm text-gray-500">{role}</div>
      </div>
    </div>
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

// Subscriber Counter - shows real count if above threshold, otherwise encouragement
const WAITLIST_THRESHOLD = 20;

const SubscriberCounter = ({ count }: { count: number }) => {
  if (count > WAITLIST_THRESHOLD) {
    return (
      <div className="flex items-center justify-center gap-3 mt-4">
        <div className="flex -space-x-2">
          {trustAvatars.map((avatar, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full ${avatar.bg} flex items-center justify-center border-2 border-white text-white text-xs font-semibold`}
            >
              {avatar.letter}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-700 font-medium">
          <span className="font-bold text-gray-900"> {count} </span> professionals
          already joined, be one of them!
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-500 mt-4">
      Be among the first to join us !
    </p>
  );
};


const isProduction = process.env.NEXT_PUBLIC_APP_STATE === "production";

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.count) {
          setSubscriberCount(data.data.count);
        }
      })
      .catch(() => {});
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
        "Yes! All plans include PDF export functionality. You'll receive a comprehensive report with executive summary, detailed findings, competitor analysis, and actionable recommendations that you can share with your team or clients.",
    },
    {
      question: "Which AI models do you analyze?",
      answer:
        "We analyze your visibility across the 4 major AI platforms: ChatGPT (OpenAI), Claude (Anthropic), Perplexity, and DeepSeek. Each model has different training data and citation patterns, so we test across all of them to give you a complete picture.",
    },
    {
      question: "How often should I run an audit?",
      answer:
        "We recommend running audits monthly at minimum. AI models are constantly updated with new training data, and your competitors are optimizing too. Regular audits help you track progress and catch any drops in visibility before they impact your traffic.",
    },
    {
      question: "Do you offer white-label reports for agencies?",
      answer:
        "Yes! Our Premium plan includes fully customizable white-label reports with your branding. You can add your logo, colors, and custom messaging to present professional GEO audits to your clients under your own brand.",
    },
  ];

  return (
    <>
      <TagSEO
        canonicalSlug=""
        title="ShowYourBrand — GEO Audit: Appear in ChatGPT, Claude & Perplexity"
        description="Test your brand visibility across 100 AI prompts on ChatGPT, Claude, Perplexity & DeepSeek. Get your GEO score and an action plan to appear in AI answers."
        keywords="GEO optimization, generative engine optimization, AI visibility, ChatGPT SEO, brand mentions AI, AI search optimization, GEO audit"
        og={{
          title: "ShowYourBrand — Appear in AI Search Results",
          description:
            "Is your brand cited by ChatGPT, Claude or Perplexity? Test 100 AI prompts, get your GEO score and a clear action plan. Start your free audit today.",
          image: `https://showyourbrand.vercel.app/og-image.png`,
          url: "https://showyourbrand.vercel.app/",
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
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
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

      <main className="bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16 relative">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <Image
                    src={"/syb_logo_transparent.png"}
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
                <a
                  href="#features"
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#process"
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Process
                </a>
                {isProduction && (
                  <a
                    href="#pricing"
                    className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    Pricing
                  </a>
                )}
                <a
                  href="#faq"
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
                  FAQ
                </a>
                <Link
                  href="/blog"
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Blog
                </Link>
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <Link href="/waitlist">
                  <Button variant="ghost" className="text-sm font-medium">
                    Join Waitlist
                  </Button>
                </Link>
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

        {/* Hero Section */}
        <section className="h-screen px-4 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-400/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-400/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-300/40 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-6xl text-center relative z-10 flex flex-col items-center h-full pt-28 pb-20">
            {/* Centered: Title + Subtitle + Marquee */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-medium text-gray-900 leading-tight">
                Stop being{" "}
                <span className="relative inline-block">
                  invisible
                  <HandDrawnUnderline />
                </span>{" "}
                to AI
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                The first Generative Engine Optimization (GEO) platform. Audit,
                analyze, and optimize your brand&apos;s presence across all major
                AI models.
              </p>
              <AIModelMarquee />
            </div>

            {/* Bottom: CTA pinned to bottom */}
            <div className="max-w-xl mx-auto">
              <div className="flex justify-center">
                <Link href="/waitlist">
                  <Button className="rounded-full bg-[#1E293B] hover:bg-[#334155] text-white shadow-lg px-10 py-4 h-auto text-base font-semibold">
                    <Mail className="w-4 h-4 mr-2" />
                    Join the Waitlist
                  </Button>
                </Link>
              </div>
              <SubscriberCounter count={subscriberCount} />
            </div>
          </div>

          {/* Scroll down arrow */}
          <a
            href="#features"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce-slow"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </a>
        </section>

        {/* The GEO Advantage Section - Aggressive Marketing */}
        <section id="features" className="h-screen px-4 flex flex-col items-center justify-center">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-5 py-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-700 text-sm font-semibold">
                  YOUR CUSTOMERS HAVE ALREADY SWITCHED TO AI SEARCH
                </span>
              </div>
              <h2 className="font-heading text-4xl md:text-6xl font-medium text-gray-900 mb-6">
                Google is dying. AI is the new search.
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-lg md:text-xl">
                58% of consumers now use ChatGPT, Perplexity, or Claude instead
                of Google to find products and services. If AI doesn&apos;t
                mention your brand, <strong>you don&apos;t exist</strong> for
                these customers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-gray-900" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Be the brand AI recommends
                </h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  <strong>87% of brands are invisible</strong> to AI. When users
                  ask &ldquo;the best tool for...&rdquo;, AI names you — or your
                  competitor.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-gray-900" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Crush your competitors
                </h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  See which competitors AI recommends instead of you. Understand{" "}
                  <strong>why they rank higher</strong> — then steal their
                  playbook.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-gray-900" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  10x more qualified traffic
                </h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  AI users have <strong>3x higher purchase intent</strong> than
                  Google users. One AI mention drives more revenue than 1,000
                  clicks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section
          id="process"
          className="h-screen px-4 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center"
        >
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-heading text-4xl md:text-6xl font-medium text-gray-900 mb-6">
                  Your competitors are already
                  <br />
                  <span className="italic text-purple-600">
                    winning AI search
                  </span>
                </h2>
                <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                  Every day, millions of potential customers ask AI for
                  recommendations. If your brand isn&apos;t being cited,
                  you&apos;re losing deals to competitors who are. We show you
                  exactly where you stand—and how to fix it.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        See What AI Says About You
                      </h4>
                      <p className="text-gray-600">
                        Real queries. Real responses. Know exactly how ChatGPT,
                        Claude, and Perplexity describe your brand.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        Outrank Your Competition
                      </h4>
                      <p className="text-gray-600">
                        Discover which competitors are getting recommended
                        instead of you—and steal their playbook.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        Actionable Fixes in Minutes
                      </h4>
                      <p className="text-gray-600">
                        Copy-paste schema markup, optimized FAQs, and content
                        suggestions you can implement today.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Visualization */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-gray-500 font-medium">
                      Live AI Analysis
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                    Your Brand
                  </span>
                </div>

                <div className="text-center mb-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                  <div className="text-6xl font-bold text-gray-900 mb-1">
                    73<span className="text-3xl text-gray-400">%</span>
                  </div>
                  <div className="text-base text-gray-600">GEO Health Score</div>
                  <div className="text-sm text-orange-500 mt-1 font-medium">
                    Room for improvement
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-3">
                    vs. Top Competitors
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base text-gray-700 w-28 truncate">
                      You
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: "73%" }}
                      />
                    </div>
                    <span className="text-base font-semibold text-gray-900 w-12 text-right">
                      73%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base text-gray-500 w-28 truncate">
                      Competitor A
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-400 h-full rounded-full"
                        style={{ width: "89%" }}
                      />
                    </div>
                    <span className="text-base font-semibold text-green-600 w-12 text-right">
                      89%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base text-gray-500 w-28 truncate">
                      Competitor B
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full"
                        style={{ width: "81%" }}
                      />
                    </div>
                    <span className="text-base font-semibold text-gray-900 w-12 text-right">
                      81%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                  <div className="text-center py-4 bg-red-50 rounded-xl">
                    <div className="text-xl font-bold text-red-600">12</div>
                    <div className="text-sm text-gray-600">
                      Missing Citations
                    </div>
                  </div>
                  <div className="text-center py-4 bg-green-50 rounded-xl">
                    <div className="text-xl font-bold text-green-600">
                      +340%
                    </div>
                    <div className="text-sm text-gray-600">
                      Potential Traffic
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        {isProduction && <section id="pricing" className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600">
                Choose the plan that fits your needs. Cancel anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              <PricingCard
                title="BASIC"
                price="€199"
                oldPrice="€299"
                period="one-time"
                features={[
                  "1 complete GEO audit",
                  "ChatGPT analysis (GPT-4o)",
                  "1 competitor comparison",
                  "100 AI prompt testing",
                  "Full PDF report with insights",
                  "HTML & schema.org scan",
                  "Content optimization tips",
                  "Email support (48h response)",
                ]}
                ctaText="Join the Waitlist"
                ctaLink="/waitlist"
              />
              <PricingCard
                title="PRO"
                price="€399"
                oldPrice="€599"
                period="one-time"
                features={[
                  "1 complete GEO audit",
                  "All 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)",
                  "5 competitor comparisons",
                  "100 AI prompt testing",
                  "Full PDF report + executive summary",
                  "HTML & schema.org deep scan",
                  "AI-optimized FAQ generation",
                  "Priority action plan (ranked by impact)",
                  "Dashboard with full history",
                  "Priority email support (24h)",
                ]}
                highlighted={true}
                ctaText="Join the Waitlist"
                ctaLink="/waitlist"
              />
              <PricingCard
                title="PREMIUM FOR AGENCIES"
                price="€799"
                oldPrice="€1,199"
                period="mo"
                features={[
                  "20 audits per month included",
                  "All 4 AI engines per audit",
                  "Unlimited competitor comparisons",
                  "100 AI prompt testing per audit",
                  "White-label PDF reports (your branding)",
                  "Bulk audit management dashboard",
                  "Client-ready executive summaries",
                  "Schema markup & FAQ auto-generation",
                  "Monthly GEO trend reports",
                  "Dedicated account manager",
                  "+€35 per extra audit beyond 20",
                ]}
                ctaText="Join the Waitlist"
                ctaLink="/waitlist"
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
        </section>}

        {/* Testimonials Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-transparent to-purple-50/50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Trusted by our beta-Testers
              </h2>
              <p className="text-gray-600">
                See what early adopters are saying
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="We ran a GEO audit for a client and discovered they were completely invisible on Perplexity. After implementing the recommendations, they saw a 40% increase in AI referral traffic in just 2 weeks."
                author="Sarah J."
                role="Founder, Digital Marketing Agency"
                initial="S"
              />
              <TestimonialCard
                quote="Our SaaS was getting mentioned by ChatGPT for the wrong features. ShowYourBrand showed us exactly what to fix. Now we're the #1 recommendation in our niche for 3 out of 4 AI engines."
                author="Marc D."
                role="CTO, B2B SaaS Platform"
                initial="M"
              />
              <TestimonialCard
                quote="As an e-commerce brand, we didn't realize AI search was sending traffic to our competitors. The competitor gap analysis was eye-opening. ROI paid for itself in the first week."
                author="Elena R."
                role="Head of Growth, E-commerce Brand"
                initial="E"
              />
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
        <section className="h-[75vh] px-4 bg-[#1E293B] relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <h2 className="font-heading text-5xl md:text-7xl lg:text-8xl font-medium text-white mb-8 leading-tight">
              Ready to dominate AI search?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto">
              Join hundreds of brands already optimizing for the future of
              search. Start your free audit today and see exactly where you
              stand.
            </p>

            <div className="mt-14 max-w-xl mx-auto">
              <div className="flex justify-center">
                <Link href="/waitlist">
                  <Button className="rounded-full bg-white text-[#1E293B] hover:bg-gray-100 shadow-lg px-10 py-4 h-auto text-base font-semibold">
                    <Mail className="w-4 h-4 mr-2" />
                    Join the Waitlist
                  </Button>
                </Link>
              </div>

              {subscriberCount > WAITLIST_THRESHOLD ? (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div className="flex -space-x-2">
                    {trustAvatars.map((avatar, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 text-white text-xs font-semibold"
                      >
                        {avatar.letter}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 font-medium">
                    <span className="font-bold text-white">
                      {subscriberCount}
                    </span>{" "}
                    professionals already joined, be one of them!
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-4">
                  Be among the first to join us !
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className=" text-black py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
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
                  {isProduction && (
                    <li>
                      <a
                        href="#pricing"
                        className="hover:text-white transition-colors"
                      >
                        Pricing
                      </a>
                    </li>
                  )}
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
                  {isProduction && (
                    <li>
                      <Link
                        href="/login"
                        className="hover:text-white transition-colors"
                      >
                        Login
                      </Link>
                    </li>
                  )}
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
