import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Briefcase,
  FileText,
  Link2,
  Users,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

const STEPS = [
  { key: "domain", icon: Globe },
  { key: "category", icon: Briefcase },
  { key: "description", icon: FileText },
  { key: "subUrls", icon: Link2 },
  { key: "competitors", icon: Users },
  { key: "confirm", icon: CheckCircle },
] as const;

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [subUrls, setSubUrls] = useState<string[]>([""]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && !session?.user?.username) {
      router.push("/username-setup");
    }
  }, [status, session, router]);

  const addUrl = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter([...list, ""]);
  };

  const removeUrl = (
    index: number,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(list.filter((_, i) => i !== index));
  };

  const updateUrl = (
    index: number,
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const updated = [...list];
    updated[index] = value;
    setter(updated);
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return name.trim().length > 0 && primaryUrl.trim().length > 0;
      case 1:
        return category.trim().length > 0;
      case 2:
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const cleanSubUrls = subUrls.filter((u) => u.trim().length > 0);
      const cleanCompetitorUrls = competitorUrls.filter(
        (u) => u.trim().length > 0,
      );

      // Step 1: Create the business
      const businessRes = await fetch("/api/businesses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          primaryUrl: primaryUrl.trim(),
          category: category.trim(),
          description: description.trim() || undefined,
          subUrls: cleanSubUrls,
          competitorUrls: cleanCompetitorUrls,
        }),
      });

      const businessData = await businessRes.json();

      if (!businessData.success) {
        if (businessData.error === 'UPGRADE_REQUIRED') {
          setUpgradeRequired(true);
        }
        setError(businessData.message || "Failed to create project");
        return;
      }

      const business = businessData.data;

      // Step 2: Create audit document and trigger the processing server
      await fetch("/api/audits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business._id,
          businessName: business.name,
          businessUrl: business.primaryUrl,
          businessType: business.category,
          category: business.category,
          description: business.description || business.category,
          subUrls: business.subUrls || [],
          competitorUrls: business.competitorUrls || [],
          language: "fr",
        }),
      });
      // Note: we don't fail if audit creation errors — the project is already created

      router.push(`/${session?.user?.username}/${business.slug}`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStep = STEPS[step];
  const StepIcon = currentStep?.icon ?? Globe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/syb_logo_transparent.png"
              alt="ShowYourBrand"
              width={40}
              height={40}
            />
            <span className="text-[26px] font-semibold text-gray-900 tracking-tight">
              ShowYourBrand
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-semibold text-gray-900 mb-2">
            {String(t("project.create"))}
          </h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "bg-orange-500 w-8"
                  : i < step
                    ? "bg-orange-400 w-3"
                    : "bg-white/60 w-3"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {String(t(`wizard.step${step}.title`))}
              </h2>
              <p className="text-sm text-gray-500">
                {String(t(`wizard.step${step}.subtitle`))}
              </p>
            </div>
          </div>

          {/* Step 0: Domain */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("project.name"))}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  placeholder="My Business"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("project.url"))}
                </label>
                <input
                  type="text"
                  value={primaryUrl}
                  onChange={(e) => setPrimaryUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          )}

          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {String(t("project.category"))}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                placeholder="e.g. Restaurant, SaaS, E-commerce..."
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {String(t("project.description"))}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none bg-white"
                rows={4}
                placeholder={String(t("wizard.descriptionPlaceholder"))}
                autoFocus
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/500
              </p>
            </div>
          )}

          {/* Step 3: Sub-URLs */}
          {step === 3 && (
            <div className="space-y-3">
              {subUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) =>
                      updateUrl(i, e.target.value, subUrls, setSubUrls)
                    }
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                    placeholder="https://example.com/page"
                  />
                  {subUrls.length > 1 && (
                    <button
                      onClick={() => removeUrl(i, subUrls, setSubUrls)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addUrl(subUrls, setSubUrls)}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
              >
                <Plus className="w-4 h-4" />
                {String(t("wizard.addUrl"))}
              </button>
            </div>
          )}

          {/* Step 4: Competitors */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">
                {String(t("wizard.competitorLimit"))}
              </p>
              {competitorUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) =>
                      updateUrl(
                        i,
                        e.target.value,
                        competitorUrls,
                        setCompetitorUrls,
                      )
                    }
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                    placeholder="https://competitor.com"
                  />
                  {competitorUrls.length > 1 && (
                    <button
                      onClick={() =>
                        removeUrl(i, competitorUrls, setCompetitorUrls)
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addUrl(competitorUrls, setCompetitorUrls)}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
              >
                <Plus className="w-4 h-4" />
                {String(t("wizard.addCompetitor"))}
              </button>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase">
                    {String(t("project.name"))}
                  </span>
                  <p className="font-medium text-gray-900">{name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">
                    {String(t("project.url"))}
                  </span>
                  <p className="font-medium text-gray-900">{primaryUrl}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">
                    {String(t("project.category"))}
                  </span>
                  <p className="font-medium text-gray-900">{category}</p>
                </div>
                {description && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("project.description"))}
                    </span>
                    <p className="text-sm text-gray-700">{description}</p>
                  </div>
                )}
                {subUrls.filter((u) => u.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("project.subUrls"))}
                    </span>
                    {subUrls
                      .filter((u) => u.trim())
                      .map((url, i) => (
                        <p key={i} className="text-sm text-gray-700">
                          {url}
                        </p>
                      ))}
                  </div>
                )}
                {competitorUrls.filter((u) => u.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("project.competitors"))}
                    </span>
                    {competitorUrls
                      .filter((u) => u.trim())
                      .map((url, i) => (
                        <p key={i} className="text-sm text-gray-700">
                          {url}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <p>{error}</p>
              {upgradeRequired && (
                <Link
                  href="/settings"
                  className="mt-2 inline-flex items-center gap-1 text-orange-600 font-medium hover:underline"
                >
                  {String(t("nav.settings"))} →
                </Link>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {String(t("common.back"))}
            </button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 disabled:opacity-50 rounded-full px-6"
              >
                {String(t("common.next"))}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 disabled:opacity-50 rounded-full px-6"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {String(t("project.create"))}
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
