import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  User,
  CreditCard,
  Shield,
  Trash2,
  Check,
  X,
  Loader2,
  ExternalLink,
  Zap,
  Star,
} from "lucide-react";
import { useLanguage, Language } from "@/components/LanguageContext";
import config from "@/config";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  // Profile state
  const [username, setUsername] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Subscription state - fetched from API for accuracy
  const [subscriptionTier, setSubscriptionTier] = useState<string>("none");
  const [auditCredits, setAuditCredits] = useState(0);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Stripe portal
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [buyingTier, setBuyingTier] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.username) {
      setUsername(session.user.username);
    }
  }, [session]);

  // Fetch real subscription data from API (not just session which can be stale)
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/user/check-subscription");
        const data = await res.json();
        if (data.success) {
          setSubscriptionTier(data.subscriptionTier || "none");
          setAuditCredits(data.auditCredits || 0);
        }
      } catch {
        // Fallback to session data
        setSubscriptionTier(session?.user?.subscriptionTier || "none");
        setAuditCredits(session?.user?.auditCredits || 0);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscription();
  }, [status, session]);

  // Debounced username check
  const checkUsername = useCallback(
    async (value: string) => {
      if (value === session?.user?.username) {
        setUsernameAvailable(null);
        return;
      }
      if (value.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.success) {
          setUsernameAvailable(data.data.available);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    },
    [session]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username && username !== session?.user?.username) {
        checkUsername(username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername, session]);

  const handleSaveUsername = async () => {
    if (!usernameAvailable && username !== session?.user?.username) return;
    if (username === session?.user?.username) {
      setProfileMessage(String(t("settings.noChanges")));
      return;
    }

    setProfileSaving(true);
    setProfileMessage("");

    try {
      const res = await fetch("/api/user/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        await update();
        setProfileMessage(String(t("settings.usernameSaved")));
        setUsernameAvailable(null);
      } else {
        setProfileMessage(data.message || "Failed to update username");
      }
    } catch {
      setProfileMessage("An error occurred");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMessage(String(t("settings.passwordChanged")));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordError(data.message || "Failed to change password");
      }
    } catch {
      setPasswordError("An error occurred");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.url;
      }
    } catch {
      router.push("/#pricing");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleBuyAudit = async (priceId: string, tier: string) => {
    setBuyingTier(tier);
    try {
      const res = await fetch("/api/checkout/buy-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // ignore
    } finally {
      setBuyingTier(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: "DELETE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await signOut({ callbackUrl: "/" });
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  if (status === "loading") {
    return (
      <DashboardLayout activeMenu="settings">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  // Determine the display label for subscription
  const getTierDisplay = () => {
    if (loadingSubscription) return "...";
    if (auditCredits > 0 && subscriptionTier === "none") {
      // User has credits (paid one-shot) but tier shows none
      return "Active (credits)";
    }
    return subscriptionTier;
  };

  return (
    <DashboardLayout activeMenu="settings">
      <h1 className="text-4xl font-heading font-medium text-gray-900 mb-8">
        {String(t("dashboard.settings"))}
      </h1>

      {/* Profile Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {String(t("settings.profile"))}
          </h2>
        </div>

        <div className="space-y-4 max-w-md">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {String(t("username.label"))}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                maxLength={30}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {!checkingUsername && usernameAvailable === true && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {String(t("settings.language"))}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  language === "en"
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange("fr")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  language === "fr"
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                Fran&ccedil;ais
              </button>
            </div>
          </div>

          <Button
            onClick={handleSaveUsername}
            disabled={profileSaving || (usernameAvailable === false)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
          >
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : String(t("common.save"))}
          </Button>

          {profileMessage && (
            <p className="text-sm text-green-600">{profileMessage}</p>
          )}
        </div>
      </div>

      {/* Subscription Section */}
      <div id="subscription" className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {String(t("settings.subscription"))}
            </h2>
          </div>
          <Button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-xs"
          >
            {loadingPortal ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                {String(t("settings.manageSubscription"))}
                <ExternalLink className="w-3 h-3" />
              </>
            )}
          </Button>
        </div>

        {/* Current status */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50/80 rounded-xl">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700 font-medium">{String(t("settings.auditCreditsRemaining"))}:</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{loadingSubscription ? "..." : auditCredits}</span>
          {subscriptionTier !== "none" && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 capitalize ml-auto">
              {getTierDisplay()}
            </span>
          )}
        </div>

        {/* Buy Credits subtitle */}
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{String(t("settings.buyCredits"))}</h3>
          <p className="text-sm text-gray-500">{String(t("settings.buyCreditsSubtitle"))}</p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Basic */}
          <div className="relative border border-gray-200/80 rounded-xl p-6 bg-white/60 hover:shadow-md transition-all">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{config.stripe.basic.name}</h4>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">{config.stripe.basic.price}€</span>
              <span className="text-sm text-gray-400 line-through">{config.stripe.basic.oldPrice}€</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{String(t("settings.perAudit"))}</p>
            <ul className="space-y-2 mb-6">
              {config.stripe.basic.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f.name}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleBuyAudit(config.stripe.basic.priceId, "basic")}
              disabled={buyingTier === "basic" || !config.stripe.basic.priceId}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full"
            >
              {buyingTier === "basic" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                String(t("settings.buyNow"))
              )}
            </Button>
          </div>

          {/* Pro */}
          <div className="relative border-2 border-orange-300 rounded-xl p-6 bg-orange-50/40 hover:shadow-md transition-all">
            <div className="absolute -top-3 right-4 px-3 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              {String(t("settings.popular"))}
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{config.stripe.pro.name}</h4>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">{config.stripe.pro.price}€</span>
              <span className="text-sm text-gray-400 line-through">{config.stripe.pro.oldPrice}€</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{String(t("settings.perAudit"))}</p>
            <ul className="space-y-2 mb-6">
              {config.stripe.pro.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f.name}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleBuyAudit(config.stripe.pro.priceId, "pro")}
              disabled={buyingTier === "pro" || !config.stripe.pro.priceId}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full"
            >
              {buyingTier === "pro" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                String(t("settings.buyNow"))
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {String(t("settings.security"))}
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {String(t("settings.currentPassword"))}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {String(t("settings.newPassword"))}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {String(t("settings.confirmNewPassword"))}
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-sm text-green-600">{passwordMessage}</p>
          )}

          <Button
            type="submit"
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmNewPassword}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
          >
            {passwordSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              String(t("settings.changePassword"))
            )}
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-red-200/60 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">
            {String(t("settings.dangerZone"))}
          </h2>
        </div>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {String(t("settings.deleteAccount"))}
          </Button>
        ) : (
          <div className="space-y-4 max-w-md">
            <p className="text-sm text-red-600">
              {String(t("settings.deleteWarning"))}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {String(t("settings.currentPassword"))}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {String(t("settings.typeDelete"))}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE" || !deletePassword}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  String(t("settings.confirmDelete"))
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                }}
                variant="outline"
              >
                {String(t("common.cancel"))}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
