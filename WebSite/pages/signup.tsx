import React, { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Megaphone,
  UserPlus,
  CreditCard,
  Check,
} from "lucide-react";
import Link from "next/link";
import config from "@/config";

// SEO experience levels
const SEO_EXPERIENCE_LEVELS = [
  {
    value: "beginner" as const,
    label: "Beginner",
    description: "New to SEO, just getting started",
  },
  {
    value: "intermediate" as const,
    label: "Intermediate",
    description: "Familiar with SEO basics, some experience",
  },
  {
    value: "expert" as const,
    label: "Expert",
    description: "Advanced SEO knowledge, years of experience",
  },
];

// Referral sources
const REFERRAL_SOURCES = [
  "Google",
  "LinkedIn",
  "Twitter / X",
  "YouTube",
  "Podcast",
  "A friend",
  "Other",
];

// Step icons for the progress indicator
const STEP_CONFIG = [
  { icon: BarChart3, label: "Experience" },
  { icon: Megaphone, label: "Referral" },
  { icon: UserPlus, label: "Account" },
  { icon: CreditCard, label: "Plan" },
];

// Pricing plan card for step 6
const PlanCard = ({
  name,
  price,
  period,
  features,
  highlighted = false,
  onSelect,
  isLoading,
  note,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  onSelect: () => void;
  isLoading: boolean;
  note?: string;
}) => (
  <div
    className={`relative rounded-2xl p-6 transition-all duration-300 ${
      highlighted
        ? "bg-[#1E293B] text-white shadow-2xl scale-[1.02]"
        : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg"
    }`}
  >
    {highlighted && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          POPULAR
        </span>
      </div>
    )}
    <div
      className={`text-sm font-semibold mb-3 ${highlighted ? "text-white" : "text-gray-900"}`}
    >
      {name}
    </div>
    <div className="flex items-baseline gap-1 mb-4">
      <span
        className={`text-4xl font-semibold ${highlighted ? "text-white" : "text-gray-900"}`}
      >
        {price}
      </span>
      <span className={highlighted ? "text-gray-300" : "text-gray-500"}>
        /{period}
      </span>
    </div>
    {note && (
      <p className={`text-xs mb-3 ${highlighted ? "text-gray-400" : "text-gray-400"}`}>
        {note}
      </p>
    )}
    <ul className="space-y-2 mb-6">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Check
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? "text-green-400" : "text-green-500"}`}
          />
          <span className={highlighted ? "text-gray-200" : "text-gray-600"}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
    <Button
      onClick={onSelect}
      disabled={isLoading}
      className={`w-full h-11 rounded-xl font-semibold transition-all ${
        highlighted
          ? "bg-white text-[#1E293B] hover:bg-gray-100 shadow-lg"
          : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
      }`}
      size="lg"
    >
      {isLoading ? "Redirecting..." : "Select Plan"}
    </Button>
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Onboarding data (steps 1-2)
  const [domain, setDomain] = useState(""); // set from query param only
  const [seoExperience, setSeoExperience] = useState<
    "beginner" | "intermediate" | "expert" | ""
  >("");
  const [referral, setReferral] = useState("");

  // Account data (step 5)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const totalSteps = 4;
  const [initialRouted, setInitialRouted] = useState(false);

  // Handle query params on mount
  useEffect(() => {
    const { url, step: stepParam, plan } = router.query;
    if (url && typeof url === "string") {
      setDomain(url);
    }
    if (plan && typeof plan === "string") {
      setSelectedPlan(plan);
    }
    if (stepParam && typeof stepParam === "string") {
      const parsed = parseInt(stepParam, 10);
      if (parsed >= 1 && parsed <= totalSteps) {
        setStep(parsed);
      }
    }
  }, [router.query]);

  // After OAuth return, send onboarding data to server
  const sendOnboardingData = useCallback(async () => {
    if (typeof window === "undefined") return;

    const storedData = localStorage.getItem("signupOnboardingData");
    if (!storedData) return;

    try {
      const data = JSON.parse(storedData);
      await fetch("/api/user/update-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      localStorage.removeItem("signupOnboardingData");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }
  }, []);


  // Handle authenticated users on the signup page (runs once on initial load)
  useEffect(() => {
    if (status !== "authenticated" || initialRouted) return;

    const isOAuthReturn = router.query.oauth === "1";

    if (isOAuthReturn) {
      setInitialRouted(true);
      const hasOnboardingData = typeof window !== "undefined" && !!localStorage.getItem("signupOnboardingData");

      if (hasOnboardingData) {
        // Came from signup page (filled steps 1-2 before clicking Google at step 3)
        sendOnboardingData();
        setStep(4);
      } else {
        // Came from login page - start onboarding from step 1
        setStep(1);
      }
      return;
    }

    // Authenticated user with a plan parameter (e.g. from landing page CTA)
    if (selectedPlan) {
      setInitialRouted(true);
      setStep(4);
      return;
    }

    // Authenticated user without an active subscription must pick a plan
    // before being allowed into the dashboard.
    const hasActiveSubscription =
      session?.user?.subscriptionStatus === "active" ||
      (session?.user?.auditCredits ?? 0) > 0;

    if (!hasActiveSubscription) {
      setInitialRouted(true);
      setStep(4);
      return;
    }

    // Authenticated user with no special flow - go to the monitoring workspace
    setInitialRouted(true);
    router.push("/app");
  }, [status, session, router, selectedPlan, initialRouted, sendOnboardingData]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return seoExperience.length > 0;
      case 2:
        return referral.length > 0;
      case 3:
        return true; // Validated on submit
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps && canProceed()) {
      // Already authenticated (OAuth): skip step 3 (account creation), save onboarding and go to step 4
      if (step === 2 && status === "authenticated") {
        const onboardingData: Record<string, string> = {};
        if (domain) onboardingData.onboardingDomain = domain;
        if (seoExperience) onboardingData.onboardingSeoExperience = seoExperience;
        if (referral) onboardingData.onboardingReferral = referral;

        fetch("/api/user/update-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(onboardingData),
        }).catch(console.error);

        setStep(4);
        return;
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step <= 1) return;
    // Already authenticated (OAuth): skip step 3 when going back from step 4
    if (step === 4 && status === "authenticated") {
      setStep(2);
      return;
    }
    setStep(step - 1);
  };

  const handleCredentialsSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setAuthError(null);

    let isValid = true;
    if (!name.trim()) {
      setNameError("Full name is required.");
      isValid = false;
    }
    if (!email) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      // Create account with onboarding data
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          onboardingDomain: domain || undefined,
          onboardingSeoExperience: seoExperience || undefined,
          onboardingReferral: referral || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error during signup");
      }

      // Auto-login after account creation
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Account created but login failed - redirect to login
        router.push("/login");
        return;
      }

      // If user selected a plan, redirect to checkout automatically
      if (selectedPlan) {
        // Map plan to priceId. SYB v2 monitoring plans (solo/pro/agency) are the
        // current product; the legacy one-shot audit tiers are kept until
        // billing is fully migrated.
        const planToPriceId: Record<string, { priceId: string; mode: "payment" | "subscription" }> = {
          solo: { priceId: config.monitoring.solo.priceId, mode: "subscription" },
          pro: { priceId: config.monitoring.pro.priceId, mode: "subscription" },
          agency: { priceId: config.monitoring.agency.priceId, mode: "subscription" },
          data: { priceId: config.stripe.data.priceId, mode: "payment" },
          starter: { priceId: config.stripe.starter.priceId, mode: "payment" },
        };

        const planConfig = planToPriceId[selectedPlan];

        if (planConfig?.priceId) {
          // Redirect to Stripe Checkout
          try {
            const checkoutRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                priceId: planConfig.priceId,
                mode: planConfig.mode
              }),
            });

            const checkoutData = await checkoutRes.json();
            if (checkoutData.success && checkoutData.data?.url) {
              window.location.href = checkoutData.data.url;
              return;
            }
          } catch (error) {
            console.error("Checkout error:", error);
            // Fallback to step 4 if checkout fails
            setStep(4);
            return;
          }
        }
      }

      // No plan selected - advance to pricing step
      setStep(4);
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setAuthError(null);

    // Store onboarding data in localStorage before OAuth redirect
    if (typeof window !== "undefined") {
      const onboardingData: Record<string, string> = {};
      if (domain) onboardingData.onboardingDomain = domain;
      if (seoExperience) onboardingData.onboardingSeoExperience = seoExperience;
      if (referral) onboardingData.onboardingReferral = referral;

      localStorage.setItem(
        "signupOnboardingData",
        JSON.stringify(onboardingData)
      );
    }

    try {
      await signIn("google", {
        callbackUrl: "/api/auth/session-redirect",
      });
    } catch (error) {
      console.error("Google signup error:", error);
      setAuthError("An error occurred while signing up with Google");
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (
    priceId: string,
    mode: "payment" | "subscription"
  ) => {
    if (!priceId) {
      setAuthError("This plan is not yet configured. Please contact support.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      setAuthError(error.message || "Failed to start checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100">
        <div className="animate-pulse text-purple-600 font-medium">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100 px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-[#1E293B] transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to home</span>
      </Link>

      <div className="w-full max-w-6xl relative z-10 mb-8">
        {/* Logo */}
        

        {/* Step progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEP_CONFIG.map((s, i) => {
            const StepIcon = s.icon;
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;

            return (
              <React.Fragment key={stepNum}>
                <div className="flex flex-col items-center gap-1 mt-5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#1E293B] text-white shadow-lg"
                        : isCompleted
                          ? "bg-purple-500 text-white"
                          : "bg-white/80 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isActive
                        ? "text-gray-900"
                        : isCompleted
                          ? "text-purple-600"
                          : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_CONFIG.length - 1 && (
                  <div
                    className={`w-6 h-0.5 mt-[-16px] sm:mt-[-4px] ${
                      stepNum < step ? "bg-purple-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error message */}
        {authError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
            role="alert"
          >
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
          {/* Step 1: SEO Experience */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  How much SEO experience do you have?
                </h2>
                <p className="text-gray-600">
                  We&apos;ll tailor recommendations to your level
                </p>
              </div>
              <div className="space-y-3">
                {SEO_EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSeoExperience(level.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      seoExperience === level.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`font-medium ${
                        seoExperience === level.value
                          ? "text-purple-700"
                          : "text-gray-900"
                      }`}
                    >
                      {level.label}
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        seoExperience === level.value
                          ? "text-purple-600"
                          : "text-gray-500"
                      }`}
                    >
                      {level.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Referral */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  How did you hear about us?
                </h2>
                <p className="text-gray-600">
                  Help us understand where our users come from
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {REFERRAL_SOURCES.map((source) => (
                  <button
                    key={source}
                    onClick={() => setReferral(source)}
                    className={`p-3 text-sm rounded-xl border-2 transition-all text-left ${
                      referral === source
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Account Creation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Create your account
                </h2>
                <p className="text-gray-600">
                  Sign up to start your AI visibility audit
                </p>
                {selectedPlan &&
                  (() => {
                    const plan =
                      config.monitoring[
                        selectedPlan as keyof typeof config.monitoring
                      ];
                    if (!plan || typeof plan !== "object" || !("price" in plan))
                      return null;
                    return (
                      <div className="mt-4 inline-block bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                        <p className="text-sm font-medium text-purple-700">
                          Plan{" "}
                          <span className="font-bold">{plan.name}</span> : €
                          {plan.price}/mois
                        </p>
                      </div>
                    );
                  })()}
              </div>

              {/* Google Sign-up */}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium h-12 rounded-xl"
                onClick={handleGoogleSignup}
                disabled={isLoading}
              >
                <FcGoogle size={20} />
                <span>Sign up with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500">
                    Or sign up with email
                  </span>
                </div>
              </div>

              {/* Email Signup Form */}
              <form onSubmit={handleCredentialsSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`mt-1.5 h-12 rounded-xl ${nameError ? "border-red-500" : "border-gray-200"}`}
                    disabled={isLoading}
                  />
                  {nameError && (
                    <p className="text-red-500 text-xs mt-1">{nameError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`mt-1.5 h-12 rounded-xl ${emailError ? "border-red-500" : "border-gray-200"}`}
                    disabled={isLoading}
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`mt-1.5 h-12 rounded-xl ${passwordError ? "border-red-500" : "border-gray-200"}`}
                    disabled={isLoading}
                  />
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#1E293B] hover:bg-[#334155] text-white font-medium rounded-xl shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#1E293B] hover:text-slate-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Choisissez votre plan
                </h2>
                <p className="text-gray-600">
                  Monitoring GEO continu, annulable à tout moment.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 items-center">
                <PlanCard
                  name={config.monitoring.solo.name}
                  price={`\u20AC${config.monitoring.solo.price}`}
                  period="mo"
                  features={[
                    "2 projets suivis",
                    "3 moteurs IA",
                    "Monitoring hebdomadaire",
                    "Score par LLM + historique",
                  ]}
                  onSelect={() =>
                    handleSelectPlan(config.monitoring.solo.priceId, "subscription")
                  }
                  isLoading={isLoading}
                />
                <PlanCard
                  name={config.monitoring.pro.name}
                  price={`\u20AC${config.monitoring.pro.price}`}
                  period="mo"
                  features={[
                    "10 projets suivis",
                    "Tous les moteurs (ChatGPT, Claude, Perplexity, Gemini)",
                    "Monitoring quotidien",
                    "Concurrents, sources citées & alertes email",
                  ]}
                  highlighted
                  onSelect={() =>
                    handleSelectPlan(config.monitoring.pro.priceId, "subscription")
                  }
                  isLoading={isLoading}
                />
                <PlanCard
                  name={config.monitoring.agency.name}
                  price={`\u20AC${config.monitoring.agency.price}`}
                  period="mo"
                  features={[
                    "Projets illimités",
                    "Tous les moteurs, monitoring quotidien",
                    "Rapport PDF en marque blanche",
                    "Idéal agences (10–20 clients)",
                  ]}
                  onSelect={() =>
                    handleSelectPlan(config.monitoring.agency.priceId, "subscription")
                  }
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* Navigation (steps 1-2 only, step 3 has its own submit, step 4 has plan buttons) */}
          {step <= 2 && (
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
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Back button for step 3 */}
          {step === 3 && (
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* Back button for step 4 (pricing) */}
          {step === 4 && (
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </div>

        {/* Terms */}
        {step === 3 && (
          <p className="mt-4 text-center text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#1E293B]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#1E293B]">
              Privacy Policy
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
