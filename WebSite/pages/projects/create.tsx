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
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

const STEPS = [
  { key: "domain", icon: Globe },
  { key: "location", icon: MapPin },
  { key: "category", icon: Briefcase },
  { key: "description", icon: FileText },
  { key: "details", icon: Sparkles },
  { key: "subUrls", icon: Link2 },
  { key: "competitors", icon: Users },
  { key: "confirm", icon: CheckCircle },
] as const;

const LAST_STEP = STEPS.length - 1; // 7

/**
 * Category presets — values match the canonical types recognised by the
 * Python locality classifier (server/src/services/locality_classifier.py).
 * Picking a preset sends one of these values to the backend so prompt
 * generation and locality auto-classification both work out of the box.
 */
const CATEGORY_PRESETS = [
  { value: "saas", labelKey: "wizard.catSaas", descKey: "wizard.catSaasDesc" },
  { value: "e-commerce", labelKey: "wizard.catEcommerce", descKey: "wizard.catEcommerceDesc" },
  { value: "restaurant", labelKey: "wizard.catRestaurant", descKey: "wizard.catRestaurantDesc" },
  { value: "boutique", labelKey: "wizard.catShop", descKey: "wizard.catShopDesc" },
  { value: "clinic", labelKey: "wizard.catHealth", descKey: "wizard.catHealthDesc" },
  { value: "gym", labelKey: "wizard.catFitness", descKey: "wizard.catFitnessDesc" },
  { value: "hotel", labelKey: "wizard.catHotel", descKey: "wizard.catHotelDesc" },
  { value: "agency", labelKey: "wizard.catAgency", descKey: "wizard.catAgencyDesc" },
  { value: "media", labelKey: "wizard.catMedia", descKey: "wizard.catMediaDesc" },
] as const;

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [category, setCategory] = useState("");
  const [categoryCustom, setCategoryCustom] = useState(false);
  const [description, setDescription] = useState("");
  const [subUrls, setSubUrls] = useState<string[]>([""]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
  const [competitorNames, setCompetitorNames] = useState<string[]>([""]);
  const [localityTier, setLocalityTier] = useState<
    "" | "global" | "national" | "hyper_local"
  >("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [region, setRegion] = useState("");
  // Extended business context (new step 4)
  const [servicesOrProducts, setServicesOrProducts] = useState<string[]>([""]);
  const [targetKeywords, setTargetKeywords] = useState<string[]>([""]);
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState<string[]>([""]);
  const [targetAudience, setTargetAudience] = useState("");
  const [priceRange, setPriceRange] = useState<"" | "budget" | "mid" | "premium">("");
  const [yearFounded, setYearFounded] = useState("");
  const [certifications, setCertifications] = useState<string[]>([""]);
  const [socialMediaUrls, setSocialMediaUrls] = useState<string[]>([""]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && !session?.user?.username) {
      router.push("/username-setup");
    }
  }, [status, session, router]);

  /**
   * Look up an i18n key, preferring a category-specific override when one
   * exists. Example: tCat("wizard.servicesPlaceholder") will try
   * "wizard.servicesPlaceholder.saas" first when category === "saas",
   * then fall back to the generic key.
   */
  const tCat = (baseKey: string): string => {
    if (category && !categoryCustom) {
      const specificKey = `${baseKey}.${category}`;
      const specific = t(specificKey);
      if (typeof specific === "string" && specific !== specificKey) {
        return specific;
      }
    }
    return String(t(baseKey));
  };

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
        return true; // Location is optional
      case 2:
        return category.trim().length > 0;
      case 3:
      case 4: // Business details — all fields optional
      case 5:
      case 6:
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (step < LAST_STEP && canProceed()) {
        setStep(step + 1);
      } else if (step === LAST_STEP && !submitting) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const cleanList = (list: string[]) =>
        list.map((s) => s.trim()).filter((s) => s.length > 0);

      const cleanSubUrls = cleanList(subUrls);
      const cleanCompetitorUrls = cleanList(competitorUrls);
      const cleanCompetitorNames = cleanList(competitorNames);
      const cleanServices = cleanList(servicesOrProducts);
      const cleanKeywords = cleanList(targetKeywords);
      const cleanUsp = cleanList(uniqueSellingPoints);
      const cleanCertifications = cleanList(certifications);
      const cleanSocials = cleanList(socialMediaUrls);

      const parsedYear = yearFounded.trim()
        ? parseInt(yearFounded.trim(), 10)
        : undefined;
      const yearValue =
        parsedYear !== undefined && Number.isFinite(parsedYear)
          ? parsedYear
          : undefined;

      // Filter location fields based on the chosen tier so we don't send
      // hyper-local details for a global business (and vice versa).
      const locationPayload: {
        city?: string;
        country?: string;
        neighborhood?: string;
        street?: string;
        region?: string;
      } = {};
      if (localityTier === "hyper_local") {
        if (city.trim()) locationPayload.city = city.trim();
        if (country.trim()) locationPayload.country = country.trim();
        if (neighborhood.trim()) locationPayload.neighborhood = neighborhood.trim();
        if (street.trim()) locationPayload.street = street.trim();
        if (region.trim()) locationPayload.region = region.trim();
      } else if (localityTier === "national") {
        if (country.trim()) locationPayload.country = country.trim();
      } else if (localityTier === "") {
        // No tier picked → send whatever the user typed (legacy behavior)
        if (city.trim()) locationPayload.city = city.trim();
        if (country.trim()) locationPayload.country = country.trim();
        if (neighborhood.trim()) locationPayload.neighborhood = neighborhood.trim();
        if (street.trim()) locationPayload.street = street.trim();
        if (region.trim()) locationPayload.region = region.trim();
      }
      // localityTier === "global" → no location fields at all

      // Step 1: Create the business — persist full context so re-audits keep it
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
          // Locality
          localityTier: localityTier || undefined,
          ...locationPayload,
          // Extended context
          targetKeywords: cleanKeywords,
          servicesOrProducts: cleanServices,
          uniqueSellingPoints: cleanUsp,
          targetAudience: targetAudience.trim() || undefined,
          priceRange: priceRange || undefined,
          yearFounded: yearValue,
          certifications: cleanCertifications,
          socialMediaUrls: cleanSocials,
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
          competitorNames: cleanCompetitorNames,
          language,
          localityTier: localityTier || undefined,
          ...locationPayload,
          targetKeywords: cleanKeywords,
          servicesOrProducts: cleanServices,
          uniqueSellingPoints: cleanUsp,
          targetAudience: targetAudience.trim() || undefined,
          priceRange: priceRange || undefined,
          yearFounded: yearValue,
          certifications: cleanCertifications,
          socialMediaUrls: cleanSocials,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100 flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-lg my-auto">
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 shadow-sm" onKeyDown={handleKeyDown}>
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

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Locality tier picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {String(t("wizard.tierLabel"))}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "global", labelKey: "wizard.tierGlobal", descKey: "wizard.tierGlobalDesc" },
                      { value: "national", labelKey: "wizard.tierNational", descKey: "wizard.tierNationalDesc" },
                      { value: "hyper_local", labelKey: "wizard.tierLocal", descKey: "wizard.tierLocalDesc" },
                    ] as const
                  ).map((opt) => {
                    const selected = localityTier === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLocalityTier(opt.value)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          selected
                            ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {String(t(opt.labelKey))}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {String(t(opt.descKey))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* No tier selected → hint */}
              {localityTier === "" && (
                <p className="text-xs text-gray-500">
                  {String(t("wizard.tierHint"))}
                </p>
              )}

              {/* GLOBAL → no fields */}
              {localityTier === "global" && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                  {String(t("wizard.tierGlobalNote"))}
                </div>
              )}

              {/* NATIONAL → country only */}
              {localityTier === "national" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {String(t("wizard.country"))}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                    placeholder={String(t("wizard.countryPlaceholder"))}
                    autoFocus
                  />
                </div>
              )}

              {/* HYPER_LOCAL → all fields */}
              {localityTier === "hyper_local" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {String(t("wizard.city"))}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      placeholder={String(t("wizard.cityPlaceholder"))}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {String(t("wizard.country"))}
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      placeholder={String(t("wizard.countryPlaceholder"))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {String(t("wizard.region"))}{" "}
                      <span className="text-xs text-gray-400">
                        ({String(t("wizard.optional"))})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      placeholder={String(t("wizard.regionPlaceholder"))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {String(t("wizard.neighborhood"))}{" "}
                      <span className="text-xs text-gray-400">
                        ({String(t("wizard.optional"))})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      placeholder={String(t("wizard.neighborhoodPlaceholder"))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {String(t("wizard.street"))}{" "}
                      <span className="text-xs text-gray-400">
                        ({String(t("wizard.optional"))})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      placeholder={String(t("wizard.streetPlaceholder"))}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_PRESETS.map((preset) => {
                  const selected = !categoryCustom && category === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setCategory(preset.value);
                        setCategoryCustom(false);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selected
                          ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {String(t(preset.labelKey))}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {String(t(preset.descKey))}
                      </div>
                    </button>
                  );
                })}
                {/* "Other" card */}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryCustom(true);
                    setCategory("");
                  }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    categoryCustom
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {String(t("wizard.catOther"))}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {String(t("wizard.catOtherDesc"))}
                  </div>
                </button>
              </div>

              {/* Free-text input only when "Other" is selected */}
              {categoryCustom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {String(t("wizard.catCustomLabel"))}
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                    placeholder={String(t("wizard.catCustomPlaceholder"))}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Description */}
          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {String(t("project.description"))}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none bg-white"
                rows={4}
                placeholder={tCat("wizard.descriptionPlaceholder")}
                autoFocus
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/500
              </p>
            </div>
          )}

          {/* Step 4: Business details — extended context for more precise audit */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                {String(t("wizard.detailsHelper"))}
              </p>

              {/* Services / products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("wizard.services"))}{" "}
                  <span className="text-xs text-gray-400">
                    ({String(t("wizard.optional"))})
                  </span>
                </label>
                <div className="space-y-2">
                  {servicesOrProducts.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) =>
                          updateUrl(
                            i,
                            e.target.value,
                            servicesOrProducts,
                            setServicesOrProducts,
                          )
                        }
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                        placeholder={tCat("wizard.servicesPlaceholder")}
                      />
                      {servicesOrProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeUrl(i, servicesOrProducts, setServicesOrProducts)
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {servicesOrProducts.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addUrl(servicesOrProducts, setServicesOrProducts)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                      {String(t("wizard.addItem"))}
                    </button>
                  )}
                </div>
              </div>

              {/* Target keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("wizard.keywords"))}{" "}
                  <span className="text-xs text-gray-400">
                    ({String(t("wizard.optional"))})
                  </span>
                </label>
                <div className="space-y-2">
                  {targetKeywords.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) =>
                          updateUrl(i, e.target.value, targetKeywords, setTargetKeywords)
                        }
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                        placeholder={tCat("wizard.keywordsPlaceholder")}
                      />
                      {targetKeywords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrl(i, targetKeywords, setTargetKeywords)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {targetKeywords.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addUrl(targetKeywords, setTargetKeywords)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                      {String(t("wizard.addItem"))}
                    </button>
                  )}
                </div>
              </div>

              {/* Unique selling points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("wizard.usp"))}{" "}
                  <span className="text-xs text-gray-400">
                    ({String(t("wizard.optional"))})
                  </span>
                </label>
                <div className="space-y-2">
                  {uniqueSellingPoints.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) =>
                          updateUrl(
                            i,
                            e.target.value,
                            uniqueSellingPoints,
                            setUniqueSellingPoints,
                          )
                        }
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                        placeholder={tCat("wizard.uspPlaceholder")}
                      />
                      {uniqueSellingPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeUrl(i, uniqueSellingPoints, setUniqueSellingPoints)
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {uniqueSellingPoints.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addUrl(uniqueSellingPoints, setUniqueSellingPoints)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                      {String(t("wizard.addItem"))}
                    </button>
                  )}
                </div>
              </div>

              {/* Target audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("wizard.audience"))}{" "}
                  <span className="text-xs text-gray-400">
                    ({String(t("wizard.optional"))})
                  </span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  placeholder={tCat("wizard.audiencePlaceholder")}
                  maxLength={200}
                />
              </div>

              {/* Price range + Year founded */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {String(t("wizard.priceRange"))}{" "}
                    <span className="text-xs text-gray-400">
                      ({String(t("wizard.optional"))})
                    </span>
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) =>
                      setPriceRange(
                        e.target.value as "" | "budget" | "mid" | "premium",
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">—</option>
                    <option value="budget">{String(t("wizard.priceBudget"))}</option>
                    <option value="mid">{String(t("wizard.priceMid"))}</option>
                    <option value="premium">{String(t("wizard.pricePremium"))}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {String(t("wizard.yearFounded"))}{" "}
                    <span className="text-xs text-gray-400">
                      ({String(t("wizard.optional"))})
                    </span>
                  </label>
                  <input
                    type="number"
                    value={yearFounded}
                    onChange={(e) => setYearFounded(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                    placeholder="2015"
                    min={1800}
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("wizard.certifications"))}{" "}
                  <span className="text-xs text-gray-400">
                    ({String(t("wizard.optional"))})
                  </span>
                </label>
                <div className="space-y-2">
                  {certifications.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) =>
                          updateUrl(i, e.target.value, certifications, setCertifications)
                        }
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                        placeholder={tCat("wizard.certificationsPlaceholder")}
                      />
                      {certifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrl(i, certifications, setCertifications)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {certifications.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addUrl(certifications, setCertifications)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                      {String(t("wizard.addItem"))}
                    </button>
                  )}
                </div>
              </div>

              {/* Social media URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("wizard.socials"))}{" "}
                  <span className="text-xs text-gray-400">
                    ({String(t("wizard.optional"))})
                  </span>
                </label>
                <div className="space-y-2">
                  {socialMediaUrls.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) =>
                          updateUrl(i, e.target.value, socialMediaUrls, setSocialMediaUrls)
                        }
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                        placeholder={String(t("wizard.socialsPlaceholder"))}
                      />
                      {socialMediaUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrl(i, socialMediaUrls, setSocialMediaUrls)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {socialMediaUrls.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addUrl(socialMediaUrls, setSocialMediaUrls)}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                      {String(t("wizard.addItem"))}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Sub-URLs */}
          {step === 5 && (
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
              {subUrls.length < 3 && (
                <button
                  onClick={() => addUrl(subUrls, setSubUrls)}
                  className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                >
                  <Plus className="w-4 h-4" />
                  {String(t("wizard.addUrl"))}
                </button>
              )}
            </div>
          )}

          {/* Step 6: Competitors */}
          {step === 6 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">
                {String(t("wizard.competitorLimit"))}
              </p>
              {competitorUrls.map((url, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={competitorNames[i] || ""}
                        onChange={(e) =>
                          updateUrl(
                            i,
                            e.target.value,
                            competitorNames,
                            setCompetitorNames,
                          )
                        }
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                        placeholder={String(t("wizard.competitorNamePlaceholder"))}
                      />
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
                    </div>
                    {competitorUrls.length > 1 && (
                      <button
                        onClick={() => {
                          removeUrl(i, competitorUrls, setCompetitorUrls);
                          removeUrl(i, competitorNames, setCompetitorNames);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {competitorUrls.length < 3 && (
                <button
                  onClick={() => {
                    addUrl(competitorUrls, setCompetitorUrls);
                    addUrl(competitorNames, setCompetitorNames);
                  }}
                  className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                >
                  <Plus className="w-4 h-4" />
                  {String(t("wizard.addCompetitor"))}
                </button>
              )}
            </div>
          )}

          {/* Step 7: Confirmation */}
          {step === 7 && (
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
                {localityTier && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.tierLabel"))}
                    </span>
                    <p className="font-medium text-gray-900">
                      {String(
                        t(
                          localityTier === "global"
                            ? "wizard.tierGlobal"
                            : localityTier === "national"
                              ? "wizard.tierNational"
                              : "wizard.tierLocal",
                        ),
                      )}
                    </p>
                  </div>
                )}
                {localityTier !== "global" &&
                  (city.trim() ||
                    country.trim() ||
                    neighborhood.trim() ||
                    street.trim() ||
                    region.trim()) && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        {String(t("wizard.location"))}
                      </span>
                      <p className="font-medium text-gray-900">
                        {[
                          street.trim(),
                          neighborhood.trim(),
                          city.trim(),
                          region.trim(),
                          country.trim(),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                <div>
                  <span className="text-xs text-gray-500 uppercase">
                    {String(t("project.category"))}
                  </span>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const preset = CATEGORY_PRESETS.find(
                        (p) => p.value === category,
                      );
                      return preset ? String(t(preset.labelKey)) : category;
                    })()}
                  </p>
                </div>
                {description && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("project.description"))}
                    </span>
                    <p className="text-sm text-gray-700">{description}</p>
                  </div>
                )}
                {servicesOrProducts.filter((v) => v.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.services"))}
                    </span>
                    <p className="text-sm text-gray-700">
                      {servicesOrProducts
                        .filter((v) => v.trim())
                        .join(" • ")}
                    </p>
                  </div>
                )}
                {targetKeywords.filter((v) => v.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.keywords"))}
                    </span>
                    <p className="text-sm text-gray-700">
                      {targetKeywords.filter((v) => v.trim()).join(", ")}
                    </p>
                  </div>
                )}
                {uniqueSellingPoints.filter((v) => v.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.usp"))}
                    </span>
                    <p className="text-sm text-gray-700">
                      {uniqueSellingPoints
                        .filter((v) => v.trim())
                        .join(" • ")}
                    </p>
                  </div>
                )}
                {targetAudience.trim() && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.audience"))}
                    </span>
                    <p className="text-sm text-gray-700">{targetAudience}</p>
                  </div>
                )}
                {(priceRange || yearFounded.trim()) && (
                  <div className="flex gap-6">
                    {priceRange && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">
                          {String(t("wizard.priceRange"))}
                        </span>
                        <p className="text-sm text-gray-700">
                          {String(
                            t(
                              priceRange === "budget"
                                ? "wizard.priceBudget"
                                : priceRange === "mid"
                                  ? "wizard.priceMid"
                                  : "wizard.pricePremium",
                            ),
                          )}
                        </p>
                      </div>
                    )}
                    {yearFounded.trim() && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">
                          {String(t("wizard.yearFounded"))}
                        </span>
                        <p className="text-sm text-gray-700">{yearFounded}</p>
                      </div>
                    )}
                  </div>
                )}
                {certifications.filter((v) => v.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.certifications"))}
                    </span>
                    <p className="text-sm text-gray-700">
                      {certifications.filter((v) => v.trim()).join(", ")}
                    </p>
                  </div>
                )}
                {socialMediaUrls.filter((v) => v.trim()).length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      {String(t("wizard.socials"))}
                    </span>
                    {socialMediaUrls
                      .filter((v) => v.trim())
                      .map((url, i) => (
                        <p key={i} className="text-sm text-gray-700">
                          {url}
                        </p>
                      ))}
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
                          {competitorNames[i]?.trim()
                            ? `${competitorNames[i].trim()} — ${url}`
                            : url}
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
                  {String(t("wizard.upgradeOrBuyCredits"))} →
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

            {step < LAST_STEP ? (
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
