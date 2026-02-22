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
    "dashboard.projectsSubtitle": "Gérez vos projets et lancez des audits GEO",
    "dashboard.audits": "Mes audits",
    "dashboard.settings": "Paramètres",
    "dashboard.geoScore": "Score GEO",
    "dashboard.lastAudit": "Dernier audit",
    "dashboard.startAudit": "Lancer un audit",
    "dashboard.viewReport": "Voir le rapport",
    "dashboard.noProjects": "Aucun projet pour le moment",
    "dashboard.createProject": "Créer un projet",
    "dashboard.credits": "Crédits",
    "dashboard.upgradePlan": "Améliorer le plan",
    "dashboard.newProject": "Nouveau projet",
    "dashboard.totalProjects": "Projets",
    "dashboard.totalAudits": "Audits",
    "dashboard.avgScore": "Score moyen",
    "dashboard.creditsUsed": "Crédits utilisés",
    "dashboard.recentAudits": "Audits récents",
    "dashboard.viewAllAudits": "Voir tous les audits",
    "dashboard.noAuditsYet": "Aucun audit pour le moment",
    "dashboard.projectsDescription": "Gérez vos emplacements commerciaux et suivez leur performance de visibilité GEO sur différents marchés.",
    "dashboard.createNewProject": "Créer un nouveau projet",
    "dashboard.startTracking": "Commencer le suivi d'une entreprise",
    "dashboard.visibilityScore": "Score de visibilité",
    "dashboard.allProjects": "Tous les projets",
    "dashboard.feedback": "Feedback",
    "dashboard.newAudit": "Nouvel audit",
    "dashboard.business": "Entreprise",
    "dashboard.auditsRemaining": "Audits restants",
    "dashboard.buyMore": "Acheter plus",

    // Display Name
    "displayName.title": "Comment souhaitez-vous être appelé ?",
    "displayName.subtitle": "Ce nom sera utilisé pour vous accueillir dans votre dashboard",
    "displayName.label": "Votre prénom ou surnom",
    "displayName.placeholder": "Ex: Marie, Max, JD...",
    "displayName.confirm": "Confirmer",

    // Username
    "username.title": "Choisissez votre nom d'utilisateur",
    "username.subtitle": "Ce nom sera utilisé dans l'URL de votre profil",
    "username.label": "Nom d'utilisateur",
    "username.minLength": "Au moins 3 caractères requis",
    "username.available": "Ce nom d'utilisateur est disponible !",
    "username.confirm": "Confirmer",

    // Projects
    "project.create": "Créer un projet",
    "project.name": "Nom du projet",
    "project.url": "URL principale",
    "project.competitors": "URLs concurrents",
    "project.category": "Catégorie d'activité",
    "project.description": "Description",
    "project.subUrls": "Pages supplémentaires",
    "project.save": "Enregistrer",
    "project.cancel": "Annuler",
    "project.delete": "Supprimer",
    "project.deleteConfirm": "Supprimer ce projet et tous ses audits ? Cette action est irréversible.",
    "project.edit": "Modifier",
    "project.noAuditYet": "Aucun audit",
    "project.emptyStateDesc": "Créez votre premier projet pour commencer à auditer votre visibilité IA",
    "project.runAudit": "Lancer l'audit",
    "project.auditComingSoon": "La fonctionnalité d'audit arrive bientôt !",
    "project.noScoreYet": "Pas encore de score",
    "project.runAuditToSeeScore": "Lancez un audit pour obtenir votre score GEO",
    "project.auditQueued": "L'audit est en file d'attente et sera traité sous peu.",
    "project.auditRunning": "L'audit IA est en cours. Cela peut prendre quelques minutes.",
    "project.autoRefresh": "Mise à jour automatique toutes les 12 secondes",
    "project.auditFailed": "Une erreur est survenue pendant l'audit.",
    "project.retryAudit": "Relancer l'audit",
    "project.auditCompleted": "Audit terminé",
    "project.auditCompletedDesc": "Votre rapport GEO est prêt. Consultez les résultats détaillés.",
    "project.viewFullReport": "Voir le rapport complet",
    "project.competitiveGap": "Écart concurrentiel",
    "project.competitorAnalysisAfterAudit": "L'analyse concurrentielle sera disponible après un audit",
    "project.noCompetitors": "Aucun concurrent ajouté",
    "project.recentActivity": "Activité récente",
    "project.noActivityYet": "Aucune activité pour le moment",
    "project.recommendationPlaceholder": "Recommandations",
    "project.recommendationPlaceholderDesc": "Lancez un audit pour obtenir des recommandations d'optimisation personnalisées.",
    "project.details": "Détails du projet",

    // Wizard
    "wizard.step0.title": "Domaine",
    "wizard.step0.subtitle": "Quel site voulez-vous auditer ?",
    "wizard.step1.title": "Secteur",
    "wizard.step1.subtitle": "Dans quel domaine d'activité ?",
    "wizard.step2.title": "Description",
    "wizard.step2.subtitle": "Décrivez votre entreprise (optionnel)",
    "wizard.step3.title": "Pages supplémentaires",
    "wizard.step3.subtitle": "Ajoutez des pages spécifiques à auditer",
    "wizard.step4.title": "Concurrents",
    "wizard.step4.subtitle": "Avec qui voulez-vous vous comparer ?",
    "wizard.step5.title": "Confirmation",
    "wizard.step5.subtitle": "Vérifiez les informations de votre projet",
    "wizard.descriptionPlaceholder": "Décrivez votre entreprise en quelques mots...",
    "wizard.addUrl": "Ajouter une URL",
    "wizard.addCompetitor": "Ajouter un concurrent",
    "wizard.competitorLimit": "Ajoutez les URLs de vos concurrents",

    // Settings
    "settings.profile": "Profil",
    "settings.subscription": "Abonnement",
    "settings.security": "Sécurité",
    "settings.dangerZone": "Zone de danger",
    "settings.language": "Langue",
    "settings.currentPlan": "Plan actuel",
    "settings.manageSubscription": "Gérer l'abonnement",
    "settings.currentPassword": "Mot de passe actuel",
    "settings.newPassword": "Nouveau mot de passe",
    "settings.confirmNewPassword": "Confirmer le nouveau mot de passe",
    "settings.changePassword": "Changer le mot de passe",
    "settings.passwordChanged": "Mot de passe modifié avec succès",
    "settings.deleteAccount": "Supprimer mon compte",
    "settings.deleteWarning": "Cette action est irréversible. Toutes vos données seront supprimées.",
    "settings.typeDelete": "Tapez DELETE pour confirmer",
    "settings.confirmDelete": "Supprimer définitivement",
    "settings.noChanges": "Aucun changement à enregistrer",
    "settings.usernameSaved": "Nom d'utilisateur mis à jour",
    "settings.auditCreditsRemaining": "Crédits d'audit restants",
    "settings.buyCredits": "Acheter des crédits",
    "settings.buyCreditsSubtitle": "Ajoutez des crédits d'audit à votre compte",
    "settings.perAudit": "par audit",
    "settings.includes": "Inclut",
    "settings.buyNow": "Acheter maintenant",
    "settings.popular": "Populaire",

    // Audits
    "audit.status.pending": "En attente",
    "audit.status.processing": "En cours",
    "audit.status.completed": "Terminé",
    "audit.status.failed": "Échec",
    "audit.progress": "Progression",
    "audit.startedAt": "Démarré le",
    "audit.completedAt": "Terminé le",
    "audit.download": "Télécharger le rapport",
    "audit.listTitle": "Tous les audits",
    "audit.listSubtitle": "Suivez l'évolution de votre visibilité IA",
    "audit.filterAll": "Tous",
    "audit.filterCompleted": "Terminés",
    "audit.filterProcessing": "En cours",
    "audit.filterPending": "En attente",
    "audit.viewReport": "Voir le rapport",
    "audit.noAudits": "Aucun audit trouvé",
    "audit.engines": "Moteurs IA testés",
    "audit.detailTitle": "Rapport d'audit",
    "audit.scoreBreakdown": "Score par moteur IA",
    "audit.recommendations": "Recommandations",
    "audit.htmlScanResults": "Résultats du scan HTML",
    "audit.competitorComparison": "Comparaison concurrents",
    "audit.downloadPdf": "Télécharger PDF",
    "audit.comingSoon": "Bientôt disponible",
    "audit.priority.high": "Haute",
    "audit.priority.medium": "Moyenne",
    "audit.priority.low": "Basse",
    "audit.categoryScores": "Scores par catégorie",
    "audit.schemaOrg": "Schema.org",
    "audit.metaTags": "Balises meta",
    "audit.headings": "Structure titres",
    "audit.altText": "Textes alt",
    "audit.keywords": "Mots-clés",

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
    "dashboard.projectsSubtitle": "Manage your projects and launch GEO audits",
    "dashboard.audits": "My Audits",
    "dashboard.settings": "Settings",
    "dashboard.geoScore": "GEO Score",
    "dashboard.lastAudit": "Last Audit",
    "dashboard.startAudit": "Start Audit",
    "dashboard.viewReport": "View Report",
    "dashboard.noProjects": "No projects yet",
    "dashboard.createProject": "Create Project",
    "dashboard.credits": "Credits",
    "dashboard.upgradePlan": "Upgrade Plan",
    "dashboard.newProject": "New Project",
    "dashboard.totalProjects": "Projects",
    "dashboard.totalAudits": "Audits",
    "dashboard.avgScore": "Avg Score",
    "dashboard.creditsUsed": "Credits Used",
    "dashboard.recentAudits": "Recent Audits",
    "dashboard.viewAllAudits": "View All Audits",
    "dashboard.noAuditsYet": "No audits yet",
    "dashboard.projectsDescription": "Manage your business locations and track their GEO visibility performance across different markets.",
    "dashboard.createNewProject": "Create New Project",
    "dashboard.startTracking": "Start tracking a new business",
    "dashboard.visibilityScore": "Visibility Score",
    "dashboard.allProjects": "All Projects",
    "dashboard.feedback": "Feedback",
    "dashboard.newAudit": "New Audit",
    "dashboard.business": "Business",
    "dashboard.auditsRemaining": "Audits remaining",
    "dashboard.buyMore": "Buy more",

    // Display Name
    "displayName.title": "What should we call you?",
    "displayName.subtitle": "This name will be used to greet you in your dashboard",
    "displayName.label": "Your first name or nickname",
    "displayName.placeholder": "E.g. Marie, Max, JD...",
    "displayName.confirm": "Confirm",

    // Username
    "username.title": "Choose your username",
    "username.subtitle": "This will be used in your profile URL",
    "username.label": "Username",
    "username.minLength": "At least 3 characters required",
    "username.available": "This username is available!",
    "username.confirm": "Confirm",

    // Projects
    "project.create": "Create Project",
    "project.name": "Project Name",
    "project.url": "Primary URL",
    "project.competitors": "Competitor URLs",
    "project.category": "Business Category",
    "project.description": "Description",
    "project.subUrls": "Additional Pages",
    "project.save": "Save",
    "project.cancel": "Cancel",
    "project.delete": "Delete",
    "project.deleteConfirm": "Delete this project and all its audits? This action cannot be undone.",
    "project.edit": "Edit",
    "project.noAuditYet": "No audit yet",
    "project.emptyStateDesc": "Create your first project to start auditing your AI visibility",
    "project.runAudit": "Run Audit",
    "project.auditComingSoon": "Audit feature coming soon!",
    "project.noScoreYet": "No score yet",
    "project.runAuditToSeeScore": "Run an audit to get your GEO score",
    "project.auditQueued": "The audit is queued and will be processed shortly.",
    "project.auditRunning": "The AI audit is running. This may take a few minutes.",
    "project.autoRefresh": "Auto-refreshing every 12 seconds",
    "project.auditFailed": "An error occurred during the audit.",
    "project.retryAudit": "Retry Audit",
    "project.auditCompleted": "Audit Complete",
    "project.auditCompletedDesc": "Your GEO report is ready. View the detailed results.",
    "project.viewFullReport": "View Full Report",
    "project.competitiveGap": "Competitive Gap",
    "project.competitorAnalysisAfterAudit": "Competitive analysis will be available after an audit",
    "project.noCompetitors": "No competitors added",
    "project.recentActivity": "Recent Activity",
    "project.noActivityYet": "No activity yet",
    "project.recommendationPlaceholder": "Recommendations",
    "project.recommendationPlaceholderDesc": "Run an audit to get personalized optimization recommendations.",
    "project.details": "Project Details",

    // Wizard
    "wizard.step0.title": "Domain",
    "wizard.step0.subtitle": "Which website do you want to audit?",
    "wizard.step1.title": "Category",
    "wizard.step1.subtitle": "What business sector?",
    "wizard.step2.title": "Description",
    "wizard.step2.subtitle": "Describe your business (optional)",
    "wizard.step3.title": "Additional Pages",
    "wizard.step3.subtitle": "Add specific pages to audit",
    "wizard.step4.title": "Competitors",
    "wizard.step4.subtitle": "Who do you want to compare with?",
    "wizard.step5.title": "Confirmation",
    "wizard.step5.subtitle": "Review your project information",
    "wizard.descriptionPlaceholder": "Describe your business in a few words...",
    "wizard.addUrl": "Add URL",
    "wizard.addCompetitor": "Add competitor",
    "wizard.competitorLimit": "Add your competitor URLs",

    // Settings
    "settings.profile": "Profile",
    "settings.subscription": "Subscription",
    "settings.security": "Security",
    "settings.dangerZone": "Danger Zone",
    "settings.language": "Language",
    "settings.currentPlan": "Current Plan",
    "settings.manageSubscription": "Manage Subscription",
    "settings.currentPassword": "Current Password",
    "settings.newPassword": "New Password",
    "settings.confirmNewPassword": "Confirm New Password",
    "settings.changePassword": "Change Password",
    "settings.passwordChanged": "Password changed successfully",
    "settings.deleteAccount": "Delete My Account",
    "settings.deleteWarning": "This action is irreversible. All your data will be permanently deleted.",
    "settings.typeDelete": "Type DELETE to confirm",
    "settings.confirmDelete": "Delete Permanently",
    "settings.noChanges": "No changes to save",
    "settings.usernameSaved": "Username updated",
    "settings.auditCreditsRemaining": "Audit credits remaining",
    "settings.buyCredits": "Buy Credits",
    "settings.buyCreditsSubtitle": "Add audit credits to your account",
    "settings.perAudit": "per audit",
    "settings.includes": "Includes",
    "settings.buyNow": "Buy Now",
    "settings.popular": "Popular",

    // Audits
    "audit.status.pending": "Pending",
    "audit.status.processing": "Processing",
    "audit.status.completed": "Completed",
    "audit.status.failed": "Failed",
    "audit.progress": "Progress",
    "audit.startedAt": "Started",
    "audit.completedAt": "Completed",
    "audit.download": "Download Report",
    "audit.listTitle": "All Audits",
    "audit.listSubtitle": "Track your AI visibility over time",
    "audit.filterAll": "All",
    "audit.filterCompleted": "Completed",
    "audit.filterProcessing": "Processing",
    "audit.filterPending": "Pending",
    "audit.viewReport": "View Report",
    "audit.noAudits": "No audits found",
    "audit.engines": "AI Engines Tested",
    "audit.detailTitle": "Audit Report",
    "audit.scoreBreakdown": "Score by AI Engine",
    "audit.recommendations": "Recommendations",
    "audit.htmlScanResults": "HTML Scan Results",
    "audit.competitorComparison": "Competitor Comparison",
    "audit.downloadPdf": "Download PDF",
    "audit.comingSoon": "Coming Soon",
    "audit.priority.high": "High",
    "audit.priority.medium": "Medium",
    "audit.priority.low": "Low",
    "audit.categoryScores": "Category Scores",
    "audit.schemaOrg": "Schema.org",
    "audit.metaTags": "Meta Tags",
    "audit.headings": "Heading Structure",
    "audit.altText": "Alt Text",
    "audit.keywords": "Keywords",

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
