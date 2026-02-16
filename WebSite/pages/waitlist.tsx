import TagSEO from "@/components/TagSEO";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  MessageSquare,
  BarChart3,
  Wallet,
  Check,
  Loader2,
} from "lucide-react";

const HOW_FOUND_OPTIONS = [
  "Social Media (Twitter, LinkedIn...)",
  "Google Search",
  "Word of Mouth",
  "Blog / Article",
  "YouTube / Video",
  "Other",
];

const GEO_EXPERIENCE_OPTIONS = [
  "No, I've never heard of GEO",
  "I know what it is but never tried it",
  "Yes, I've done some GEO work",
  "Yes, I do GEO professionally",
];

const BUDGET_OPTIONS = [
  "Less than €50",
  "€50 - €150",
  "€150 - €300",
  "€300 - €500",
  "More than €500",
];

export default function WaitlistPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    howFound: "",
    hasGeoExperience: "",
    budgetRange: "",
  });

  const totalSteps = 4;

  const canProceed = () => {
    switch (step) {
      case 1:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 2:
        return formData.howFound.length > 0;
      case 3:
        return formData.hasGeoExperience.length > 0;
      case 4:
        return formData.budgetRange.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (isSuccess) {
    return (
      <>
        <TagSEO
          canonicalSlug="waitlist"
          title="You're on the list! - ShowYourBrand"
          description="You've joined the ShowYourBrand waitlist. We'll notify you when we launch."
        />
        <main className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100 flex items-center justify-center px-4 relative overflow-hidden">
          {/* Decorative blobs - same as landing page */}
          <div className="absolute top-10 left-0 w-96 h-96 bg-purple-400/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-400/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-orange-300/40 rounded-full blur-3xl" />

          <div className="relative z-10 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-4">
              You&apos;re on the list!
            </h1>
            <p className="text-gray-700 text-lg mb-2">
              We&apos;ve sent a confirmation email to{" "}
              <strong>{formData.email}</strong>.
            </p>
            <p className="text-gray-600 mb-8">
              We&apos;ll notify you as soon as ShowYourBrand launches. Early members get
              exclusive access and founding member pricing.
            </p>
            <Link href="/">
              <Button className="bg-[#1E293B] hover:bg-[#334155] text-white rounded-full px-8 h-12 shadow-lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to homepage
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TagSEO
        canonicalSlug="waitlist"
        title="Join the Waitlist - ShowYourBrand"
        description="Be the first to know when ShowYourBrand launches. Join our waitlist and get early access to the first GEO platform."
      />

      <main className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100 relative overflow-hidden">
        {/* Decorative blobs - same as landing page */}
        <div className="absolute top-10 left-0 w-96 h-96 bg-purple-400/40 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-pink-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-orange-300/40 rounded-full blur-3xl" />

        {/* Header - same as landing page */}
        <header className="sticky top-0 z-50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <Image
                    src="/syb_logo_transparent.png"
                    alt="logo"
                    width={120}
                    height={120}
                  />
                </div>
                <span className="font-heading text-4xl font-bold text-gray-900 tracking-tight">
                  ShowYourBrand
                </span>
              </Link>
              <Link href="/" className="ml-auto">
                <Button variant="ghost" className="text-sm font-medium">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12 relative z-10">
          <div className="w-full max-w-lg">
            {/* Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>

              <div className="p-8">
                {/* Step 1: Email */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Join the waitlist
                      </h2>
                      <p className="text-gray-600">
                        Be the first to access the most powerful GEO audit platform.
                        Early members get exclusive pricing.
                      </p>
                    </div>
                    <div>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && canProceed() && handleNext()}
                        placeholder="you@company.com"
                        className="h-12 rounded-xl text-center text-lg"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: How did you find us */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-pink-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        How did you find us?
                      </h2>
                      <p className="text-gray-600">
                        This helps us understand where our community comes from
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {HOW_FOUND_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            setFormData({ ...formData, howFound: option })
                          }
                          className={`p-3.5 text-sm rounded-xl border-2 transition-all text-left ${
                            formData.howFound === option
                              ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: GEO experience */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-orange-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Have you done GEO before?
                      </h2>
                      <p className="text-gray-600">
                        Generative Engine Optimization for your website
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {GEO_EXPERIENCE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            setFormData({ ...formData, hasGeoExperience: option })
                          }
                          className={`p-3.5 text-sm rounded-xl border-2 transition-all text-left ${
                            formData.hasGeoExperience === option
                              ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Budget */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Budget for an audit?
                      </h2>
                      <p className="text-gray-600">
                        How much would you be willing to pay for a complete GEO audit?
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {BUDGET_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            setFormData({ ...formData, budgetRange: option })
                          }
                          className={`p-3.5 text-sm rounded-xl border-2 transition-all text-left ${
                            formData.budgetRange === option
                              ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                    {error}
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
                    disabled={!canProceed() || isSubmitting}
                    className="bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : step === totalSteps ? (
                      <>
                        Join Waitlist
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Step indicator */}
                <div className="flex justify-center gap-2 mt-6">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-all ${
                        s === step
                          ? "bg-purple-500 w-6"
                          : s < step
                            ? "bg-purple-300"
                            : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer text */}
            <p className="text-center text-xs text-gray-600 mt-6">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
