import { useState, useEffect, useCallback } from "react";
import { useWaitlistModalStore } from "@/stores";
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
  X,
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
  "Less than 100\u20AC",
  "\u20AC100 - \u20AC200",
  "\u20AC200 - \u20AC500",
  "\u20AC500 - \u20AC1000",
  "More than \u20AC1000",
];

export default function WaitlistModal() {
  const { isOpen, closeWaitlistModal } = useWaitlistModalStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    howFound: "",
    hasGeoExperience: "",
    budgetRange: "",
  });

  const totalSteps = 4;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSubmitting(false);
      setIsSuccess(false);
      setError("");
      setEmailRegistered(false);
      setFormData({ email: "", howFound: "", hasGeoExperience: "", budgetRange: "" });
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape key closes modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") closeWaitlistModal();
  }, [closeWaitlistModal]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const canProceed = () => {
    switch (step) {
      case 1: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 2: return formData.howFound.length > 0;
      case 3: return formData.hasGeoExperience.length > 0;
      case 4: return formData.budgetRange.length > 0;
      default: return false;
    }
  };

  const registerEmail = async () => {
    try {
      await fetch("/api/waitlist/register-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      setEmailRegistered(true);
    } catch {
      // Silent fail - email will be saved on final submit anyway
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sendWelcomeEmail: true }),
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
    if (step === 1 && !emailRegistered) registerEmail();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Success screen
  if (isSuccess) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center px-4"
        onClick={closeWaitlistModal}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-[90vw] max-w-2xl h-[50vh] max-h-[900px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeWaitlistModal}
            className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-heading text-3xl font-medium text-gray-900 mb-4">
              You&apos;re on the list!
            </h2>
            <p className="text-gray-700 text-lg mb-2">
              We&apos;ve sent a confirmation email to{" "}
              <strong>{formData.email}</strong>.
            </p>
            <p className="text-gray-600 mb-8">
              We&apos;ll notify you as soon as ShowYourBrand launches. Early
              members get exclusive access and founding member pricing.
            </p>
            <Button
              onClick={closeWaitlistModal}
              className="bg-[#1E293B] hover:bg-[#334155] text-white rounded-full px-8 h-12 shadow-lg"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center px-4"
      onClick={closeWaitlistModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-[70vw] h-[70vh] max-h-[900px] max-w-3xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeWaitlistModal}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex-1 flex flex-col">
          {/* Center zone: question + answers (vertically centered) */}
          <div className="flex-1 overflow-y-auto px-8 flex flex-col justify-center">
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
                    Be the first to access the most powerful GEO audit
                    platform. Early members get exclusive pricing.
                  </p>
                </div>
                <div>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && canProceed() && handleNext()}
                    placeholder="you@company.com"
                    className="h-12 rounded-xl text-center text-lg"
                    autoFocus
                  />
                </div>
              </div>
            )}

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
                      onClick={() => setFormData({ ...formData, howFound: option })}
                      className={`p-3.5 text-sm rounded-xl border-2 transition-all text-left font-bold ${
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
                      onClick={() => setFormData({ ...formData, hasGeoExperience: option })}
                      className={`p-3.5 text-sm rounded-xl border-2 transition-all text-left font-bold ${
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
                      onClick={() => setFormData({ ...formData, budgetRange: option })}
                      className={`p-3.5 text-sm rounded-xl border-2 transition-all text-left font-bold ${
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

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                {error}
              </div>
            )}
          </div>

          {/* Bottom zone: buttons + dots (always pinned) */}
          <div className="flex-shrink-0 px-8 pb-6 pt-4">
            <div className="flex items-center justify-between mb-4">
              {step > 1 ? (
                <Button variant="ghost" onClick={handleBack} className="text-gray-600">
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

            <div className="flex justify-center gap-2">
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
            <p className="text-center text-xs text-gray-600 mt-3">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
