import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    if (typeof window !== "undefined") {
      localStorage.setItem("isNewUser", "true");
      localStorage.setItem("googleSignup", "true");
    }

    try {
      await signIn("google", { callbackUrl: "/api/auth/session-redirect" });
    } catch (error) {
      console.error("Google signup error:", error);
      setAuthError("An error occurred while signing up with Google");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setNameError("");
    setCompanyError("");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error during signup");
      }

      localStorage.setItem("pendingSignupEmail", email);
      router.push("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100">
        <div className="animate-pulse text-purple-600 font-medium">Loading...</div>
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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              SHOWYOURBRAND
            </span>
          </Link>
          <h1 className="font-heading text-4xl font-medium text-gray-900">
            Create your account
          </h1>
          <p className="text-gray-600 mt-2">
            Start optimizing your AI visibility today
          </p>
        </div>

        {authError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
            role="alert"
          >
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 space-y-6">
          {/* Google Sign-up */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-3 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium h-12 rounded-xl"
            onClick={handleGoogleSignIn}
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

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
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
                required
                className={`mt-1.5 h-12 rounded-xl ${nameError ? "border-red-500" : "border-gray-200"}`}
                disabled={isLoading}
              />
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="company" className="text-gray-700 font-medium">
                Company <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Your company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`mt-1.5 h-12 rounded-xl ${companyError ? "border-red-500" : "border-gray-200"}`}
                disabled={isLoading}
              />
              {companyError && (
                <p className="text-red-500 text-xs mt-1">{companyError}</p>
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
                required
                className={`mt-1.5 h-12 rounded-xl ${emailError ? "border-red-500" : "border-gray-200"}`}
                disabled={isLoading}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
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
                required
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
              {isLoading ? (
                "Creating account..."
              ) : (
                <>
                  <UserPlus size={18} className="mr-2" />
                  Create account
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#1E293B] hover:text-slate-700"
          >
            Sign in
          </Link>
        </p>

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
      </div>
    </div>
  );
}
