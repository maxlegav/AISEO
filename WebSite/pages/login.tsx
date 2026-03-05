import React, { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_STATE !== "production") {
      router.replace("/");
    }
  }, [router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.error) {
      setAuthError(getFriendlyErrorMessage(router.query.error as string));
      setSuccessMessage(null);
      router.replace("/login", undefined, { shallow: true });
    }

    if (router.query.success === "1") {
      setSuccessMessage(
        "Your subscription has been activated! You can now log in."
      );
      setAuthError(null);
      router.replace("/login", undefined, { shallow: true });
    }
  }, [router.query.error, router.query.success, router]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      // Small delay so user can see the page and use the "switch account" link if needed
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    setSuccessMessage(null);
    try {
      await signIn("google", { callbackUrl: "/api/auth/session-redirect" });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuthError("An error occurred while signing in with Google");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setAuthError(null);
    setSuccessMessage(null);

    let isValid = true;
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
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        const errorMessage = getFriendlyErrorMessage(res.error);
        if (errorMessage) {
          setAuthError(errorMessage);
        }
      } else if (res?.ok) {
        router.push("/dashboard");
      } else {
        setAuthError("An unexpected error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendlyErrorMessage = (error: string): string => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return "This email is already registered with a different sign-in method. Please use your original sign-in method.";
      case "EmailSignin":
        return "Unable to send sign-in email. Please try again later.";
      case "CredentialsSignin":
        return "Invalid credentials. Please check your email and password.";
      case "USER_NOT_FOUND":
        setTimeout(() => router.push("/signup"), 0);
        return "No account found with this email. Redirecting to signup...";
      default:
        return "Authentication failed. Please try again.";
    }
  };

  if (status === "loading") {
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
          
          <h1 className="font-heading text-4xl font-medium text-gray-900">
            Welcome back
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to access your GEO dashboard
          </p>
        </div>

        {status === "authenticated" && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-6">
            <p className="text-sm">
              You are already logged in as <span className="font-semibold">{_session?.user?.email}</span>.
              Redirecting to dashboard...
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm font-medium text-blue-700 underline hover:text-blue-900"
              >
                Go to dashboard
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm font-medium text-red-600 underline hover:text-red-800"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {authError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
            role="alert"
          >
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6"
            role="alert"
          >
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        

        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 space-y-6">
          {/* Google Sign-in */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-3 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium h-12 rounded-xl"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Sign-in Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
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
                autoComplete="current-password"
                placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#1E293B] border-gray-300 rounded focus:ring-slate-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#1E293B] hover:text-slate-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#1E293B] hover:bg-[#334155] text-white font-medium rounded-xl shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </div>
        <p className="mt-8 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup?plan=pro"
            className="font-semibold text-[#1E293B] hover:text-slate-700"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-500">
          By signing in, you agree to our{" "}
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
