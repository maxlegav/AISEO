import TagSEO from "@/components/TagSEO";
import TagSchema from "@/components/TagSchema";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  TrendingUp,
  Search,
  Layers,
  Check,
  Star,
  Calendar,
  Mail,
  Twitter,
  Linkedin,
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Users,
  Sparkles,
} from "lucide-react";

// AI Models with their actual logo files
const aiModels = [
  { name: "Claude", logo: "/logos/claude-logo.svg", text: "/logos/claude-text.svg" },
  { name: "Perplexity", logo: "/logos/perplexity-logo.svg", text: "/logos/perplexity-text.svg" },
  { name: "Gemini", logo: "/logos/gemini-logo.svg", text: "/logos/gemini-text.svg" },
  { name: "OpenAI", logo: "/logos/openai-logo.svg", text: "/logos/openai-text.svg" },
  { name: "Grok", logo: "/logos/grok-logo.png", text: "/logos/grok-text.svg" },
];

// CMS logos
const cmsLogos = [
  { name: "Shopify", logo: "/logos/shopify-svgrepo-com.svg" },
  { name: "Wix", logo: "/logos/wix-svgrepo-com.svg" },
  { name: "WordPress", logo: "/logos/wordpress-logo-svgrepo-com.svg" },
  { name: "Framer", logo: "/logos/framer-svgrepo-com.svg" },
  { name: "Webflow", logo: "/logos/webflow-svgrepo-com.svg" },
];

// Animated AI Model Marquee with real logos
const AIModelMarquee = () => (
  <div className="mt-8">
    {/* Title */}
    <p className="text-center text-gray-500 text-sm font-medium mb-4 tracking-wide">
      BE MENTIONNED BY THE FOLLOWING AI MODELS:
    </p>

    {/* Marquee container with rounded pill shape */}
    <div className="relative overflow-hidden py-4 bg-white/60 backdrop-blur-sm rounded-full mx-auto max-w-3xl border border-white/50 shadow-sm">
      {/* Scrolling container */}
      <div className="flex animate-marquee items-center">
        {/* First set */}
        {aiModels.map((model, i) => (
          <div key={`first-${i}`} className="flex items-center gap-3 mx-6 md:mx-10 flex-shrink-0">
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
        {/* Duplicate for seamless loop */}
        {aiModels.map((model, i) => (
          <div key={`second-${i}`} className="flex items-center gap-3 mx-6 md:mx-10 flex-shrink-0">
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
    {/* Scrolling container */}
    <div className="flex animate-marquee-slow items-center">
      {/* First set */}
      {cmsLogos.map((cms, i) => (
        <div key={`first-${i}`} className="flex items-center gap-3 mx-8 md:mx-12 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
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
      {/* Duplicate for seamless loop */}
      {cmsLogos.map((cms, i) => (
        <div key={`second-${i}`} className="flex items-center gap-3 mx-8 md:mx-12 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
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

// Pricing Card Component - Redesigned
const PricingCard = ({
  title,
  price,
  period,
  features,
  highlighted = false,
  ctaText,
  ctaLink,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  ctaLink: string;
}) => (
  <div
    className={`relative rounded-3xl p-8 transition-all duration-300 ${
      highlighted
        ? "bg-[#1E293B] text-white shadow-2xl shadow-slate-500/25 scale-[1.02]"
        : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg"
    }`}
  >
    {highlighted && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-pink-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
          POPULAR
        </span>
      </div>
    )}
    <div className={`text-sm font-semibold mb-4 ${highlighted ? "text-white" : "text-gray-900"}`}>
      {title}
    </div>
    <div className="flex items-baseline gap-1 mb-6">
      <span className={`text-5xl font-semibold ${highlighted ? "text-white" : "text-gray-900"}`}>
        {price}
      </span>
      <span className={highlighted ? "text-gray-300" : "text-gray-500"}>/{period}</span>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3">
          <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${highlighted ? "text-green-400" : "text-green-500"}`} />
          <span className={highlighted ? "text-gray-200" : "text-gray-600"}>{feature}</span>
        </li>
      ))}
    </ul>
    <Link href={ctaLink} className="block">
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

// Testimonial Card Component with Memoji
const TestimonialCard = ({
  quote,
  author,
  role,
  memoji,
}: {
  quote: string;
  author: string;
  role: string;
  memoji: string;
}) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex gap-1 mb-5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-700 text-lg leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
    <div className="flex items-center gap-4">
      <Image
        src={memoji}
        alt={author}
        width={48}
        height={48}
        className="w-12 h-12 rounded-full object-cover"
      />
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

// Business categories for onboarding
const BUSINESS_CATEGORIES = [
  "E-commerce / Retail",
  "SaaS / Technology",
  "Marketing Agency",
  "Finance / Insurance",
  "Healthcare",
  "Real Estate",
  "Education",
  "Travel / Hospitality",
  "Food & Restaurant",
  "Professional Services",
  "Other",
];

// Onboarding Modal Component
const OnboardingModal = ({
  isOpen,
  onClose,
  initialUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialUrl: string;
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    url: initialUrl,
    businessName: "",
    category: "",
    competitors: ["", "", ""],
  });

  // Update URL when initialUrl changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, url: initialUrl }));
  }, [initialUrl]);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - redirect to payment/signup
      window.location.href = `/signup?url=${encodeURIComponent(formData.url)}&name=${encodeURIComponent(formData.businessName)}&category=${encodeURIComponent(formData.category)}&competitors=${encodeURIComponent(formData.competitors.filter(c => c).join(','))}`;
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.url && formData.url.includes('.');
      case 2:
        return formData.businessName.trim().length > 0;
      case 3:
        return formData.category.length > 0;
      case 4:
        return true; // Competitors are optional
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: URL Confirmation */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Let&apos;s audit your website
                </h3>
                <p className="text-gray-600">
                  Confirm the URL you want to analyze for AI visibility
                </p>
              </div>
              <div>
                <Label htmlFor="url" className="text-sm font-medium text-gray-700">
                  Website URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Name */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  What&apos;s your brand name?
                </h3>
                <p className="text-gray-600">
                  We&apos;ll search for this name across AI models
                </p>
              </div>
              <div>
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                  Brand / Business Name
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Acme Inc."
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  What&apos;s your industry?
                </h3>
                <p className="text-gray-600">
                  This helps us generate relevant prompts and FAQs
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFormData({ ...formData, category })}
                    className={`p-3 text-sm rounded-xl border-2 transition-all text-left ${
                      formData.category === category
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Competitors */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Who are your competitors?
                </h3>
                <p className="text-gray-600">
                  Optional: Add up to 3 competitor URLs to compare
                </p>
              </div>
              <div className="space-y-3">
                {formData.competitors.map((competitor, index) => (
                  <Input
                    key={index}
                    type="url"
                    value={competitor}
                    onChange={(e) => {
                      const newCompetitors = [...formData.competitors];
                      newCompetitors[index] = e.target.value;
                      setFormData({ ...formData, competitors: newCompetitors });
                    }}
                    placeholder={`Competitor ${index + 1} URL (optional)`}
                    className="h-12 rounded-xl"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl px-6"
            >
              {step === totalSteps ? "Start Audit" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  s === step ? "bg-purple-500 w-6" : s < step ? "bg-purple-300" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Cal.com Embed Modal Component
const CalComModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cal.com Embed */}
        <div className="h-[600px]">
          <iframe
            src="https://cal.com/showyourbrand/presentation-of-showyourbrand?embed=true&theme=light"
            width="100%"
            height="100%"
            frameBorder="0"
            className="rounded-3xl"
          />
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);

  const handleStartAudit = () => {
    if (url && url.includes('.')) {
      setShowOnboarding(true);
    }
  };

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
        "Yes! Our Agency plan includes fully customizable white-label reports with your branding. You can add your logo, colors, and custom messaging to present professional GEO audits to your clients under your own brand.",
    },
  ];

  return (
    <>
      <TagSEO
        canonicalSlug=""
        title="AISEO - Stop Being Invisible to AI | GEO Optimization Platform"
        description="The first Generative Engine Optimization (GEO) platform. Audit, analyze, and optimize your brand's presence across all major AI models."
      />
      <TagSchema />

      {/* Custom styles for marquee animation */}
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
          animation: marquee 12s linear infinite;
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
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16 relative">
              {/* Logo - Left */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <span className="font-heading font-bold text-gray-900 tracking-tight">
                  ShowYourBrand
                </span>
              </Link>

              {/* Nav - Centered */}
              <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <a href="#features" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  Features
                </a>
                <a href="#process" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  Process
                </a>
                <a href="#pricing" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  Pricing
                </a>
                <a href="#faq" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  FAQ
                </a>
              </nav>

              {/* Login - Right */}
              <Link href="/login" className="ml-auto">
                <Button variant="ghost" className="text-sm font-medium">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-16 md:pt-20 pb-8 px-4 relative overflow-hidden">
          {/* Decorative gradient blobs */}
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-400/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-400/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-orange-300/40 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-medium text-gray-900 mb-6 leading-tight">
              Stop being <span className="relative inline-block">invisible<HandDrawnUnderline /></span> to AI
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-4 max-w-2xl mx-auto">
              The first Generative Engine Optimization (GEO) platform. Audit,
              analyze, and optimize your brand&apos;s presence across all major AI
              models.
            </p>

            {/* Animated AI Model Marquee with real logos */}
            <AIModelMarquee />

            {/* URL Input Section */}
            <div className="mt-10 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-xl border border-white/50">
                <div className="flex-1 flex items-center gap-2 px-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="url"
                    placeholder="Enter your website URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartAudit()}
                    className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent"
                  />
                </div>
                <Button
                  onClick={handleStartAudit}
                  className="bg-[#1E293B] hover:bg-[#334155] text-white rounded-full px-6 shadow-lg"
                >
                  Run Free Audit →
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCalModal(true)}
                  className="rounded-full border-gray-300 text-gray-700 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-gray-400"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a Strategy Call
                </Button>
              </div>

              <p className="text-xs text-gray-600 mt-4 font-medium">
                NO CREDIT CARD REQUIRED • 100 AI ANALYSIS
              </p>
            </div>
          </div>
        </section>

        {/* The GEO Advantage Section */}
        <section id="features" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                The GEO Advantage
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Why traditional SEO isn&apos;t enough anymore.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Visibility</h3>
                <p className="text-gray-600 leading-relaxed">
                  Ensure your brand is cited as the primary source when users ask AI models about your industry.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Competitive Gap</h3>
                <p className="text-gray-600 leading-relaxed">
                  Identify where competitors are being recommended by LLMs and you are not.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Maximize ROI</h3>
                <p className="text-gray-600 leading-relaxed">
                  Capture high-intent traffic from users who have already moved past traditional search engines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section id="process" className="py-20 px-4 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left column - Text */}
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                  Your competitors are already
                  <br />
                  <span className="italic text-purple-600">winning AI search</span>
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Every day, millions of potential customers ask AI for recommendations. If your brand isn&apos;t being cited, you&apos;re losing deals to competitors who are. We show you exactly where you stand—and how to fix it.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">See What AI Says About You</h4>
                      <p className="text-gray-600 text-sm">Real queries. Real responses. Know exactly how ChatGPT, Claude, and Perplexity describe your brand.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Outrank Your Competition</h4>
                      <p className="text-gray-600 text-sm">Discover which competitors are getting recommended instead of you—and steal their playbook.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Actionable Fixes in Minutes</h4>
                      <p className="text-gray-600 text-sm">Copy-paste schema markup, optimized FAQs, and content suggestions you can implement today.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Visualization */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-gray-500 font-medium">Live AI Analysis</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Your Brand</span>
                </div>

                {/* AI Visibility Score */}
                <div className="text-center mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="text-5xl font-bold text-gray-900 mb-1">73<span className="text-2xl text-gray-400">%</span></div>
                  <div className="text-sm text-gray-600">GEO Health Score</div>
                  <div className="text-xs text-orange-500 mt-1 font-medium">⚠️ Room for improvement</div>
                </div>

                {/* Competitor comparison */}
                <div className="space-y-3 mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">vs. Top Competitors</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-24 truncate">You</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: '73%' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-10 text-right">73%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-24 truncate">Competitor A</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-green-400 h-full rounded-full" style={{ width: '89%' }} />
                    </div>
                    <span className="text-sm font-semibold text-green-600 w-10 text-right">89%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-24 truncate">Competitor B</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full" style={{ width: '81%' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-10 text-right">81%</span>
                  </div>
                </div>

                {/* Key insights */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <div className="text-center py-3 bg-red-50 rounded-xl">
                    <div className="text-lg font-bold text-red-600">12</div>
                    <div className="text-xs text-gray-600">Missing Citations</div>
                  </div>
                  <div className="text-center py-3 bg-green-50 rounded-xl">
                    <div className="text-lg font-bold text-green-600">+340%</div>
                    <div className="text-xs text-gray-600">Potential Traffic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seamless Integration Section - Compact with real logos */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">
              Seamless Integration with your CMS
            </h3>
            <CMSLogos />
          </div>
        </section>

        {/* Pricing Section - Redesigned */}
        <section id="pricing" className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600">Choose the plan that fits your needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-center">
              <PricingCard
                title="STARTER"
                price="€299"
                period="mo"
                features={[
                  "5 AI Audits per month",
                  "Basic Competitor Analysis",
                  "Weekly Reporting",
                  "Email Support",
                ]}
                ctaText="Get Started"
                ctaLink="/signup?plan=starter"
              />
              <PricingCard
                title="PRO"
                price="€499"
                period="mo"
                features={[
                  "20 AI Audits per month",
                  "Advanced Semantic Gap Analysis",
                  "Daily Rank Tracking",
                  "Priority Support",
                  "Custom Recommendations",
                ]}
                highlighted={true}
                ctaText="Get Started"
                ctaLink="/signup?plan=pro"
              />
              <PricingCard
                title="AGENCY"
                price="€999"
                period="mo"
                features={[
                  "Unlimited Audits",
                  "Whitelabel Reports",
                  "API Access",
                  "Dedicated Account Manager",
                  "Custom Integrations",
                ]}
                ctaText="Contact Sales"
                ctaLink="/contact"
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section - Separate */}
        <section className="py-16 px-4 bg-gradient-to-b from-transparent to-purple-50/50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Trusted by innovators
              </h2>
              <p className="text-gray-600">See what our customers are saying</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="We saw a 40% increase in referral traffic from Perplexity within 2 weeks of using ShowYourBrand.ai. The insights are incredible."
                author="Sarah Jenkins"
                role="CMO at TechFlow"
                memoji="/memoji/memoji-1.svg"
              />
              <TestimonialCard
                quote="Finally, a tool that demystifies how LLMs perceive our brand. The semantic gap analysis is pure gold for our marketing team."
                author="Marc Dubois"
                role="Founder, Creative Digital"
                memoji="/memoji/memoji-2.svg"
              />
              <TestimonialCard
                quote="As an agency, we needed proof our GEO strategies work. ShowYourBrand gives us the data to show clients exactly where they stand with AI search."
                author="Elena Rodriguez"
                role="Director, Apex Marketing"
                memoji="/memoji/memoji-3.svg"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section - Separate */}
        <section id="faq" className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-3">
                Common Questions
              </h2>
              <p className="text-gray-600">Everything you need to know about GEO</p>
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
        </section>

        {/* CTA Section - Full Hero Size */}
        <section className="pt-16 md:pt-24 pb-20 md:pb-28 px-4 bg-[#1E293B] relative overflow-hidden">
          {/* Decorative gradient blobs */}
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl font-medium text-white mb-6 leading-tight">
              Ready to dominate AI search?
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
              Join hundreds of brands already optimizing for the future of search. Start your free audit today and see exactly where you stand.
            </p>

            {/* URL Input Section */}
            <div className="mt-10 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-xl border border-white/20">
                <div className="flex-1 flex items-center gap-2 px-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="url"
                    placeholder="Enter your website URL"
                    className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent"
                  />
                </div>
                <Button className="bg-[#1E293B] hover:bg-[#334155] text-white rounded-full px-6 shadow-lg">
                  Run Free Audit →
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCalModal(true)}
                  className="rounded-full border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a Strategy Call
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-4 font-medium">
                NO CREDIT CARD REQUIRED • 100 AI ANALYSIS
              </p>
            </div>
          </div>
        </section>

        {/* Footer - Redesigned */}
        <footer className="bg-[#1E293B] text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="font-semibold text-white tracking-tight">SHOWYOURBRAND</span>
                </Link>
                <p className="text-gray-400 mb-6 max-w-sm">
                  The first Generative Engine Optimization platform. Make your brand visible to AI.
                </p>
                <div className="flex gap-4">
                  <a href="https://twitter.com" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="https://linkedin.com" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="mailto:contact@showyourbrand.ai" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-3 text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm">
                © 2026 ShowYourBrand.ai. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Made with ❤️ for the AI-first future
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Modals */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        initialUrl={url}
      />
      <CalComModal
        isOpen={showCalModal}
        onClose={() => setShowCalModal(false)}
      />
    </>
  );
}
