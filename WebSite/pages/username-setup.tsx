import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, LogOut } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";

export default function UsernameSetupPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.username) {
      router.push(`/${session.user.username}`);
    }
  }, [status, session, router]);

  // Debounced check
  const checkAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.success) {
        setAvailable(data.data.available);
        setReason(data.data.reason || "");
      }
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkAvailability(username);
      } else {
        setAvailable(null);
        setReason("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/user/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (data.success) {
        // Update the session to include the new username
        await update();
        router.push(`/${data.data.username}`);
      } else {
        setError(data.message || "Failed to set username");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AISEO</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {String(t("username.title"))}
          </h1>
          <p className="text-gray-600">
            {String(t("username.subtitle"))}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {String(t("username.label"))}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  aiseo.com/
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className="w-full pl-24 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="your-username"
                  maxLength={30}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  {!checking && available === true && <Check className="w-5 h-5 text-green-500" />}
                  {!checking && available === false && <X className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {username.length > 0 && username.length < 3 && (
                <p className="text-sm text-gray-400 mt-2">
                  {String(t("username.minLength"))}
                </p>
              )}
              {available === false && reason && (
                <p className="text-sm text-red-500 mt-2">{reason}</p>
              )}
              {available === true && (
                <p className="text-sm text-green-600 mt-2">
                  {String(t("username.available"))}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!available || submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white h-12 text-base disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                String(t("username.confirm"))
              )}
            </Button>
          </form>
        </div>

        {/* Logout link */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mx-auto"
        >
          <LogOut className="w-4 h-4" />
          {String(t("btn.logout"))}
        </button>
      </div>
    </div>
  );
}
