import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

// Define available languages
export type Language = "fr" | "en";

// Define the shape of translations
type TranslationDictionary = {
  [key: string]: string | string[];
};

type Translations = {
  [key in Language]: TranslationDictionary;
};

// Define language context type
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string | string[];
};

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Translation object with both languages
export const translations: Translations = {
  fr: {
    // Navigation
    "nav.features": "Fonctionnalités",
    "nav.pricing": "Tarifs",
    "nav.docs": "Documentation",
    "nav.contact": "Contact",
    "btn.login": "Connexion",
    "btn.signup": "Créer un compte",
    "btn.logout": "Déconnexion",
    "btn.dashboard": "Tableau de bord",
    "btn.startAudit": "Lancer un audit",

    // Hero Section
    "hero.title": "Rendez votre entreprise visible dans les IA",
    "hero.subtitle": "Plateforme d'audit GEO (Generative Engine Optimization)",
    "hero.description":
      "Testez votre visibilité sur ChatGPT, Claude, Perplexity et DeepSeek. Obtenez des recommandations concrètes pour être cité par les moteurs IA.",
    "hero.cta": "Commencer l'audit",
    "hero.demo": "Voir la démo",

    // Features
    "features.title": "Optimisez votre visibilité IA",
    "features.subtitle":
      "Une plateforme complète pour mesurer et améliorer votre présence dans les moteurs de recherche IA",
    "features.geoScore.title": "Score GEO Health",
    "features.geoScore.desc":
      "Mesurez votre visibilité avec un score de 0 à 100% basé sur 100 tests de prompts",
    "features.analysis.title": "Analyse technique",
    "features.analysis.desc":
      "Scannez votre HTML, schema markup, meta tags et structure de contenu",
    "features.recommendations.title": "Recommandations IA",
    "features.recommendations.desc":
      "Recevez des suggestions actionables avec code copy-paste ready",
    "features.reports.title": "Rapports professionnels",
    "features.reports.desc":
      "Générez des PDF avec résumé exécutif et détails techniques",
    "features.competitors.title": "Comparaison concurrents",
    "features.competitors.desc":
      "Comparez votre visibilité avec jusqu'à 5 concurrents",
    "features.tracking.title": "Suivi historique",
    "features.tracking.desc":
      "Trackez l'évolution de votre score GEO dans le temps",

    // Pricing
    "pricing.title": "Tarifs simples et transparents",
    "pricing.subtitle": "Choisissez le plan adapté à vos besoins",
    "pricing.monthly": "par mois",
    "pricing.oneShot": "One-shot",
    "pricing.basic.title": "Basic",
    "pricing.basic.price": "50€",
    "pricing.basic.period": "/mois",
    "pricing.basic.projects": "1 projet",
    "pricing.basic.features": [
      "1 projet (website)",
      "100 tests de prompts IA",
      "Rapports GEO complets",
      "Recommandations IA",
      "Support par email",
    ],
    "pricing.pro.title": "Pro",
    "pricing.pro.price": "150€",
    "pricing.pro.period": "/mois",
    "pricing.pro.projects": "5 projets",
    "pricing.pro.badge": "Populaire",
    "pricing.pro.features": [
      "5 projets (websites)",
      "100 tests par projet",
      "Rapports GEO complets",
      "Recommandations IA",
      "Support prioritaire",
    ],
    "pricing.premium.title": "Premium",
    "pricing.premium.price": "300€",
    "pricing.premium.period": "/mois",
    "pricing.premium.projects": "10+ projets",
    "pricing.premium.features": [
      "10+ projets (websites)",
      "100 tests par projet",
      "Rapports white-label",
      "Recommandations IA",
      "Support prioritaire",
      "Branding personnalisé",
    ],
    "pricing.oneShot.title": "Audit unique",
    "pricing.oneShot.price": "299€",
    "pricing.oneShot.features": [
      "1 audit GEO complet",
      "100 tests de prompts",
      "Rapport PDF détaillé",
      "Recommandations IA",
    ],
    "pricing.cta": "Choisir ce plan",

    // Dashboard
    "dashboard.welcome": "Bienvenue",
    "dashboard.projects": "Mes projets",
    "dashboard.audits": "Mes audits",
    "dashboard.settings": "Paramètres",
    "dashboard.geoScore": "Score GEO",
    "dashboard.lastAudit": "Dernier audit",
    "dashboard.startAudit": "Lancer un audit",
    "dashboard.viewReport": "Voir le rapport",
    "dashboard.noProjects": "Aucun projet pour le moment",
    "dashboard.createProject": "Créer un projet",

    // Projects
    "project.create": "Créer un projet",
    "project.name": "Nom du projet",
    "project.url": "URL principale",
    "project.competitors": "URLs concurrents",
    "project.category": "Catégorie d'activité",
    "project.save": "Enregistrer",
    "project.cancel": "Annuler",
    "project.delete": "Supprimer",
    "project.edit": "Modifier",

    // Audits
    "audit.status.pending": "En attente",
    "audit.status.processing": "En cours",
    "audit.status.completed": "Terminé",
    "audit.status.failed": "Échec",
    "audit.progress": "Progression",
    "audit.startedAt": "Démarré le",
    "audit.completedAt": "Terminé le",
    "audit.download": "Télécharger le rapport",

    // Forms
    "form.email": "Email",
    "form.password": "Mot de passe",
    "form.confirmPassword": "Confirmer le mot de passe",
    "form.name": "Nom",
    "form.company": "Entreprise",
    "form.required": "Champ requis",
    "form.invalidEmail": "Email invalide",
    "form.passwordMismatch": "Les mots de passe ne correspondent pas",
    "form.submit": "Envoyer",
    "form.cancel": "Annuler",

    // Auth
    "auth.login": "Connexion",
    "auth.signup": "Créer un compte",
    "auth.logout": "Déconnexion",
    "auth.forgotPassword": "Mot de passe oublié ?",
    "auth.noAccount": "Pas encore de compte ?",
    "auth.hasAccount": "Déjà un compte ?",
    "auth.signupWith": "S'inscrire avec",
    "auth.loginWith": "Se connecter avec",
    "auth.google": "Google",
    "auth.orEmail": "ou avec votre email",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.view": "Voir",
    "common.back": "Retour",
    "common.next": "Suivant",
    "common.previous": "Précédent",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.sort": "Trier",

    // Footer
    "footer.product": "Produit",
    "footer.company": "Entreprise",
    "footer.legal": "Légal",
    "footer.features": "Fonctionnalités",
    "footer.pricing": "Tarifs",
    "footer.docs": "Documentation",
    "footer.about": "À propos",
    "footer.contact": "Contact",
    "footer.privacy": "Confidentialité",
    "footer.terms": "Conditions d'utilisation",
    "footer.rights": "Tous droits réservés",
  },
  en: {
    // Navigation
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.docs": "Documentation",
    "nav.contact": "Contact",
    "btn.login": "Sign In",
    "btn.signup": "Sign Up",
    "btn.logout": "Sign Out",
    "btn.dashboard": "Dashboard",
    "btn.startAudit": "Start Audit",

    // Hero Section
    "hero.title": "Make Your Business Visible in AI",
    "hero.subtitle": "GEO (Generative Engine Optimization) Audit Platform",
    "hero.description":
      "Test your visibility on ChatGPT, Claude, Perplexity, and DeepSeek. Get concrete recommendations to be cited by AI search engines.",
    "hero.cta": "Start Audit",
    "hero.demo": "View Demo",

    // Features
    "features.title": "Optimize Your AI Visibility",
    "features.subtitle":
      "A complete platform to measure and improve your presence in AI search engines",
    "features.geoScore.title": "GEO Health Score",
    "features.geoScore.desc":
      "Measure your visibility with a 0-100% score based on 100 prompt tests",
    "features.analysis.title": "Technical Analysis",
    "features.analysis.desc":
      "Scan your HTML, schema markup, meta tags, and content structure",
    "features.recommendations.title": "AI Recommendations",
    "features.recommendations.desc":
      "Receive actionable suggestions with copy-paste ready code",
    "features.reports.title": "Professional Reports",
    "features.reports.desc":
      "Generate PDFs with executive summary and technical details",
    "features.competitors.title": "Competitor Comparison",
    "features.competitors.desc":
      "Compare your visibility with up to 5 competitors",
    "features.tracking.title": "Historical Tracking",
    "features.tracking.desc":
      "Track the evolution of your GEO score over time",

    // Pricing
    "pricing.title": "Simple, Transparent Pricing",
    "pricing.subtitle": "Choose the plan that fits your needs",
    "pricing.monthly": "per month",
    "pricing.oneShot": "One-shot",
    "pricing.basic.title": "Basic",
    "pricing.basic.price": "€50",
    "pricing.basic.period": "/mo",
    "pricing.basic.projects": "1 project",
    "pricing.basic.features": [
      "1 project (website)",
      "100 AI prompt tests",
      "Full GEO reports",
      "AI recommendations",
      "Email support",
    ],
    "pricing.pro.title": "Pro",
    "pricing.pro.price": "€150",
    "pricing.pro.period": "/mo",
    "pricing.pro.projects": "5 projects",
    "pricing.pro.badge": "Popular",
    "pricing.pro.features": [
      "5 projects (websites)",
      "100 tests per project",
      "Full GEO reports",
      "AI recommendations",
      "Priority support",
    ],
    "pricing.premium.title": "Premium",
    "pricing.premium.price": "€300",
    "pricing.premium.period": "/mo",
    "pricing.premium.projects": "10+ projects",
    "pricing.premium.features": [
      "10+ projects (websites)",
      "100 tests per project",
      "White-label reports",
      "AI recommendations",
      "Priority support",
      "Custom branding",
    ],
    "pricing.oneShot.title": "Single Audit",
    "pricing.oneShot.price": "€299",
    "pricing.oneShot.features": [
      "1 comprehensive GEO audit",
      "100 prompt tests",
      "Detailed PDF report",
      "AI recommendations",
    ],
    "pricing.cta": "Choose Plan",

    // Dashboard
    "dashboard.welcome": "Welcome",
    "dashboard.projects": "My Projects",
    "dashboard.audits": "My Audits",
    "dashboard.settings": "Settings",
    "dashboard.geoScore": "GEO Score",
    "dashboard.lastAudit": "Last Audit",
    "dashboard.startAudit": "Start Audit",
    "dashboard.viewReport": "View Report",
    "dashboard.noProjects": "No projects yet",
    "dashboard.createProject": "Create Project",

    // Projects
    "project.create": "Create Project",
    "project.name": "Project Name",
    "project.url": "Primary URL",
    "project.competitors": "Competitor URLs",
    "project.category": "Business Category",
    "project.save": "Save",
    "project.cancel": "Cancel",
    "project.delete": "Delete",
    "project.edit": "Edit",

    // Audits
    "audit.status.pending": "Pending",
    "audit.status.processing": "Processing",
    "audit.status.completed": "Completed",
    "audit.status.failed": "Failed",
    "audit.progress": "Progress",
    "audit.startedAt": "Started",
    "audit.completedAt": "Completed",
    "audit.download": "Download Report",

    // Forms
    "form.email": "Email",
    "form.password": "Password",
    "form.confirmPassword": "Confirm Password",
    "form.name": "Name",
    "form.company": "Company",
    "form.required": "Required field",
    "form.invalidEmail": "Invalid email",
    "form.passwordMismatch": "Passwords don't match",
    "form.submit": "Submit",
    "form.cancel": "Cancel",

    // Auth
    "auth.login": "Sign In",
    "auth.signup": "Sign Up",
    "auth.logout": "Sign Out",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.signupWith": "Sign up with",
    "auth.loginWith": "Sign in with",
    "auth.google": "Google",
    "auth.orEmail": "or with your email",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",

    // Footer
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.features": "Features",
    "footer.pricing": "Pricing",
    "footer.docs": "Documentation",
    "footer.about": "About",
    "footer.contact": "Contact",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms of Service",
    "footer.rights": "All rights reserved",
  },
};

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language | null;
    if (savedLang && (savedLang === "en" || savedLang === "fr")) {
      setLanguageState(savedLang);
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Translation function
  const t = (key: string): string | string[] => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
